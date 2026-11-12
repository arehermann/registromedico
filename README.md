# FamLog · Registro médico familiar

App para que los padres lleven el control de salud de sus hijos: ficha de emergencia, tratamientos con recordatorios, historia clínica de visitas, síntomas y respaldo compartido entre padres. Pensada para funcionar 100 % offline y sin nube.

## Estado

**Paso 2: app funcional e instalable.**

- Los datos se guardan solo en el celular (IndexedDB). Nada sale del teléfono salvo el respaldo que vos compartas y los documentos que mandes a leer con IA.
- Lectura de documentos con IA: una foto o PDF de una receta o informe completa la visita (y sus tratamientos) para revisarla antes de guardar. Pasa por un servidor propio en la Raspberry que guarda la clave de la API de Claude; ver [`server/README.md`](server/README.md). Los documentos quedan adjuntos a la visita y viajan en el respaldo.
- Se instala desde el navegador ("Instalar" en Android, "Agregar a inicio" en iPhone) y abre sin internet.
- Respaldo entre padres: se comparte un archivo `.json` y, al importarlo, en cada registro queda la versión modificada más recientemente. Los borrados también se sincronizan.
- Recordatorios de medicación con "Tomada" y "Posponer 15 min". Como app web solo avisan con la app abierta o en segundo plano reciente; los avisos con la app cerrada llegan con la versión Android (paso 3).
- Para probar sin cargar datos reales: "Probar con datos de ejemplo" en la pantalla inicial (se borran desde Ajustes).

Plan:

1. ~~Prototipo de pantallas~~
2. App funcional offline e instalable (este paso)
3. Versión Android con Capacitor y notificaciones nativas
4. Publicación en Google Play

## Pantallas

| Ruta | Pantalla |
| --- | --- |
| `#/` | Inicio: hijos, próximas tomas, registro rápido |
| `#/hijo/nuevo` · `#/hijo/editar` | Agregar o editar hijo |
| `#/perfil` | Ficha del niño (datos de emergencia) |
| `#/tratamientos` | Tratamientos, condiciones y medicación de rescate |
| `#/tratamientos/nuevo` | Nuevo tratamiento |
| `#/visitas` | Historia clínica con buscador y filtros |
| `#/visitas/nueva` | Registrar visita (con documentos adjuntos) |
| `#/documento` | Leer una receta o informe con IA |
| `#/sintomas` · `#/sintomas/nuevo` | Historial y registro de síntomas |
| `#/respaldo` | Compartir entre padres |
| `#/configuracion` | Ajustes |

## Desarrollo

```bash
npm install
npm run dev      # servidor local
npm run build    # genera dist/ con el service worker
npm run iconos   # vuelve a bajar la fuente de íconos después de usar uno nuevo
```

Los íconos PNG de la app se generan con `node scripts/iconos-app.cjs` (necesita Playwright).

Cada push a `main` publica la app en GitHub Pages (ver `.github/workflows/pages.yml`). Hay que activar Pages una vez en *Settings → Pages → Source: GitHub Actions*.
