import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Boton, Campo, Chip, Icon, Pagina } from '../components/ui'
import { useStore } from '../data/store'
import { ETIQUETAS_SINTOMA } from '../data/ejemplo'

const ahoraLocal = () => {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export default function NuevoSintoma() {
  const { hijoActivo: h, agregarSintoma } = useStore()
  const navigate = useNavigate()
  const [fecha, setFecha] = useState(ahoraLocal())
  const [etiqueta, setEtiqueta] = useState('Fiebre')
  const [temperatura, setTemperatura] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [conMedicacion, setConMedicacion] = useState(false)
  const [med, setMed] = useState({ medicamento: '', dosis: '', hora: ahoraLocal().slice(11) })

  const guardar = (e) => {
    e.preventDefault()
    agregarSintoma({
      hijoId: h.id,
      fecha: new Date(fecha).toISOString(),
      etiqueta,
      temperatura: etiqueta === 'Fiebre' && temperatura ? Number(temperatura.replace(',', '.')) : null,
      descripcion,
      medicacion: conMedicacion && med.medicamento ? med : null,
    })
    navigate('/sintomas')
  }

  return (
    <Pagina titulo="Registrar síntoma" subtitulo={`¿Qué le pasa a ${h.nombre}?`} volver>
      <form onSubmit={guardar} className="space-y-6">
        <Campo etiqueta="Fecha y hora" icono="calendar_month">
          <input type="datetime-local" className="campo pl-11" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </Campo>

        <div>
          <span className="block text-sm font-semibold mb-1.5">Tipo</span>
          <div className="flex flex-wrap gap-2">
            {ETIQUETAS_SINTOMA.map((x) => (
              <Chip key={x} activo={etiqueta === x} onClick={() => setEtiqueta(x)}>
                {x}
              </Chip>
            ))}
          </div>
        </div>

        {etiqueta === 'Fiebre' && (
          <Campo etiqueta="Temperatura (°C)" icono="thermostat">
            <input className="campo pl-11 text-2xl font-bold" inputMode="decimal" placeholder="38,5" value={temperatura} onChange={(e) => setTemperatura(e.target.value)} />
          </Campo>
        )}

        <Campo etiqueta="Descripción">
          <textarea className="campo min-h-32" placeholder="Cómo se siente, cuándo empezó…" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </Campo>

        <div>
          <span className="block text-sm font-semibold mb-1.5">Medicación (opcional)</span>
          {conMedicacion ? (
            <div className="bg-surface-container rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Detalles de dosis</span>
                <button type="button" onClick={() => setConMedicacion(false)} className="text-on-surface-variant p-2 -m-2" aria-label="Quitar medicación">
                  <Icon name="close" />
                </button>
              </div>
              <Campo etiqueta="Medicamento">
                <input className="campo !bg-surface-lowest" placeholder="Ej. Ibuprofeno" value={med.medicamento} onChange={(e) => setMed({ ...med, medicamento: e.target.value })} />
              </Campo>
              <div className="grid grid-cols-2 gap-3">
                <Campo etiqueta="Dosis">
                  <input className="campo !bg-surface-lowest" placeholder="Ej. 5 ml" value={med.dosis} onChange={(e) => setMed({ ...med, dosis: e.target.value })} />
                </Campo>
                <Campo etiqueta="Hora">
                  <input type="time" className="campo !bg-surface-lowest" value={med.hora} onChange={(e) => setMed({ ...med, hora: e.target.value })} />
                </Campo>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConMedicacion(true)}
              className="w-full min-h-14 rounded-2xl border-2 border-dashed border-outline-variant text-primary font-semibold flex items-center justify-center gap-2"
            >
              <Icon name="add_circle" /> Le di medicación
            </button>
          )}
        </div>

        <Boton type="submit" icono="check_circle" className="w-full uppercase tracking-wide">
          Guardar síntoma
        </Boton>
      </form>
    </Pagina>
  )
}
