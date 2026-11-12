import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar, Icon, Pagina, Seccion } from '../components/ui'
import { useStore } from '../data/store'
import { edad } from '../data/fechas'
import { probarConexion } from '../data/ia'
import { esIOS, estaInstalada, instalar, mostrarNotificacion, notificacionesDisponibles, pedirPermisoNotificaciones, permisoNotificaciones, puedeInstalar } from '../pwa'

function Recordatorios() {
  const [permiso, setPermiso] = useState(permisoNotificaciones)
  const [probado, setProbado] = useState(false)
  const textos = {
    granted: 'Activados. Te avisamos cada dosis mientras la app esté abierta o en segundo plano.',
    denied: 'Bloqueados. Para activarlos, entrá a los ajustes del navegador o de la app y permití las notificaciones.',
    default: 'Todavía no los activaste.',
    unsupported: 'Este navegador no permite notificaciones. Instalá la app para usarlos.',
  }
  return (
    <div className="bg-surface-lowest rounded-3xl shadow-soft p-5 space-y-3">
      <p className="text-on-surface-variant">{textos[permiso]}</p>
      {permiso === 'default' && notificacionesDisponibles() && (
        <button onClick={async () => setPermiso(await pedirPermisoNotificaciones())} className="min-h-11 px-5 rounded-full bg-primary text-white font-semibold text-sm">
          Activar recordatorios
        </button>
      )}
      {permiso === 'granted' && (
        <button
          onClick={async () => setProbado(await mostrarNotificacion('Aviso de prueba', { body: 'Así te vamos a avisar cada dosis.', tag: 'prueba' }))}
          className="min-h-11 px-5 rounded-full bg-surface-container text-primary font-semibold text-sm"
        >
          {probado ? 'Aviso enviado' : 'Enviar aviso de prueba'}
        </button>
      )}
      <p className="text-xs text-on-surface-variant">Con la app totalmente cerrada el celular no puede avisar: esa parte llega con la versión de Google Play.</p>
    </div>
  )
}

function LecturaIA() {
  const { lecturaIA, setLecturaIA } = useStore()
  const [url, setUrl] = useState(lecturaIA?.url ?? '')
  const [clave, setClave] = useState(lecturaIA?.clave ?? '')
  const [estado, setEstado] = useState(null)
  const guardarYProbar = async (e) => {
    e.preventDefault()
    const cfg = { url: url.trim(), clave: clave.trim() }
    setLecturaIA(cfg)
    setEstado({ texto: 'Probando…' })
    try {
      const r = await probarConexion(cfg)
      setEstado({ ok: true, texto: `Conectada. Hoy se leyeron ${r.documentosHoy} de ${r.maximoDiario} documentos posibles.` })
    } catch (err) {
      setEstado({ ok: false, texto: err.message })
    }
  }
  return (
    <form onSubmit={guardarYProbar} className="bg-surface-lowest rounded-3xl shadow-soft p-5 space-y-3">
      <p className="text-on-surface-variant text-sm">Para sacar los datos de recetas e informes, la app usa el servidor de FamLog en tu Raspberry.</p>
      <label className="block">
        <span className="block text-sm font-semibold mb-1.5">Dirección del servidor</span>
        <input className="campo" type="url" inputMode="url" placeholder="https://famlog.tu-dominio.com" value={url} onChange={(e) => setUrl(e.target.value)} />
      </label>
      <label className="block">
        <span className="block text-sm font-semibold mb-1.5">Contraseña</span>
        <input className="campo" type="password" autoComplete="off" value={clave} onChange={(e) => setClave(e.target.value)} />
      </label>
      <button disabled={!url.trim() || !clave.trim()} className="min-h-11 px-5 rounded-full bg-primary text-white font-semibold text-sm disabled:opacity-50">
        Guardar y probar
      </button>
      {estado && <p className={`text-sm ${estado.ok === false ? 'text-error' : estado.ok ? 'text-secondary' : 'text-on-surface-variant'}`}>{estado.texto}</p>}
      <p className="text-xs text-on-surface-variant">Esto queda solo en este celular y no viaja en los respaldos.</p>
    </form>
  )
}

export default function Configuracion() {
  const { hijos, eliminarHijo, proveedores, agregarProveedor, hayEjemplo, eliminarEjemplo } = useStore()
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

      <Seccion titulo="Lectura de documentos con IA">
        <LecturaIA />
      </Seccion>

      <Seccion titulo="Recordatorios de medicación">
        <Recordatorios />
      </Seccion>

      {!estaInstalada() && (puedeInstalar() || esIOS()) && (
        <Seccion titulo="Instalar en el celular">
          <div className="bg-surface-lowest rounded-3xl shadow-soft p-5 space-y-3">
            {puedeInstalar() ? (
              <button onClick={instalar} className="min-h-11 px-5 rounded-full bg-primary text-white font-semibold text-sm">
                Instalar la app
              </button>
            ) : (
              <p className="text-on-surface-variant">En Safari tocá Compartir y después “Agregar a inicio”.</p>
            )}
          </div>
        </Seccion>
      )}

      {hayEjemplo && (
        <Seccion titulo="Datos de ejemplo">
          <div className="bg-surface-lowest rounded-3xl shadow-soft p-5 space-y-3">
            <p className="text-on-surface-variant">Martina y Tomás son de ejemplo. Borralos cuando empieces a cargar tus datos.</p>
            <button onClick={eliminarEjemplo} className="min-h-11 px-5 rounded-full bg-error-container text-on-error-container font-semibold text-sm">
              Borrar datos de ejemplo
            </button>
          </div>
        </Seccion>
      )}

      <p className="text-center text-xs text-on-surface-variant mt-10">FamLog · tus datos se guardan solo en este celular</p>
    </Pagina>
  )
}
