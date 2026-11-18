import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Boton, Campo, Chip, Icon, Pagina } from '../components/ui'
import { useStore } from '../data/store'
import { ETIQUETAS_SINTOMA } from '../data/ejemplo'
import { nombreSintoma } from './Sintomas'

const ahoraLocal = () => {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

const MED_VACIA = () => ({ medicamento: '', dosis: '', hora: ahoraLocal().slice(11) })
const numero = (t) => (t.trim() ? Number(t.replace(',', '.')) || null : null)

// Una o varias medicaciones dadas en el momento
function Medicaciones({ lista, setLista }) {
  const cambiar = (i, k) => (e) => setLista((l) => l.with(i, { ...l[i], [k]: e.target.value }))
  return (
    <div>
      <span className="block text-sm font-semibold mb-1.5">Medicación (opcional)</span>
      <div className="space-y-3">
        {lista.map((m, i) => (
          <div key={i} className="bg-surface-container rounded-2xl p-4 space-y-3">
            <div className="flex items-end gap-2">
              <Campo etiqueta="Medicamento" className="flex-1">
                <input className="campo !bg-surface-lowest" placeholder="Ej. Ibuprofeno" value={m.medicamento} onChange={cambiar(i, 'medicamento')} />
              </Campo>
              <button
                type="button"
                onClick={() => setLista((l) => l.filter((_, j) => j !== i))}
                className="w-12 h-12 shrink-0 rounded-xl bg-surface-lowest text-on-surface-variant flex items-center justify-center"
                aria-label="Quitar medicación"
              >
                <Icon name="close" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Campo etiqueta="Dosis">
                <input className="campo !bg-surface-lowest" placeholder="Ej. 5 ml" value={m.dosis} onChange={cambiar(i, 'dosis')} />
              </Campo>
              <Campo etiqueta="Hora">
                <input type="time" className="campo !bg-surface-lowest" value={m.hora} onChange={cambiar(i, 'hora')} />
              </Campo>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setLista((l) => [...l, MED_VACIA()])}
          className="w-full min-h-12 rounded-2xl border-2 border-dashed border-outline-variant text-primary font-semibold flex items-center justify-center gap-2"
        >
          <Icon name="add_circle" /> {lista.length ? 'Agregar otra medicación' : 'Le di medicación'}
        </button>
      </div>
    </div>
  )
}

export default function NuevoSintoma({ registro = false }) {
  const { hijoActivo, hijos, sintomas, agregarSintoma, actualizarSintoma } = useStore()
  const navigate = useNavigate()
  const { id } = useParams()
  const sintoma = registro ? sintomas.find((s) => s.id === id) : null
  const h = (sintoma && hijos.find((x) => x.id === sintoma.hijoId)) || hijoActivo
  const [fecha, setFecha] = useState(ahoraLocal())
  const [etiquetas, setEtiquetas] = useState([])
  const [temperatura, setTemperatura] = useState('')
  const [saturacion, setSaturacion] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [medicaciones, setMedicaciones] = useState([])

  if (registro && !sintoma) return <Pagina titulo="Síntoma no encontrado" volver />

  const guardar = (e) => {
    e.preventDefault()
    const meds = medicaciones.filter((m) => m.medicamento.trim())
    if (sintoma) {
      const nuevo = { id: `r${Date.now().toString(36)}`, fecha: new Date(fecha).toISOString(), temperatura: numero(temperatura), saturacion: numero(saturacion), nota: descripcion.trim(), medicaciones: meds }
      actualizarSintoma(sintoma.id, { registros: [...(sintoma.registros ?? []), nuevo] })
    } else
      agregarSintoma({
        hijoId: h.id,
        fecha: new Date(fecha).toISOString(),
        etiquetas,
        temperatura: numero(temperatura),
        saturacion: numero(saturacion),
        descripcion,
        medicaciones: meds,
        registros: [],
      })
    navigate(-1)
  }

  return (
    <Pagina
      titulo={sintoma ? 'Agregar al síntoma' : 'Registrar síntoma'}
      subtitulo={sintoma ? `${nombreSintoma(sintoma)} de ${h.nombre}: una nota, la temperatura o lo que le diste.` : `¿Qué le pasa a ${h.nombre}?`}
      volver
    >
      <form onSubmit={guardar} className="space-y-6">
        <Campo etiqueta="Fecha y hora" icono="calendar_month">
          <input type="datetime-local" className="campo pl-11" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </Campo>

        {!sintoma && (
          <div>
            <span className="block text-sm font-semibold mb-1.5">Tipo (podés elegir varios)</span>
            <div className="flex flex-wrap gap-2">
              {ETIQUETAS_SINTOMA.map((x) => (
                <Chip key={x} activo={etiquetas.includes(x)} onClick={() => setEtiquetas((l) => (l.includes(x) ? l.filter((y) => y !== x) : [...l, x]))}>
                  {x}
                </Chip>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Campo etiqueta="Temperatura (°C)" icono="thermostat">
            <input className="campo pl-11" inputMode="decimal" placeholder="38,5" value={temperatura} onChange={(e) => setTemperatura(e.target.value)} />
          </Campo>
          <Campo etiqueta="Saturación (%)" icono="humidity_high">
            <input className="campo pl-11" inputMode="numeric" placeholder="97" value={saturacion} onChange={(e) => setSaturacion(e.target.value)} />
          </Campo>
        </div>

        <Campo etiqueta={sintoma ? 'Nota' : 'Descripción'}>
          <textarea
            className="campo min-h-28"
            placeholder={sintoma ? 'Cómo sigue, qué cambió…' : 'Cómo se siente, cuándo empezó…'}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </Campo>

        <Medicaciones lista={medicaciones} setLista={setMedicaciones} />

        <Boton type="submit" icono="check_circle" className="w-full uppercase tracking-wide">
          {sintoma ? 'Guardar' : 'Guardar síntoma'}
        </Boton>
      </form>
    </Pagina>
  )
}
