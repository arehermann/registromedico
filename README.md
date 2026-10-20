# Kindred Care · Registro médico familiar

App para que los padres lleven el control de salud de sus hijos: ficha de emergencia, tratamientos con recordatorios, historia clínica de visitas, síntomas y respaldo compartido entre padres. Pensada para funcionar 100 % offline y sin nube.

## Estado

**Paso 1: prototipo de pantallas.** Todas las pantallas funcionan con datos de ejemplo en memoria (se reinician al recargar). El diseño sigue los bocetos de Stitch (sistema "Kindred Care").

Plan:

1. Prototipo de pantallas (este paso)
2. App funcional offline: guardado local real (IndexedDB), respaldo con fusión por fecha de modificación
3. Versión Android con Capacitor y notificaciones nativas
4. Publicación en Google Play

## Pantallas

| Ruta | Pantalla |
| --- | --- |
| `#/` | Inicio: hijos, próximas tomas, registro rápido |
| `#/hijo/nuevo` | Agregar hijo |
| `#/perfil` | Ficha del niño (datos de emergencia) |
| `#/tratamientos` | Tratamientos, condiciones y medicación de rescate |
| `#/tratamientos/nuevo` | Nuevo tratamiento |
| `#/visitas` | Historia clínica con buscador y filtros |
| `#/visitas/nueva` | Registrar visita |
| `#/sintomas` · `#/sintomas/nuevo` | Historial y registro de síntomas |
| `#/respaldo` | Compartir entre padres |
| `#/configuracion` | Ajustes |

## Desarrollo

```bash
npm install
npm run dev      # servidor local
npm run build    # genera dist/
```

Cada push a `main` publica la app en GitHub Pages (ver `.github/workflows/pages.yml`). Hay que activar Pages una vez en *Settings → Pages → Source: GitHub Actions*.
