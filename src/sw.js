import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'

// Guarda la app completa en el celular para que abra sin internet
cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('message', (e) => {
  if (e.data?.tipo === 'actualizar') self.skipWaiting()
})

// Botones "Tomada" / "Posponer 15 min" de la notificación de medicación
self.addEventListener('notificationclick', (e) => {
  const { tratamientoId, turno } = e.notification.data ?? {}
  const accion = e.action || 'abrir'
  e.notification.close()
  e.waitUntil(
    (async () => {
      const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const mensaje = { tipo: 'accion-dosis', accion, tratamientoId, turno }
      if (ventanas.length) {
        ventanas[0].postMessage(mensaje)
        if (accion === 'abrir') await ventanas[0].focus()
        return
      }
      const q = new URLSearchParams({ accion, t: tratamientoId ?? '', turno: turno ?? '' })
      await self.clients.openWindow(`./#/?${q}`)
    })(),
  )
})
