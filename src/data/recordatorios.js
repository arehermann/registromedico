// Turnos de medicación. Un "turno" es el horario teórico de una dosis: inicio + k * cadaHoras.
const HORA = 3600_000

export function turnoActual(t, ahora = Date.now()) {
  if (t.estado !== 'en_curso' || !t.inicio || !t.cadaHoras) return null
  const inicio = new Date(t.inicio).getTime()
  const paso = t.cadaHoras * HORA
  const k = Math.floor((ahora - inicio) / paso)
  if (k < 0) return null
  const turno = inicio + k * paso
  if (t.duracionDias && turno >= inicio + t.duracionDias * 24 * HORA) return null
  return new Date(turno).toISOString()
}

// Dosis pendiente: el turno actual no se registró como tomado y no está pospuesto
export function dosisPendiente(t, tomas, ahora = Date.now()) {
  const turno = turnoActual(t, ahora)
  if (!turno) return null
  if (tomas.some((m) => m.tratamientoId === t.id && m.turno === turno)) return null
  const p = t.pospuesto
  if (p?.turno === turno && new Date(p.hasta).getTime() > ahora) return null
  return { turno, aviso: p?.turno === turno ? p.hasta : turno }
}

export function pendientes(tratamientos, tomas, ahora = Date.now()) {
  return tratamientos
    .filter((t) => t.notificaciones)
    .map((t) => ({ t, ...dosisPendiente(t, tomas, ahora) }))
    .filter((x) => x.turno)
}

export const POSPONER_MIN = 15

export function pospuesto(turno) {
  return { turno, hasta: new Date(Date.now() + POSPONER_MIN * 60_000).toISOString() }
}
