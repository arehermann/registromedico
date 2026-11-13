import { useEffect, useState } from 'react'
import { Icon } from './ui'
import { useStore } from '../data/store'
import { hora } from '../data/fechas'
import { POSPONER_MIN, pendientes, pospuesto } from '../data/recordatorios'
import { escucharInstalacion, esIOS, estaInstalada, instalar, notificacionesDisponibles, pedirPermisoNotificaciones, permisoNotificaciones, puedeInstalar } from '../pwa'

// Re-renderiza cada tanto para que las dosis pendientes aparezcan solas
export function useAhora(intervalo = 30_000) {
  const [ahora, setAhora] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), intervalo)
    return () => clearInterval(id)
  }, [intervalo])
  return ahora
}

const leer = (k) => {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}
const escribir = (k, v) => {
  try {
    localStorage.setItem(k, v)
  } catch {
    /* sin almacenamiento */
  }
}

export function DosisPendientes({ hijoId, mostrarNombre = false }) {
  const { tratamientos, tomas, hijos, registrarToma, actualizarTratamiento } = useStore()
  const ahora = useAhora()
  const lista = pendientes(
    tratamientos.filter((t) => !hijoId || t.hijoId === hijoId),
    tomas,
    ahora,
  )
  if (!lista.length) return null
  return (
    <div className="space-y-2 mb-4">
      {lista.map(({ t, turno }) => {
        const hijo = hijos.find((h) => h.id === t.hijoId)
        return (
          <div key={t.id} className="rounded-2xl bg-tertiary-fixed pl-4 pr-2 py-2 flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-tertiary">Dosis de las {hora(turno)}</div>
              <div className="font-medium leading-snug truncate">
                {mostrarNombre && hijo ? `${hijo.nombre}: ` : ''}
                {t.medicamento} {t.dosis}
              </div>
            </div>
            <button
              onClick={() => actualizarTratamiento(t.id, { pospuesto: pospuesto(turno) })}
              className="w-10 h-10 rounded-full text-tertiary flex items-center justify-center shrink-0"
              aria-label={`Posponer ${POSPONER_MIN} minutos`}
              title={`Posponer ${POSPONER_MIN} min`}
            >
              <Icon name="snooze" />
            </button>
            <button onClick={() => registrarToma(t.id, turno)} className="min-h-10 px-4 rounded-full bg-primary text-white font-semibold text-sm flex items-center gap-1 shrink-0">
              <Icon name="check" className="text-lg" /> Tomada
            </button>
          </div>
        )
      })}
    </div>
  )
}

function Banner({ icono, titulo, texto, accion, onCerrar }) {
  return (
    <div className="rounded-2xl bg-surface-lowest p-3 mb-3 flex gap-3 items-start">
      <span className="w-9 h-9 rounded-full bg-primary-fixed text-primary flex items-center justify-center shrink-0">
        <Icon name={icono} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-semibold">{titulo}</div>
        <p className="text-sm text-on-surface-variant">{texto}</p>
        {accion}
      </div>
      {onCerrar && (
        <button onClick={onCerrar} className="w-10 h-10 -m-1 rounded-full text-on-surface-variant flex items-center justify-center" aria-label="Cerrar aviso">
          <Icon name="close" />
        </button>
      )}
    </div>
  )
}

export function InstalarApp() {
  const [, refrescar] = useState(0)
  const [cerrado, setCerrado] = useState(() => leer('aviso-instalar') === 'cerrado')
  useEffect(() => escucharInstalacion(() => refrescar((n) => n + 1)), [])
  if (cerrado || estaInstalada()) return null
  const cerrar = () => {
    escribir('aviso-instalar', 'cerrado')
    setCerrado(true)
  }
  if (puedeInstalar())
    return (
      <Banner
        icono="install_mobile"
        titulo="Instalá la app en el celular"
        texto="Queda con su ícono en la pantalla de inicio y abre sin internet."
        onCerrar={cerrar}
        accion={
          <button onClick={instalar} className="mt-2 min-h-11 px-5 rounded-full bg-primary text-white font-semibold text-sm">
            Instalar
          </button>
        }
      />
    )
  if (esIOS())
    return (
      <Banner
        icono="ios_share"
        titulo="Instalala en tu iPhone"
        texto="En Safari tocá Compartir y después “Agregar a inicio”."
        onCerrar={cerrar}
      />
    )
  return null
}

export function ActivarRecordatorios() {
  const { tratamientos } = useStore()
  const [permiso, setPermiso] = useState(permisoNotificaciones)
  const hayConAviso = tratamientos.some((t) => t.estado === 'en_curso' && t.notificaciones)
  if (!hayConAviso || !notificacionesDisponibles() || permiso !== 'default') return null
  return (
    <Banner
      icono="notifications"
      titulo="Activá los recordatorios"
      texto="Te avisamos cuando toca cada dosis mientras la app esté abierta o en segundo plano."
      accion={
        <button onClick={async () => setPermiso(await pedirPermisoNotificaciones())} className="mt-2 min-h-11 px-5 rounded-full bg-primary text-white font-semibold text-sm">
          Activar
        </button>
      }
    />
  )
}
