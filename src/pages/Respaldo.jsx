import { useState } from 'react'
import { Boton, Card, Icon, Pagina } from '../components/ui'
import { useStore } from '../data/store'
import { armarRespaldo, nombreArchivo, validarRespaldo } from '../data/respaldo'
import { fechaCorta, hora } from '../data/fechas'

const ULTIMO = 'ultimo-respaldo'

function leerUltimo() {
  try {
    return localStorage.getItem(ULTIMO)
  } catch {
    return null
  }
}

export default function Respaldo() {
  const { datos, proveedores, importar } = useStore()
  const [resultado, setResultado] = useState(null)
  const [ultimo, setUltimo] = useState(leerUltimo)
  const [importando, setImportando] = useState(false)

  const archivo = () => new File([JSON.stringify(armarRespaldo(datos, proveedores))], nombreArchivo(), { type: 'application/json' })

  const marcar = () => {
    const f = new Date().toISOString()
    try {
      localStorage.setItem(ULTIMO, f)
    } catch {
      /* sin almacenamiento */
    }
    setUltimo(f)
  }

  const descargar = () => {
    const a = archivo()
    const url = URL.createObjectURL(a)
    const link = document.createElement('a')
    link.href = url
    link.download = a.name
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    marcar()
  }

  // En Android abre el menú de compartir (WhatsApp, correo, Drive…); si no se puede, descarga el archivo
  const compartir = async () => {
    const a = archivo()
    if (navigator.canShare?.({ files: [a] })) {
      try {
        await navigator.share({ files: [a], title: 'Respaldo de salud familiar' })
        marcar()
      } catch (e) {
        if (e.name !== 'AbortError') descargar()
      }
    } else descargar()
  }

  const alElegir = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setImportando(true)
    try {
      const json = validarRespaldo(JSON.parse(await f.text()))
      const total = await importar(json)
      setResultado({ ok: true, total, de: json.generado })
    } catch (err) {
      setResultado({ ok: false, mensaje: err instanceof SyntaxError ? 'El archivo está dañado o no es un respaldo.' : err.message })
    } finally {
      setImportando(false)
    }
  }

  return (
    <Pagina titulo="Compartir entre padres" subtitulo="Pasale tus datos al otro celular, sin nube." volver>
      <div className="space-y-4">
        <Card className="flex gap-4 items-start">
          <span className="w-12 h-12 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center shrink-0">
            <Icon name="lock" />
          </span>
          <div className="text-on-surface-variant space-y-2">
            <p>Los datos viven solo en este teléfono. Para sincronizar con el otro padre, mandale un respaldo por WhatsApp o correo y que lo importe.</p>
            <p>Al importar se combinan los dos: en cada registro queda la versión modificada más recientemente.</p>
          </div>
        </Card>

        <Boton className="w-full" icono="share" onClick={compartir}>
          Compartir respaldo
        </Boton>
        <Boton className="w-full" variante="secundario" icono="download" onClick={descargar}>
          Guardar archivo en el celular
        </Boton>
        {ultimo && (
          <p className="text-sm text-center text-on-surface-variant">
            Último respaldo: {fechaCorta(ultimo)}, {hora(ultimo)}
          </p>
        )}

        <div className="h-px bg-surface-highest my-2" />

        <label className={`min-h-12 rounded-full px-6 font-semibold flex items-center justify-center gap-2 bg-surface-container text-primary cursor-pointer ${importando ? 'opacity-60' : ''}`}>
          <Icon name="upload_file" /> {importando ? 'Importando…' : 'Importar respaldo recibido'}
          <input type="file" accept="application/json,.json" className="hidden" onChange={alElegir} disabled={importando} />
        </label>

        {resultado && (
          <Card className={`text-center ${resultado.ok ? '!bg-secondary-container/50' : '!bg-error-container'}`}>
            <Icon name={resultado.ok ? 'task_alt' : 'error'} className={`text-5xl mb-2 ${resultado.ok ? 'text-secondary' : 'text-error'}`} />
            {resultado.ok ? (
              <>
                <div className="font-display text-2xl font-bold">
                  {resultado.total === 0 ? 'Ya estaba todo al día' : resultado.total === 1 ? 'Se actualizó 1 registro' : `Se actualizaron ${resultado.total} registros`}
                </div>
                {resultado.de && <p className="text-on-surface-variant text-sm mt-1">Respaldo generado el {fechaCorta(resultado.de)}, {hora(resultado.de)}</p>}
              </>
            ) : (
              <div className="font-semibold text-on-error-container">{resultado.mensaje}</div>
            )}
          </Card>
        )}
      </div>
    </Pagina>
  )
}
