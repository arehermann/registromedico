import { COLECCIONES } from './db'

export const VERSION_RESPALDO = 1

export function armarRespaldo(datos, proveedores) {
  const r = { app: 'kindred-care', version: VERSION_RESPALDO, generado: new Date().toISOString(), proveedores }
  for (const c of COLECCIONES) r[c] = datos[c]
  return r
}

export function nombreArchivo() {
  const d = new Date()
  const f = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return `respaldo-salud-${f}.json`
}

export function validarRespaldo(json) {
  if (!json || json.app !== 'kindred-care') throw new Error('Ese archivo no es un respaldo de Kindred Care.')
  if (json.version > VERSION_RESPALDO) throw new Error('El respaldo viene de una versión más nueva de la app. Actualizá la app y probá de nuevo.')
  return json
}

// Fusión por registro: si el id no existe localmente se agrega; si existe, gana el que tenga
// `modificado` más reciente. Devuelve qué hay que guardar y cuántos registros cambiaron.
export function fusionar(locales, entrantes) {
  const porId = new Map(locales.map((r) => [r.id, r]))
  const cambios = []
  for (const r of entrantes ?? []) {
    if (!r?.id) continue
    const actual = porId.get(r.id)
    if (!actual || (r.modificado ?? '') > (actual.modificado ?? '')) cambios.push(r)
  }
  return cambios
}
