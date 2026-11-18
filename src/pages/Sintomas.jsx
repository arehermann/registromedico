import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Chip, Fab, Icon, Lista, Pagina, Vacio } from '../components/ui'
import { useStore } from '../data/store'
import { diaHora, fechaCorta } from '../data/fechas'

const grados = (t) => `${String(t).replace('.', ',')} °C`
// Antes cada síntoma tenía un solo tipo (`etiqueta`); ahora puede tener varios
const tiposDe = (s) => s.etiquetas ?? (s.etiqueta ? [s.etiqueta] : [])
export const nombreSintoma = (s) => tiposDe(s).join(', ') || 'Síntoma'
// Síntomas guardados antes de permitir varias medicaciones tienen `medicacion` (una sola)
const medsDe = (r) => r.medicaciones ?? (r.medicacion ? [r.medicacion] : [])

// El síntoma y lo que se le fue agregando, en orden de fecha
const lineaDeTiempo = (s) =>
  [{ id: 'inicio', fecha: s.fecha, temperatura: s.temperatura, saturacion: s.saturacion, nota: s.descripcion, medicaciones: medsDe(s) }, ...(s.registros ?? [])].sort((a, b) =>
    a.fecha.localeCompare(b.fecha),
  )

function Registro({ r }) {
  const meds = medsDe(r)
  return (
    <li className="relative pl-5 pb-3 last:pb-0">
      <span className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-primary" />
      <div className="text-xs font-semibold text-on-surface-variant">
        {diaHora(r.fecha)}
        {r.temperatura ? <span className="text-on-surface"> · {grados(r.temperatura)}</span> : null}
        {r.saturacion ? <span className="text-on-surface"> · Sat. {r.saturacion} %</span> : null}
      </div>
      {r.nota && <p className="whitespace-pre-line">{r.nota}</p>}
      {meds.map((m, i) => (
        <div key={i} className="flex items-center gap-1 text-on-surface-variant">
          <Icon name="medication" className="text-base" /> {m.medicamento} {m.dosis}
          {m.hora && ` · ${m.hora}`}
        </div>
      ))}
    </li>
  )
}

function FilaSintoma({ s, hijo, mostrarHijo }) {
  const { eliminarSintoma } = useStore()
  const [abierta, setAbierta] = useState(false)
  const [confirmar, setConfirmar] = useState(false)
  const linea = lineaDeTiempo(s)
  const ultimaTemp = linea.findLast((r) => r.temperatura)?.temperatura
  const meds = linea.flatMap(medsDe)
  const tipos = tiposDe(s)
  const titulo = tipos.join(', ') || s.descripcion || (s.temperatura ? `Temperatura ${grados(s.temperatura)}` : 'Síntoma')
  const [dia, mes] = fechaCorta(s.fecha).split(' ')
  const detalle = [
    tipos.length > 0 && ultimaTemp && grados(ultimaTemp),
    meds.length > 0 && [...new Set(meds.map((m) => m.medicamento))].join(', '),
    linea.length > 1 && `${linea.length} registros`,
    mostrarHijo && hijo?.nombre,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div>
      <button onClick={() => setAbierta((a) => !a)} className="w-full flex items-center gap-3 px-4 py-3 text-left min-h-14">
        <div className="w-10 text-center shrink-0">
          <div className="text-lg font-semibold leading-none">{dia}</div>
          <div className="text-[11px] text-on-surface-variant uppercase">{mes.replace('.', '')}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium leading-snug truncate">{titulo}</div>
          {detalle && <div className="text-sm text-on-surface-variant truncate">{detalle}</div>}
        </div>
        <Icon name={abierta ? 'expand_less' : 'expand_more'} className="text-on-surface-variant shrink-0" />
      </button>

      {abierta && (
        <div className="px-4 pb-3 pl-[4.25rem] text-sm">
          <ol className="border-l border-surface-high -ml-[1px]">
            {linea.map((r) => (
              <Registro key={r.id} r={r} />
            ))}
          </ol>
          <div className="flex justify-between items-center pt-2">
            <Link to={`/sintomas/${s.id}/agregar`} className="font-semibold text-primary flex items-center gap-1 min-h-10">
              <Icon name="add" /> Agregar
            </Link>
            {confirmar ? (
              <div className="flex gap-2">
                <button onClick={() => setConfirmar(false)} className="px-4 min-h-10 rounded-full font-semibold bg-surface-container">
                  Cancelar
                </button>
                <button onClick={() => eliminarSintoma(s.id)} className="px-4 min-h-10 rounded-full font-semibold bg-error text-white">
                  Eliminar
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmar(true)} className="font-semibold text-on-surface-variant flex items-center gap-1 min-h-10">
                <Icon name="delete" /> Eliminar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Sintomas() {
  const { hijoActivo: h, hijos, sintomas } = useStore()
  const [todos, setTodos] = useState(false)
  const lista = sintomas.filter((s) => todos || s.hijoId === h.id).sort((a, b) => b.fecha.localeCompare(a.fecha))

  return (
    <Pagina titulo="Síntomas" subtitulo={todos ? 'De toda la familia' : `De ${h.nombre}`} volver accion={<Fab to="/sintomas/nuevo" etiqueta="Registrar síntoma" />}>
      {hijos.length > 1 && (
        <div className="flex gap-1.5 mb-3">
          <Chip activo={todos} onClick={() => setTodos((t) => !t)}>
            Todos los hijos
          </Chip>
        </div>
      )}

      {lista.length ? (
        <Lista>
          {lista.map((s) => (
            <FilaSintoma key={s.id} s={s} hijo={hijos.find((x) => x.id === s.hijoId)} mostrarHijo={todos} />
          ))}
        </Lista>
      ) : (
        <Vacio icono="thermostat" titulo="Sin síntomas anotados" texto="Cuando algo te llame la atención, anotalo con el botón +." />
      )}
    </Pagina>
  )
}
