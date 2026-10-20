import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base relativa para que funcione en GitHub Pages (y luego dentro de Capacitor)
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
