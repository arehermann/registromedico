// Habla con el servidor de FamLog en la Raspberry, que a su vez usa la API de Claude.
// La clave de la API vive solo en la Raspberry; acá se guarda la dirección y una contraseña propia.

const base = (cfg) => cfg.url.trim().replace(/\/+$/, '')

async function pedir(cfg, ruta, opciones = {}) {
  let r
  try {
    r = await fetch(base(cfg) + ruta, {
      ...opciones,
      headers: { Authorization: `Bearer ${cfg.clave}`, ...(opciones.body ? { 'Content-Type': 'application/json' } : {}) },
    })
  } catch {
    throw new Error('No se pudo conectar con la Raspberry. Revisá la dirección y que el servidor esté prendido.')
  }
  const cuerpo = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(cuerpo.error ?? `La Raspberry respondió con un error (${r.status}).`)
  return cuerpo
}

export const iaConfigurada = (cfg) => Boolean(cfg?.url && cfg?.clave)

export const probarConexion = (cfg) => pedir(cfg, '/salud')

export function leerDocumento(cfg, archivos, contexto) {
  return pedir(cfg, '/extraer', {
    method: 'POST',
    body: JSON.stringify({
      archivos: archivos.map((a) => ({ tipo: a.tipo, datos: a.datos.split(',')[1] })),
      contexto,
    }),
  })
}
