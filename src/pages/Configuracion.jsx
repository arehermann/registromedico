import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar, Icon, Pagina, Seccion } from '../components/ui'
import { useStore } from '../data/store'
import { edad } from '../data/fechas'

export default function Configuracion() {
  const { hijos, eliminarHijo, proveedores, agregarProveedor } = useStore()
  const [nuevo, setNuevo] = useState('')
  const [confirmar, setConfirmar] = useState(null)

  return (
    <Pagina titulo="Ajustes" volver>
      <Link to="/respaldo" className="flex items-center gap-4 bg-primary text-white rounded-3xl p-5 mb-6 shadow-float">
        <Icon name="sync_alt" className="text-3xl" />
        <div className="flex-1">
          <div className="font-semibold">Respaldo y compartir</div>
          <div className="text-sm opacity-90">Exportar o importar datos entre padres</div>
        </div>
        <Icon name="chevron_right" />
      </Link>

      <Seccion
        titulo="Hijos"
        accion={
          <Link to="/hijo/nuevo" className="text-primary font-semibold flex items-center gap-1 text-sm">
            <Icon name="add_circle" /> Agregar
          </Link>
        }
      >
        <div className="bg-surface-lowest rounded-3xl shadow-soft divide-y divide-surface-high">
          {hijos.map((h) => (
            <div key={h.id} className="flex items-center gap-3 p-4">
              <Avatar hijo={h} size="w-11 h-11" texto="text-base" />
              <div className="flex-1">
                <div className="font-semibold">{h.nombre}</div>
                <div className="text-sm text-on-surface-variant">{edad(h.nacimiento)}</div>
              </div>
              {confirmar === h.id ? (
                <div className="flex gap-1">
                  <button onClick={() => setConfirmar(null)} className="px-3 min-h-10 rounded-full text-sm font-semibold bg-surface-container">
                    No
                  </button>
                  <button
                    onClick={() => {
                      eliminarHijo(h.id)
                      setConfirmar(null)
                    }}
                    className="px-3 min-h-10 rounded-full text-sm font-semibold bg-error text-white"
                  >
                    Eliminar
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmar(h.id)} className="w-10 h-10 rounded-full text-on-surface-variant flex items-center justify-center" aria-label={`Eliminar a ${h.nombre}`}>
                  <Icon name="delete" />
                </button>
              )}
            </div>
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Lugares de atención">
        <div className="flex flex-wrap gap-2 mb-3">
          {proveedores.map((p) => (
            <span key={p} className="bg-surface-container rounded-full px-4 py-2 text-sm font-medium">
              {p}
            </span>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (nuevo.trim()) agregarProveedor(nuevo.trim())
            setNuevo('')
          }}
        >
          <input className="campo" placeholder="Agregar uno, ej. Médica Uruguaya" value={nuevo} onChange={(e) => setNuevo(e.target.value)} />
          <button className="w-12 shrink-0 rounded-xl bg-primary text-white flex items-center justify-center" aria-label="Agregar lugar">
            <Icon name="add" />
          </button>
        </form>
      </Seccion>

      <p className="text-center text-xs text-on-surface-variant mt-10">Prototipo · los cambios se borran al recargar la página</p>
    </Pagina>
  )
}
