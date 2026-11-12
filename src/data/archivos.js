// Prepara fotos y PDF para guardarlos en el celular y mandarlos a leer.
// Las fotos se achican a 1600 px: alcanza para leer la letra y el respaldo no pesa de más.

const MAX_PDF = 15 * 1024 * 1024
const LADO = 1600

function leerDataURL(archivo) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(archivo)
  })
}

function achicarImagen(archivo) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const escala = Math.min(1, LADO / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * escala)
      c.height = Math.round(img.height * escala)
      const ctx = c.getContext('2d')
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, c.width, c.height)
      ctx.drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(img.src)
      resolve(c.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => reject(new Error(`No se pudo abrir la imagen ${archivo.name}.`))
    img.src = URL.createObjectURL(archivo)
  })
}

export async function prepararArchivo(archivo) {
  if (archivo.type === 'application/pdf') {
    if (archivo.size > MAX_PDF) throw new Error(`${archivo.name} pesa más de 15 MB.`)
    return { nombre: archivo.name, tipo: 'application/pdf', datos: await leerDataURL(archivo) }
  }
  if (archivo.type.startsWith('image/')) {
    return { nombre: archivo.name.replace(/\.\w+$/, '') + '.jpg', tipo: 'image/jpeg', datos: await achicarImagen(archivo) }
  }
  throw new Error(`${archivo.name} no es un PDF ni una imagen.`)
}

export const pesoLegible = (dataURL) => {
  const bytes = Math.round(((dataURL?.length ?? 0) * 3) / 4)
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

// Abre el adjunto en otra pestaña (los navegadores no abren data URL directo)
export function abrirAdjunto(a) {
  const [cabecera, b64] = a.datos.split(',')
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  const url = URL.createObjectURL(new Blob([bytes], { type: cabecera.slice(5).split(';')[0] }))
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
