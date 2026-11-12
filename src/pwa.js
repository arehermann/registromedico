import { registerSW } from 'virtual:pwa-register'

// Service worker: la app queda guardada para abrir sin internet y se actualiza sola al publicar cambios
export const actualizarSW = registerSW({ immediate: true })

// Botón "Instalar app": Chrome en Android avisa con beforeinstallprompt cuando se puede instalar
let eventoInstalar = null
const oyentes = new Set()
const avisar = () => oyentes.forEach((f) => f())

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  eventoInstalar = e
  avisar()
})
window.addEventListener('appinstalled', () => {
  eventoInstalar = null
  avisar()
})

export const estaInstalada = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
export const esIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
export const puedeInstalar = () => !!eventoInstalar

export function escucharInstalacion(f) {
  oyentes.add(f)
  return () => oyentes.delete(f)
}

export async function instalar() {
  if (!eventoInstalar) return false
  eventoInstalar.prompt()
  const { outcome } = await eventoInstalar.userChoice
  eventoInstalar = null
  avisar()
  return outcome === 'accepted'
}

// Notificaciones
export const notificacionesDisponibles = () => 'Notification' in window && 'serviceWorker' in navigator
export const permisoNotificaciones = () => (notificacionesDisponibles() ? Notification.permission : 'unsupported')

export async function pedirPermisoNotificaciones() {
  if (!notificacionesDisponibles()) return 'unsupported'
  return Notification.requestPermission()
}

export async function mostrarNotificacion(titulo, opciones) {
  if (permisoNotificaciones() !== 'granted') return false
  const reg = await navigator.serviceWorker.ready
  await reg.showNotification(titulo, { icon: './icono-192.png', badge: './icono-badge.png', ...opciones })
  return true
}
