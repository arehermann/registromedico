import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// base relativa para que funcione en GitHub Pages (y luego dentro de Capacitor)
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    // App instalable que abre sin internet; el service worker propio (src/sw.js) maneja los botones de las notificaciones
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectRegister: false,
      injectManifest: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] },
      manifest: {
        name: 'Kindred Care · Salud familiar',
        short_name: 'Kindred Care',
        description: 'Registro de salud de tus hijos: ficha de emergencia, tratamientos, visitas y síntomas.',
        lang: 'es-UY',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f7f9ff',
        theme_color: '#005da7',
        icons: [
          { src: 'icono-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icono-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icono-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
