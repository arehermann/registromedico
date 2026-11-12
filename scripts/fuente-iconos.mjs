// Descarga de Google Fonts solo los íconos de Material Symbols que usa la app (unos KB en vez de 5 MB).
// Volver a correr después de usar un ícono nuevo: npm run iconos
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const raiz = new URL('..', import.meta.url).pathname
const archivos = []
const recorrer = (d) => readdirSync(d).forEach((f) => (statSync(join(d, f)).isDirectory() ? recorrer(join(d, f)) : /\.jsx?$/.test(f) && archivos.push(join(d, f))))
recorrer(join(raiz, 'src'))

// Cualquier texto entre comillas con forma de nombre de ícono; los que no existen se ignoran
const nombres = new Set()
for (const f of archivos) for (const m of readFileSync(f, 'utf8').matchAll(/["'`]([a-z][a-z0-9_]{1,40})["'`]/g)) nombres.add(m[1])
const lista = [...nombres].sort()

const ua = { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36' }
const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,500,0..1,0&icon_names=${lista.join(',')}&display=block`, { headers: ua })).text()
const url = css.match(/url\((https:[^)]+)\)/)?.[1]
if (!url) throw new Error('Google Fonts no devolvió la fuente:\n' + css)
const fuente = Buffer.from(await (await fetch(url, { headers: ua })).arrayBuffer())
writeFileSync(join(raiz, 'src/assets/material-symbols-rounded.woff2'), fuente)
console.log(`✓ ${lista.length} nombres revisados, fuente de ${(fuente.length / 1024).toFixed(1)} KB`)
