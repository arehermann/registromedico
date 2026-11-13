import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Boton, Campo, EtiquetaEstado, Fab, Fila, Icon, Interruptor, Lista, Pagina, Seccion, useAviso } from '../components/ui'
import { useStore } from '../data/store'
import { estadoTratamiento, fechaCorta, haceCuanto, hora, proximaDosis } from '../data/fechas'
import { DosisPendientes, useAhora } from '../components/avisos'

function FilaTratamiento({ t }) {
  const { actualizarTratamiento, eliminarTratamiento, registrarToma, tomas } = useStore()
  const [abierta, setAbierta] = useState(false)
  const [confirmar, setConfirmar] = useState(false)
  useAhora()
  const ultima = tomas.filter((m) => m.tratamientoId === t.id).sort((a, b) => b.fecha.localeCompare(a.fecha))[0]
  const estado = estadoTratamiento(t)
  const prox = t.estado === 'en_curso' && t.notificaciones ? proximaDosis(t) : null
  const detalle = [t.dosis, t.cadaHoras && `cada ${t.cadaHoras} h`].filter(Boolean).join(' · ')

  return (
    <div>
      <button type="button" onClick={() => setAbierta((a) => !a)} className="w-full flex items-center gap-3 px-4 py-3 text-left min-h-14">
        <div className="flex-1 min-w-0">
          <div className="font-medium leading-snug">{t.medicamento}</div>
          <div className="text-sm text-on-surface-variant flex flex-wrap items-center gap-x-2">
            {detalle && <span>{detalle}</span>}
            <EtiquetaEstado estado={estado} />
          </div>
        </div>
        {prox && (
          <div className="text-right shrink-0">
            <div className="font-semibold text-primary">{hora(prox.toISOString())}</div>
            <div className="text-[11px] text-on-surface-variant">próxima</div>
          </div>
        )}
        <Icon name={abierta ? 'expand_less' : 'expand_more'} className="text-on-surface-variant shrink-0" />
      </button>

      {abierta && (
        <div className="px-4 pb-3 space-y-1 text-sm">
          {t.inicio && t.estado !== 'pendiente' && <p className="text-on-surface-variant">Desde el {fechaCorta(t.inicio)}{ultima ? ` · última toma ${haceCuanto(ultima.fecha).toLowerCase()}` : ''}</p>}

          {t.estado === 'pendiente' && (
            <Boton
              className="w-full mt-1 min-h-11 text-sm"
              icono="play_arrow"
              onClick={() => {
                // Se inicia al dar la primera dosis, así que queda registrada como tomada
                const inicio = new Date().toISOString()
                actualizarTratamiento(t.id, { estado: 'en_curso', inicio })
                if (t.cadaHoras) registrarToma(t.id, inicio)
              }}
            >
              Iniciar: le di la primera dosis
            </Boton>
          )}

          {t.estado === 'en_curso' && (
            <>
              <Interruptor etiqueta="Recordatorios" activo={t.notificaciones} onChange={(v) => actualizarTratamiento(t.id, { notificaciones: v })} />
              <button
                onClick={() => actualizarTratamiento(t.id, { estado: 'finalizado', fin: new Date().toISOString() })}
                className="min-h-10 font-semibold text-primary flex items-center gap-1"
              >
                <Icon name="check" className="text-lg" /> Finalizar tratamiento
              </button>
            </>
          )}

          {t.estado !== 'en_curso' &&
            (confirmar ? (
              <div className="flex gap-2 pt-1">
                <button onClick={() => setConfirmar(false)} className="px-4 min-h-10 rounded-full font-semibold bg-surface-container">
                  Cancelar
                </button>
                <button onClick={() => eliminarTratamiento(t.id)} className="px-4 min-h-10 rounded-full font-semibold bg-error text-white">
                  Eliminar
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmar(true)} className="font-semibold text-on-surface-variant flex items-center gap-1 min-h-10">
                <Icon name="delete" className="text-lg" /> Eliminar
              </button>
            ))}
        </div>
      )}
    </div>
  )
}

function HojaRescate({ hijo, onCerrar, onGuardar }) {
  const ahora = new Date()
  const [f, setF] = useState({
    medicamento: '',
    dosis: '',
    hora: `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`,
  })
  const guardar = (e) => {
    e.preventDefault()
    const [hh, mm] = f.hora.split(':')
    const fecha = new Date()
    fecha.setHours(Number(hh), Number(mm), 0, 0)
    onGuardar({ hijoId: hijo.id, medicamento: f.medicamento, dosis: f.dosis, fecha: fecha.toISOString() })
  }
  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md flex items-end justify-center" onClick={onCerrar}>
      <form onSubmit={guardar} className="w-full max-w-xl bg-surface-lowest rounded-t-[32px] p-6 pb-8 space-y-4 pb-safe" onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1.5 bg-outline-variant rounded-full mx-auto" />
        <h2 className="text-xl font-bold">Medicación de rescate · {hijo.nombre}</h2>
        <Campo etiqueta="Medicamento">
          <input className="campo" required autoFocus placeholder="Ej. Salbutamol" value={f.medicamento} onChange={(e) => setF({ ...f, medicamento: e.target.value })} />
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo etiqueta="Dosis">
            <input className="campo" placeholder="Ej. 2 puffs" value={f.dosis} onChange={(e) => setF({ ...f, dosis: e.target.value })} />
          </Campo>
          <Campo etiqueta="Hora">
            <input type="time" className="campo" value={f.hora} onChange={(e) => setF({ ...f, hora: e.target.value })} />
          </Campo>
        </div>
        <Boton type="submit" className="w-full" icono="check">
          Registrar toma
        </Boton>
      </form>
    </div>
  )
}

export default function Tratamientos() {
  const { hijoActivo: h, tratamientos, rescates, agregarRescate } = useStore()
  const [params, setParams] = useSearchParams()
  const [verFinalizados, setVerFinalizados] = useState(false)
  const [aviso, mostrarAviso] = useAviso()
  const rescateAbierto = params.get('rescate') === '1'

  const propios = tratamientos.filter((t) => t.hijoId === h.id)
  const enCurso = propios.filter((t) => t.estado === 'en_curso')
  const pendientes = propios.filter((t) => t.estado === 'pendiente')
  const finalizados = propios.filter((t) => t.estado === 'finalizado')
  const rescatesHijo = rescates.filter((r) => r.hijoId === h.id).slice(0, 3)

  return (
    <Pagina titulo="Tratamientos" accion={<Fab to="/tratamientos/nuevo" icono="add" etiqueta="Agregar tratamiento" />}>
      <DosisPendientes hijoId={h.id} />

      <Seccion titulo="En curso">
        {enCurso.length ? (
          <Lista>
            {enCurso.map((t) => (
              <FilaTratamiento key={t.id} t={t} />
            ))}
          </Lista>
        ) : (
          <p className="text-on-surface-variant px-1">No hay tratamientos en curso.</p>
        )}
      </Seccion>

      {pendientes.length > 0 && (
        <Seccion titulo="Sin iniciar">
          <Lista>
            {pendientes.map((t) => (
              <FilaTratamiento key={t.id} t={t} />
            ))}
          </Lista>
        </Seccion>
      )}

      <Seccion
        titulo="Rescate"
        accion={
          <button onClick={() => setParams({ rescate: '1' })} className="text-primary font-semibold text-sm flex items-center gap-0.5 min-h-8">
            <Icon name="add" className="text-lg" /> Anotar
          </button>
        }
      >
        {rescatesHijo.length ? (
          <Lista>
            {rescatesHijo.map((r) => (
              <Fila key={r.id} titulo={r.medicamento} detalle={r.dosis} derecha={<span className="text-sm text-on-surface-variant shrink-0">{haceCuanto(r.fecha)}</span>} />
            ))}
          </Lista>
        ) : (
          <p className="text-on-surface-variant px-1">Sin tomas puntuales anotadas.</p>
        )}
      </Seccion>

      {finalizados.length > 0 && (
        <section>
          <button onClick={() => setVerFinalizados((v) => !v)} className="flex items-center gap-1 px-1 text-sm font-semibold text-on-surface-variant min-h-11">
            Finalizados ({finalizados.length}) <Icon name={verFinalizados ? 'expand_less' : 'expand_more'} className="text-lg" />
          </button>
          {verFinalizados && (
            <Lista className="opacity-80">
              {finalizados.map((t) => (
                <FilaTratamiento key={t.id} t={t} />
              ))}
            </Lista>
          )}
        </section>
      )}

      {rescateAbierto && (
        <HojaRescate
          hijo={h}
          onCerrar={() => setParams({})}
          onGuardar={(r) => {
            agregarRescate(r)
            setParams({})
            mostrarAviso('Toma de rescate registrada')
          }}
        />
      )}
      {aviso}
    </Pagina>
  )
}
