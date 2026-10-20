import { useState } from 'react'
import { Avatar, Chip, Fab, Icon, Pagina, Vacio } from '../components/ui'
import { useStore } from '../data/store'
import { fechaCorta, mesAnio } from '../data/fechas'

const EMERGENCIAS = ['Emergencia CASMU', '1727', 'Suat', 'Anda', 'Médico a domicilio']
const esUrgencia = (v) => EMERGENCIAS.includes(v.lugar)

function Detalle({ etiqueta, children }) {
  return (
    <div>
      <div className="text-xs font-semibold text-on-surface-variant">{etiqueta}</div>
      <div>{children}</div>
    </div>
  )
}

function TarjetaVisita({ v, hijo, mostrarHijo }) {
  const [abierta, setAbierta] = useState(false)
  const urgente = esUrgencia(v)
  return (
    <article className="bg-surface-lowest rounded-3xl shadow-soft p-5">
      <button onClick={() => setAbierta((a) => !a)} className="w-full flex items-start gap-3 text-left">
        <span className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${urgente ? 'bg-error-container text-error' : 'bg-secondary-container/60 text-secondary'}`}>
          <Icon name={urgente ? 'emergency' : v.motivo === 'Control' ? 'child_care' : 'stethoscope'} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-on-surface-variant">
            {fechaCorta(v.fecha)} · {v.motivo}
          </div>
          <div className="font-display font-semibold text-lg leading-snug">{v.diagnostico || 'Sin diagnóstico'}</div>
        </div>
        <Icon name={abierta ? 'expand_less' : 'chevron_right'} className="text-on-surface-variant mt-1" />
      </button>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-on-surface-variant text-sm">
        <span className="flex items-center gap-1">
          <Icon name="local_hospital" className="text-base" /> {v.lugar}
        </span>
        {v.medico && (
          <span className="flex items-center gap-1">
            <Icon name="person" className="text-base" /> {v.medico}
          </span>
        )}
        {mostrarHijo && hijo && (
          <span className="flex items-center gap-1.5">
            <Avatar hijo={hijo} size="w-5 h-5" texto="text-[10px]" /> {hijo.nombre}
          </span>
        )}
      </div>

      {abierta && (
        <div className="mt-4 bg-surface-low rounded-2xl p-4 space-y-3">
          <Detalle etiqueta="Especialidad">{v.especialidad || '—'}</Detalle>
          <Detalle etiqueta="Diagnóstico">{v.diagnostico || '—'}</Detalle>
          <Detalle etiqueta="Procedimientos">
            {v.procedimientos?.length ? (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {v.procedimientos.map((p) => (
                  <span key={p} className="bg-surface-lowest rounded-lg px-2.5 py-1 text-sm font-medium">
                    {p}
                  </span>
                ))}
              </div>
            ) : (
              '—'
            )}
          </Detalle>
          {v.tratamiento && (
            <Detalle etiqueta="Tratamiento indicado">
              {v.tratamiento.medicamento} {v.tratamiento.dosis} {v.tratamiento.frecuencia && `· ${v.tratamiento.frecuencia}`}
            </Detalle>
          )}
          {v.proximoControl && <Detalle etiqueta="Próximo control">{v.proximoControl}</Detalle>}
        </div>
      )}
    </article>
  )
}

export default function Visitas() {
  const { hijoActivo: h, hijos, visitas } = useStore()
  const [texto, setTexto] = useState('')
  const [filtro, setFiltro] = useState('Todas')
  const [todos, setTodos] = useState(false)
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [verFechas, setVerFechas] = useState(false)

  const q = texto.trim().toLowerCase()
  const lista = visitas
    .filter((v) => todos || v.hijoId === h.id)
    .filter((v) => filtro === 'Todas' || (filtro === 'Urgencias' ? esUrgencia(v) : v.motivo === { Consultas: 'Consulta', Controles: 'Control' }[filtro]))
    .filter((v) => !desde || v.fecha >= desde)
    .filter((v) => !hasta || v.fecha <= hasta)
    .filter((v) => !q || [v.diagnostico, v.medico, v.lugar, v.especialidad, ...(v.procedimientos ?? [])].join(' ').toLowerCase().includes(q))
    .sort((a, b) => b.fecha.localeCompare(a.fecha))

  // Agrupar por mes
  const grupos = []
  for (const v of lista) {
    const mes = mesAnio(v.fecha)
    if (grupos.at(-1)?.mes !== mes) grupos.push({ mes, items: [] })
    grupos.at(-1).items.push(v)
  }

  return (
    <Pagina
      titulo="Historia clínica"
      subtitulo={todos ? 'Todas las visitas de la familia.' : `Visitas de ${h.nombre}.`}
      accion={<Fab to="/visitas/nueva" etiqueta="Registrar visita" />}
    >
      <div className="relative mb-3">
        <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
        <input
          className="w-full min-h-14 rounded-2xl bg-surface-container pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary-container"
          placeholder="Buscar: otitis, pediatra, CASMU…"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5">
        {['Todas', 'Consultas', 'Controles', 'Urgencias'].map((x) => (
          <Chip key={x} activo={filtro === x} onClick={() => setFiltro(x)}>
            {x}
          </Chip>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 mb-4">
        {hijos.length > 1 && (
          <Chip activo={todos} onClick={() => setTodos((t) => !t)}>
            <span className="flex items-center gap-1">
              <Icon name="group" className="text-base" /> Todos los hijos
            </span>
          </Chip>
        )}
        <Chip activo={verFechas || desde || hasta} onClick={() => setVerFechas((v) => !v)}>
          <span className="flex items-center gap-1">
            <Icon name="date_range" className="text-base" /> Fechas
          </span>
        </Chip>
      </div>

      {verFechas && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <label className="text-sm font-semibold">
            Desde
            <input type="date" className="campo mt-1" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </label>
          <label className="text-sm font-semibold">
            Hasta
            <input type="date" className="campo mt-1" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </label>
        </div>
      )}

      {grupos.length === 0 && <Vacio icono="search_off" titulo="No hay visitas" texto="Probá con otra búsqueda o filtro." />}

      {grupos.map((g) => (
        <section key={g.mes} className="mb-6">
          <div className="flex items-center gap-3 my-3">
            <div className="flex-1 h-px bg-surface-highest" />
            <span className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">{g.mes}</span>
            <div className="flex-1 h-px bg-surface-highest" />
          </div>
          <div className="space-y-4">
            {g.items.map((v) => (
              <TarjetaVisita key={v.id} v={v} hijo={hijos.find((x) => x.id === v.hijoId)} mostrarHijo={todos} />
            ))}
          </div>
        </section>
      ))}
    </Pagina>
  )
}
