import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../data/store'
import { pendientes, pospuesto } from '../data/recordatorios'
import { mostrarNotificacion } from '../pwa'

const INTERVALO = 30_000

// Mientras la app está abierta (o en segundo plano reciente) revisa si toca alguna dosis y avisa.
// La web no permite programar avisos con la app cerrada: eso llega con la versión Android (paso 3).
export default function Recordatorios() {
  const store = useStore()
  const ref = useRef(store)
  ref.current = store
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()

  const aplicar = (accion, tratamientoId, turno) => {
    const s = ref.current
    if (!tratamientoId || !turno) return
    if (accion === 'tomada') s.registrarToma(tratamientoId, turno)
    else if (accion === 'posponer') s.actualizarTratamiento(tratamientoId, { pospuesto: pospuesto(turno) })
    else {
      const t = s.tratamientos.find((x) => x.id === tratamientoId)
      if (t) s.setHijoActivoId(t.hijoId)
      navigate('/')
    }
  }

  // Acciones que llegan desde el service worker con la app abierta
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const alRecibir = (e) => {
      if (e.data?.tipo === 'accion-dosis') aplicar(e.data.accion, e.data.tratamientoId, e.data.turno)
    }
    navigator.serviceWorker.addEventListener('message', alRecibir)
    return () => navigator.serviceWorker.removeEventListener('message', alRecibir)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Acciones que abrieron la app desde la notificación (app cerrada)
  useEffect(() => {
    if (!store.cargado || !params.get('accion')) return
    aplicar(params.get('accion'), params.get('t'), params.get('turno'))
    setParams({}, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.cargado, params])

  useEffect(() => {
    if (!store.cargado) return
    const revisar = () => {
      const s = ref.current
      for (const { t, turno, aviso } of pendientes(s.tratamientos, s.tomas)) {
        const clave = `avisado:${t.id}:${aviso}`
        try {
          if (localStorage.getItem(clave)) continue
          localStorage.setItem(clave, '1')
        } catch {
          /* sin almacenamiento: puede repetir el aviso */
        }
        const hijo = s.hijos.find((h) => h.id === t.hijoId)
        mostrarNotificacion(`Hora de la medicación de ${hijo?.nombre ?? ''}`, {
          body: `${t.medicamento} · ${t.dosis}`,
          tag: `dosis-${t.id}`,
          renotify: true,
          requireInteraction: true,
          data: { tratamientoId: t.id, turno },
          actions: [
            { action: 'tomada', title: 'Tomada' },
            { action: 'posponer', title: 'Posponer 15 min' },
          ],
        })
      }
    }
    revisar()
    const id = setInterval(revisar, INTERVALO)
    const alVolver = () => document.visibilityState === 'visible' && revisar()
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [store.cargado])

  return null
}
