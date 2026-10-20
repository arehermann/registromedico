import { useState } from 'react'
import { Boton, Card, Icon, Pagina } from '../components/ui'
import { useStore } from '../data/store'

// Prototipo: el respaldo genera el archivo real (JSON) para ver el flujo; la fusión al importar es simulada.
export default function Respaldo() {
  const store = useStore()
  const [resultado, setResultado] = useState(null)
  const [generado, setGenerado] = useState(null)

  const generar = () => {
    const datos = {
      app: 'kindred-care',
      version: 1,
      generado: new Date().toISOString(),
      hijos: store.hijos,
      tratamientos: store.tratamientos,
      visitas: store.visitas,
      sintomas: store.sintomas,
      rescates: store.rescates,
    }
    const archivo = new File([JSON.stringify(datos, null, 2)], `respaldo-salud-${new Date().toISOString().slice(0, 10)}.json`, { type: 'application/json' })
    setGenerado(archivo)
    return archivo
  }

  const compartir = async () => {
    const archivo = generado ?? generar()
    if (navigator.canShare?.({ files: [archivo] })) {
      try {
        await navigator.share({ files: [archivo], title: 'Respaldo de salud familiar' })
      } catch {
        /* el usuario cerró el menú de compartir */
      }
    } else {
      const url = URL.createObjectURL(archivo)
      const a = document.createElement('a')
      a.href = url
      a.download = archivo.name
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const importar = (e) => {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    archivo.text().then((t) => {
      try {
        const d = JSON.parse(t)
        const total = ['hijos', 'tratamientos', 'visitas', 'sintomas', 'rescates'].reduce((n, k) => n + (d[k]?.length ?? 0), 0)
        setResultado({ ok: true, total })
      } catch {
        setResultado({ ok: false })
      }
    })
    e.target.value = ''
  }

  return (
    <Pagina titulo="Compartir entre padres" subtitulo="Pasale tus datos al otro celular, sin nube." volver>
      <div className="space-y-4">
        <Card className="flex gap-4 items-start">
          <span className="w-12 h-12 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center shrink-0">
            <Icon name="lock" />
          </span>
          <p className="text-on-surface-variant">
            Los datos viven solo en este teléfono. Para sincronizar con el otro padre, generá un respaldo y mandáselo por WhatsApp o correo. Al importarlo, se queda el dato más reciente de cada registro.
          </p>
        </Card>

        <Boton className="w-full" icono="backup" onClick={generar}>
          Generar respaldo
        </Boton>
        {generado && (
          <p className="text-sm text-center text-secondary font-semibold flex items-center justify-center gap-1">
            <Icon name="check_circle" className="text-base" fill /> Listo: {generado.name}
          </p>
        )}
        <Boton className="w-full" variante="secundario" icono="share" onClick={compartir}>
          Compartir
        </Boton>
        <label className="min-h-12 rounded-full px-6 font-semibold flex items-center justify-center gap-2 bg-surface-container text-primary cursor-pointer">
          <Icon name="download" /> Importar respaldo
          <input type="file" accept="application/json,.json" className="hidden" onChange={importar} />
        </label>

        {resultado && (
          <Card className={`text-center ${resultado.ok ? '!bg-secondary-container/50' : '!bg-error-container'}`}>
            <Icon name={resultado.ok ? 'task_alt' : 'error'} className="text-5xl text-secondary mb-2" />
            {resultado.ok ? (
              <>
                <div className="font-display text-2xl font-bold">Se actualizaron {resultado.total} registros</div>
                <p className="text-on-surface-variant text-sm mt-1">En el prototipo la fusión es de muestra; en la versión funcional se aplica de verdad.</p>
              </>
            ) : (
              <div className="font-semibold">Ese archivo no parece un respaldo de la app.</div>
            )}
          </Card>
        )}
      </div>
    </Pagina>
  )
}
