// Puente entre FamLog y la API de Claude. Corre en la Raspberry y guarda la clave de la API,
// que nunca llega al celular. La app le manda el documento (PDF o fotos) y recibe los datos
// leídos, que la persona revisa antes de guardar.
import { createServer } from 'node:http'
import { readFileSync, writeFileSync } from 'node:fs'
import { timingSafeEqual } from 'node:crypto'
import Anthropic from '@anthropic-ai/sdk'
import { ESQUEMA, instrucciones } from './extraccion.js'

const PUERTO = Number(process.env.PORT) || 8787
const CLAVE = process.env.FAMLOG_CLAVE ?? ''
const ORIGENES = (process.env.FAMLOG_ORIGENES ?? 'https://arehermann.github.io').split(',').map((o) => o.trim()).filter(Boolean)
const MODELO = process.env.FAMLOG_MODELO || 'claude-opus-5-5'
const MAX_DIA = Number(process.env.FAMLOG_MAX_DIA) || 40
const MAX_CUERPO = 30 * 1024 * 1024
const TIPOS = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const ARCHIVO_USO = new URL('./uso.json', import.meta.url)

if (!process.env.ANTHROPIC_API_KEY) throw new Error('Falta ANTHROPIC_API_KEY en el archivo .env')
if (CLAVE.length < 12) throw new Error('FAMLOG_CLAVE tiene que tener al menos 12 caracteres')

const client = new Anthropic()

// Contador diario de documentos, para poner un tope al gasto
function leerUso() {
  try {
    return JSON.parse(readFileSync(ARCHIVO_USO, 'utf8'))
  } catch {
    return {}
  }
}
function sumarUso(entrada, salida) {
  const hoy = new Date().toISOString().slice(0, 10)
  const uso = leerUso()
  const d = (uso[hoy] ??= { documentos: 0, entrada: 0, salida: 0 })
  d.documentos++
  d.entrada += entrada
  d.salida += salida
  // Guardar solo los últimos 60 días
  for (const k of Object.keys(uso).sort().slice(0, -60)) delete uso[k]
  writeFileSync(ARCHIVO_USO, JSON.stringify(uso, null, 1))
}
const documentosHoy = () => leerUso()[new Date().toISOString().slice(0, 10)]?.documentos ?? 0

function claveValida(req) {
  const dada = Buffer.from((req.headers.authorization ?? '').replace(/^Bearer\s+/i, ''))
  const real = Buffer.from(CLAVE)
  return dada.length === real.length && timingSafeEqual(dada, real)
}

function responder(res, estado, cuerpo) {
  res.writeHead(estado, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(cuerpo))
}

function leerCuerpo(req) {
  return new Promise((resolve, reject) => {
    const partes = []
    let largo = 0
    req.on('data', (p) => {
      largo += p.length
      if (largo > MAX_CUERPO) {
        reject(Object.assign(new Error('El documento es demasiado grande (máximo 30 MB).'), { estado: 413 }))
        req.destroy()
      } else partes.push(p)
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(partes).toString('utf8')))
      } catch {
        reject(Object.assign(new Error('Pedido inválido.'), { estado: 400 }))
      }
    })
    req.on('error', reject)
  })
}

async function extraer({ archivos, contexto }) {
  if (!Array.isArray(archivos) || !archivos.length || archivos.length > 10)
    throw Object.assign(new Error('Mandá entre 1 y 10 archivos.'), { estado: 400 })
  const bloques = archivos.map((a) => {
    if (!TIPOS.has(a?.tipo) || typeof a.datos !== 'string') throw Object.assign(new Error('Solo se aceptan PDF o imágenes.'), { estado: 400 })
    const source = { type: 'base64', media_type: a.tipo, data: a.datos }
    return a.tipo === 'application/pdf' ? { type: 'document', source } : { type: 'image', source }
  })

  const respuesta = await client.beta.messages.create({
    model: MODELO,
    max_tokens: 16000,
    // Si el modelo declina el pedido, la API lo reintenta sola con el modelo de respaldo recomendado
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: instrucciones(contexto ?? {}),
    messages: [{ role: 'user', content: [...bloques, { type: 'text', text: 'Leé este documento médico y devolvé los datos.' }] }],
    output_config: { format: { type: 'json_schema', schema: ESQUEMA } },
  })

  sumarUso(respuesta.usage.input_tokens ?? 0, respuesta.usage.output_tokens ?? 0)

  if (respuesta.stop_reason === 'refusal') throw Object.assign(new Error('Claude no pudo procesar este documento.'), { estado: 422 })
  if (respuesta.stop_reason === 'max_tokens') throw Object.assign(new Error('El documento es demasiado largo para leerlo de una vez.'), { estado: 422 })
  const texto = respuesta.content.find((b) => b.type === 'text')?.text
  if (!texto) throw Object.assign(new Error('No llegó respuesta de Claude.'), { estado: 502 })

  return {
    datos: JSON.parse(texto),
    modelo: respuesta.model,
    uso: { entrada: respuesta.usage.input_tokens, salida: respuesta.usage.output_tokens },
  }
}

const servidor = createServer(async (req, res) => {
  const origen = req.headers.origin
  if (origen && ORIGENES.includes(origen)) {
    res.setHeader('Access-Control-Allow-Origin', origen)
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Max-Age', '86400')
  }
  if (req.method === 'OPTIONS') return res.writeHead(204).end()

  const ruta = new URL(req.url, 'http://x').pathname.replace(/\/+$/, '')
  if (!claveValida(req)) return responder(res, 401, { error: 'La contraseña no coincide con la del servidor.' })

  try {
    if (req.method === 'GET' && ruta === '/salud') {
      return responder(res, 200, { ok: true, modelo: MODELO, documentosHoy: documentosHoy(), maximoDiario: MAX_DIA })
    }
    if (req.method === 'POST' && ruta === '/extraer') {
      if (documentosHoy() >= MAX_DIA) return responder(res, 429, { error: `Ya se leyeron ${MAX_DIA} documentos hoy. Probá mañana o subí el tope en la Raspberry.` })
      const cuerpo = await leerCuerpo(req)
      return responder(res, 200, await extraer(cuerpo))
    }
    responder(res, 404, { error: 'No existe.' })
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return responder(res, 502, { error: 'La clave de la API de Claude en la Raspberry no es válida.' })
    if (e instanceof Anthropic.RateLimitError) return responder(res, 503, { error: 'Claude está ocupado. Probá en un rato.' })
    if (e instanceof Anthropic.BadRequestError) {
      console.error('Pedido rechazado por la API:', e.message)
      return responder(res, 422, { error: 'Claude no pudo leer ese archivo. Si pasa con todos, revisá que la cuenta de la API tenga saldo.' })
    }
    if (e instanceof Anthropic.APIError) {
      console.error('Error de la API:', e.status, e.message)
      return responder(res, 502, { error: 'Falló la conexión con Claude. Probá de nuevo.' })
    }
    if (e.estado) return responder(res, e.estado, { error: e.message })
    console.error(e)
    responder(res, 500, { error: 'Algo falló en el servidor.' })
  }
})

servidor.requestTimeout = 5 * 60 * 1000
servidor.listen(PUERTO, () => console.log(`FamLog IA escuchando en el puerto ${PUERTO} con ${MODELO}`))
