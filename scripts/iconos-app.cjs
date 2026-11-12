// Genera los íconos PNG de la app (manifest, iPhone y notificaciones) a partir del logo.
// Uso: node scripts/iconos-app.cjs   (requiere Playwright con Chromium instalado)
const path = require('path')
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright')

const logo = (fondo, escala) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  ${fondo ? `<rect width="64" height="64" fill="${fondo}"/>` : ''}
  <g transform="translate(32 32) scale(${escala}) translate(-32 -32)">
    <rect x="22" y="6" width="20" height="52" rx="8" fill="#4a90d6"/>
    <rect x="6" y="22" width="52" height="20" rx="8" fill="#4a90d6"/>
    <path d="M32 40l-6.5-6.4a4.2 4.2 0 016-6l.5.5.5-.5a4.2 4.2 0 016 6z" fill="#fcdc84"/>
  </g>
</svg>`

// Ícono monocromo para la barra de estado de Android
const badge = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect x="22" y="6" width="20" height="52" rx="8" fill="#fff"/>
  <rect x="6" y="22" width="52" height="20" rx="8" fill="#fff"/>
</svg>`

const salidas = [
  ['icono-192.png', 192, logo('#ffffff', 0.8)],
  ['icono-512.png', 512, logo('#ffffff', 0.8)],
  ['icono-maskable-512.png', 512, logo('#ffffff', 0.62)],
  ['apple-touch-icon.png', 180, logo('#ffffff', 0.78)],
  ['icono-badge.png', 96, badge],
]

;(async () => {
  const navegador = await chromium.launch()
  const pagina = await navegador.newPage()
  for (const [nombre, lado, svg] of salidas) {
    await pagina.setViewportSize({ width: lado, height: lado })
    await pagina.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${lado}px;height:${lado}px}</style>${svg}`)
    await pagina.screenshot({ path: path.join(__dirname, '..', 'public', nombre), omitBackground: true })
    console.log('✓', nombre)
  }
  await navegador.close()
})()
