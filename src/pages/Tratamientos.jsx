import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Boton, Campo, Card, EtiquetaEstado, Fab, Icon, Interruptor, Pagina, Seccion, useAviso } from '../components/ui'
import { useStore } from '../data/store'
import { avanceDosis, estadoTratamiento, fechaCorta, haceCuanto, hora, proximaDosis } from '../data/fechas'
import { DosisPendientes, useAhora } from '../components/avisos'

function Anillo({ avance }) {
  const r = 20
  const c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 48 48" className="w-9 h-9 -rotate-90 shrink-0">
      <circle cx="24" cy="24" r={r} fill="none" stroke="var(--color-primary-fixed)" strokeWidth="5" />
      <circle cx="24" cy="24" r={r} fill="none" stroke="var(--color-primary)" strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - avance)} />
    </svg>
  )
}

function TarjetaTratamiento({ t }) {
  const { actualizarTratamiento, eliminarTratamiento, registrarToma, tomas } = useStore()
  const [confirmar, setConfirmar] = useState(false)
  useAhora()
  const ultima = tomas.filter((m) => m.tratamientoId === t.id).sort((a, b) => b.fecha.localeCompare(a.fecha))[0]
  const estado = estadoTratamiento(t)
  const prox = t.notificaciones ? proximaDosis(t) : null
  const borde = { activo: 'border-primary', por_vencer: 'border-tertiary-fixed-dim', vencido: 'border-error', pendiente: 'border-primary-fixed-dim', finalizado: 'border-outline-variant' }[estado.clave]

  return (
    <Card className={`border-l-[6px] ${borde}`}>
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center shrink-0">
          <Icon name={t.tipo === 'cronico' ? 'autorenew' : 'medication_liquid'} className="text-2xl" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="font-display text-base font-semibold leading-snug min-w-0">{t.medicamento}</div>
            <EtiquetaEstado estado={estado} />
          </div>
          <div className="text-xs text-on-surface-variant">{t.tipo === 'cronico' ? 'Tratamiento prolongado' : `Temporal · ${t.duracionDias} días`}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-2.5 pl-[3.25rem]">
        <span className="bg-surface-container rounded-lg px-2 py-0.5 text-xs font-semibold flex items-center gap-1">
          <Icon name="vaccines" className="text-sm text-primary" /> {t.dosis}
        </span>
        {t.cadaHoras && (
          <span className="bg-surface-container rounded-lg px-2 py-0.5 text-xs font-semibold flex items-center gap-1">
            <Icon name="schedule" className="text-sm text-primary" /> Cada {t.cadaHoras} h
          </span>
        )}
        {t.inicio && t.estado !== 'pendiente' && (
          <span className="bg-surface-container rounded-lg px-2 py-0.5 text-xs font-semibold flex items-center gap-1">
            <Icon name="event" className="text-sm text-primary" /> Desde {fechaCorta(t.inicio)}
          </span>
        )}
      </div>

      {t.estado === 'pendiente' && (
        <Boton
          className="w-full mt-3 min-h-11 text-sm"
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
          {prox && (
            <div className="bg-surface-low rounded-xl px-3 py-2 mt-3 flex items-center gap-3">
              <Anillo avance={avanceDosis(t)} />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-on-surface-variant">Próxima dosis</div>
                {ultima && <div className="text-xs text-on-surface-variant">Última: {haceCuanto(ultima.fecha).toLowerCase()}</div>}
              </div>
              <div className="font-display text-xl font-bold text-primary">{hora(prox.toISOString())}</div>
            </div>
          )}
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-surface-high">
            <Interruptor
              className="flex-1"
              etiqueta="Recordatorios"
              detalle={t.notificaciones ? null : 'Apagados'}
              activo={t.notificaciones}
              onChange={(v) => actualizarTratamiento(t.id, { notificaciones: v })}
            />
            <span className="w-px h-6 bg-surface-high" />
            <button
              onClick={() => actualizarTratamiento(t.id, { estado: 'finalizado', fin: new Date().toISOString() })}
              className="min-h-10 px-3 rounded-full text-sm font-semibold text-primary flex items-center gap-1 shrink-0"
            >
              <Icon name="check" className="text-lg" /> Finalizar
            </button>
          </div>
        </>
      )}

      {t.estado !== 'en_curso' && (
        <div className="flex justify-end mt-3">
          {confirmar ? (
            <div className="flex gap-2">
              <button onClick={() => setConfirmar(false)} className="px-4 min-h-10 rounded-full text-sm font-semibold bg-surface-container">
                Cancelar
              </button>
              <button onClick={() => eliminarTratamiento(t.id)} className="px-4 min-h-10 rounded-full text-sm font-semibold bg-error text-white">
                Eliminar
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmar(true)} className="text-sm font-semibold text-on-surface-variant flex items-center gap-1 min-h-10">
              <Icon name="delete" /> Eliminar
            </button>
          )}
        </div>
      )}
    </Card>
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

  const condiciones = [
    ...(h.condiciones ?? []).map((c) => ({ ...c, icono: 'pulmonology', tono: 'bg-secondary-container text-on-secondary-container', color: 'text-primary' })),
    ...h.alergias.map((a) => ({ nombre: a, tipo: 'Alergia', estado: 'Evitar', icono: 'do_not_disturb_on', tono: 'bg-tertiary-fixed text-tertiary', color: 'text-tertiary' })),
  ]

  return (
    <Pagina titulo="Tratamientos" accion={<Fab to="/tratamientos/nuevo" icono="add_task" etiqueta="Agregar tratamiento" />}>
      <DosisPendientes hijoId={h.id} />

      {condiciones.length > 0 && (
        <Seccion titulo="Condiciones activas">
          <div className="bg-surface-low rounded-2xl divide-y divide-surface-high">
            {condiciones.map((c) => (
              <div key={c.tipo + c.nombre} className="px-3 py-2 flex items-center gap-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${c.tono}`}>
                  <Icon name={c.icono} className="text-lg" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold leading-tight">{c.nombre}</div>
                  <div className={`text-[11px] font-bold uppercase tracking-wider ${c.color}`}>{c.tipo}</div>
                </div>
                <span className="text-xs font-semibold bg-surface-highest rounded-full px-2.5 py-0.5">{c.estado}</span>
              </div>
            ))}
          </div>
        </Seccion>
      )}

      <Seccion titulo="En curso">
        {enCurso.length ? (
          <div className="space-y-3">
            {enCurso.map((t) => (
              <TarjetaTratamiento key={t.id} t={t} />
            ))}
          </div>
        ) : (
          <p className="text-on-surface-variant">No hay tratamientos en curso.</p>
        )}
      </Seccion>

      {pendientes.length > 0 && (
        <Seccion titulo="Precargados, sin iniciar">
          <div className="space-y-3">
            {pendientes.map((t) => (
              <TarjetaTratamiento key={t.id} t={t} />
            ))}
          </div>
        </Seccion>
      )}

      <Seccion
        titulo="Medicación de rescate"
        accion={
          <button onClick={() => setParams({ rescate: '1' })} className="w-9 h-9 rounded-full bg-primary-fixed text-primary flex items-center justify-center" aria-label="Registrar rescate">
            <Icon name="add" />
          </button>
        }
      >
        {rescatesHijo.length ? (
          <div className="bg-surface-lowest rounded-2xl shadow-soft divide-y divide-surface-high">
            {rescatesHijo.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-3 py-2.5">
                <Icon name="medication" className="text-secondary" />
                <div className="flex-1">
                  <div className="font-semibold">{r.medicamento}</div>
                  <div className="text-sm text-on-surface-variant">{r.dosis}</div>
                </div>
                <div className="text-sm text-on-surface-variant">{haceCuanto(r.fecha)}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-on-surface-variant">Tocá + para anotar una toma puntual.</p>
        )}
      </Seccion>

      {finalizados.length > 0 && (
        <section>
          <button onClick={() => setVerFinalizados((v) => !v)} className="flex items-center gap-2 font-semibold text-on-surface-variant min-h-11">
            <Icon name={verFinalizados ? 'expand_less' : 'expand_more'} /> Finalizados ({finalizados.length})
          </button>
          {verFinalizados && (
            <div className="space-y-3 mt-1 opacity-80">
              {finalizados.map((t) => (
                <TarjetaTratamiento key={t.id} t={t} />
              ))}
            </div>
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
