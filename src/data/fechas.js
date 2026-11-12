const HORA = 3600_000

export function edad(nacimiento) {
  const n = new Date(nacimiento)
  const hoy = new Date()
  let anios = hoy.getFullYear() - n.getFullYear()
  const m = hoy.getMonth() - n.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < n.getDate())) anios--
  if (anios >= 2) return `${anios} años`
  const meses = anios * 12 + ((hoy.getMonth() - n.getMonth() + 12) % 12)
  return `${meses} meses`
}

export function fechaCorta(iso) {
  return new Date(iso.length === 10 ? `${iso}T12:00` : iso).toLocaleDateString('es-UY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function mesAnio(iso) {
  return new Date(`${iso.slice(0, 10)}T12:00`).toLocaleDateString('es-UY', { month: 'long', year: 'numeric' })
}

export function hora(iso) {
  return new Date(iso).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
}

export function haceCuanto(iso) {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 1) return 'Recién'
  if (min < 60) return `Hace ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `Hace ${h} h`
  const d = Math.round(h / 24)
  if (d === 1) return `Ayer, ${hora(iso)}`
  if (d < 7) return `Hace ${d} días`
  return fechaCorta(iso)
}

// Estado visual de un tratamiento: activo, por vencer (último día), vencido (pasó la duración y sigue abierto),
// pendiente (precargado sin iniciar) o finalizado.
export function estadoTratamiento(t) {
  if (t.estado === 'finalizado') return { clave: 'finalizado', texto: 'Finalizado' }
  if (t.estado === 'pendiente' || !t.inicio) return { clave: 'pendiente', texto: 'Sin iniciar' }
  if (!t.duracionDias) return { clave: 'activo', texto: 'Crónico' }
  const fin = new Date(t.inicio).getTime() + t.duracionDias * 24 * HORA
  const restante = fin - Date.now()
  if (restante <= 0) return { clave: 'vencido', texto: 'Terminó el plazo' }
  const dias = Math.ceil(restante / (24 * HORA))
  if (dias <= 1) return { clave: 'por_vencer', texto: 'Último día' }
  return { clave: 'activo', texto: `Quedan ${dias} días` }
}

export function proximaDosis(t) {
  if (!t.inicio || !t.cadaHoras || t.estado !== 'en_curso') return null
  const inicio = new Date(t.inicio).getTime()
  const paso = t.cadaHoras * HORA
  const n = Math.max(Math.ceil((Date.now() - inicio) / paso), 0)
  const prox = inicio + n * paso
  if (t.duracionDias && prox >= inicio + t.duracionDias * 24 * HORA) return null
  return new Date(prox)
}

// Avance del intervalo actual entre dosis (0 a 1), para el anillo de "próxima dosis".
export function avanceDosis(t) {
  const prox = proximaDosis(t)
  if (!prox) return 0
  const paso = t.cadaHoras * HORA
  return 1 - (prox.getTime() - Date.now()) / paso
}
