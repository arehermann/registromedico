import { useState } from 'react'
import { Chip, Fab, Icon, Lista, Pagina, Seccion, Vacio } from '../components/ui'
import { Miniatura } from './LeerDocumento'
import { abrirAdjunto } from '../data/archivos'
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
  const { eliminarVisita, adjuntos } = useStore()
  const docs = adjuntos.filter((a) => a.visitaId === v.id)
  const tratamientos = v.tratamientos ?? (v.tratamiento ? [v.tratamiento] : [])
  const [abierta, setAbierta] = useState(false)
  const [confirmar, setConfirmar] = useState(false)
  const urgente = esUrgencia(v)
  const [dia, mes] = fechaCorta(v.fecha).split(' ')
  return (
    <div>
      <button onClick={() => setAbierta((a) => !a)} className="w-full flex items-center gap-3 px-4 py-3 text-left min-h-14">
        <div className="w-10 text-center shrink-0">
          <div className="text-lg font-semibold leading-none">{dia}</div>
          <div className="text-[11px] text-on-surface-variant uppercase">{mes.replace('.', '')}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium leading-snug">{v.diagnostico || 'Sin diagnóstico'}</div>
          <div className="text-sm text-on-surface-variant truncate flex items-center gap-1">
            {urgente && <span className="w-2 h-2 rounded-full bg-error shrink-0" />}
            <span className="truncate">{[v.motivo, v.lugar, v.medico, mostrarHijo && hijo?.nombre].filter(Boolean).join(' · ')}</span>
            {docs.length > 0 && <Icon name="attach_file" className="text-sm" />}
          </div>
        </div>
        <Icon name={abierta ? 'expand_less' : 'expand_more'} className="text-on-surface-variant shrink-0" />
      </button>

      {abierta && (
        <div className="px-4 pb-3 pl-[4.25rem] space-y-2 text-sm">
          <Detalle etiqueta="Especialidad">{v.especialidad || '—'}</Detalle>
          <Detalle etiqueta="Procedimientos">
            {v.procedimientos?.length ? (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {v.procedimientos.map((p) => (
                  <span key={p} className="bg-surface-container rounded-lg px-2 py-0.5 text-sm">
                    {p}
                  </span>
                ))}
              </div>
            ) : (
              '—'
            )}
          </Detalle>
          {tratamientos.length > 0 && (
            <Detalle etiqueta="Tratamiento indicado">
              {tratamientos.map((t, i) => (
                <div key={i}>
                  {t.medicamento} {t.dosis} {t.frecuencia && `· ${t.frecuencia}`}
                </div>
              ))}
            </Detalle>
          )}
          {v.proximoControl && <Detalle etiqueta="Próximo control">{v.proximoControl}</Detalle>}
          {docs.length > 0 && (
            <Detalle etiqueta="Documentos">
              <div className="space-y-2 mt-1">
                {docs.map((a) => (
                  <Miniatura key={a.id} a={a} onAbrir={() => abrirAdjunto(a)} />
                ))}
              </div>
            </Detalle>
          )}
          <div className="flex justify-end pt-1">
            {confirmar ? (
              <div className="flex gap-2">
                <button onClick={() => setConfirmar(false)} className="px-4 min-h-10 rounded-full text-sm font-semibold bg-surface-lowest">
                  Cancelar
                </button>
                <button onClick={() => eliminarVisita(v.id)} className="px-4 min-h-10 rounded-full text-sm font-semibold bg-error text-white">
                  Eliminar visita
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmar(true)} className="text-sm font-semibold text-on-surface-variant flex items-center gap-1 min-h-10">
                <Icon name="delete" /> Eliminar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
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
      titulo="Visitas"
      subtitulo={todos ? 'De toda la familia' : null}
      accion={<Fab to="/visitas/nueva" etiqueta="Registrar visita" />}
    >
      <div className="relative mb-2">
        <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
        <input
          className="w-full min-h-11 rounded-xl bg-surface-lowest pl-10 pr-4 outline-none focus:ring-2 focus:ring-primary-container"
          placeholder="Buscar"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 mb-3">
        {['Todas', 'Consultas', 'Controles', 'Urgencias'].map((x) => (
          <Chip key={x} activo={filtro === x} onClick={() => setFiltro(x)}>
            {x}
          </Chip>
        ))}
        {hijos.length > 1 && (
          <Chip activo={todos} onClick={() => setTodos((t) => !t)}>
            Todos los hijos
          </Chip>
        )}
        <Chip activo={verFechas || desde || hasta} onClick={() => setVerFechas((v) => !v)}>
          Fechas
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
        <Seccion key={g.mes} titulo={g.mes}>
          <Lista>
            {g.items.map((v) => (
              <TarjetaVisita key={v.id} v={v} hijo={hijos.find((x) => x.id === v.hijoId)} mostrarHijo={todos} />
            ))}
          </Lista>
        </Seccion>
      ))}
    </Pagina>
  )
}
