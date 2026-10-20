import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Boton, Campo, Chip, Icon, Interruptor, Pagina } from '../components/ui'
import { useStore } from '../data/store'
import { ESPECIALIDADES } from '../data/ejemplo'

const PROCEDIMIENTOS = ['Placa de tórax', 'Nebulizaciones', 'Hisopado', 'Análisis de sangre', 'Vacuna', 'Curación', 'Otoscopía']

function Bloque({ icono, titulo, accion, children }) {
  return (
    <section className="bg-surface-lowest rounded-3xl shadow-soft p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          <Icon name={icono} className="text-primary" /> {titulo}
        </h2>
        {accion}
      </div>
      {children}
    </section>
  )
}

export default function NuevaVisita() {
  const { hijoActivo: h, proveedores, agregarVisita, agregarTratamiento } = useStore()
  const navigate = useNavigate()
  const [f, setF] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    motivo: 'Consulta',
    lugar: '',
    lugarOtro: '',
    medico: '',
    especialidad: '',
    diagnostico: '',
    proximoControl: '',
  })
  const [procedimientos, setProcedimientos] = useState([])
  const [nuevoProc, setNuevoProc] = useState('')
  const [conTratamiento, setConTratamiento] = useState(false)
  const [trat, setTrat] = useState({ medicamento: '', dosis: '', cadaHoras: '', duracionDias: '' })
  const [iniciar, setIniciar] = useState(false)
  const cambiar = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const alternarProc = (p) => setProcedimientos((l) => (l.includes(p) ? l.filter((x) => x !== p) : [...l, p]))

  const guardar = (e) => {
    e.preventDefault()
    const tratamiento = conTratamiento && trat.medicamento ? trat : null
    agregarVisita({
      hijoId: h.id,
      fecha: f.fecha,
      motivo: f.motivo,
      lugar: f.lugar === 'Otro' ? f.lugarOtro || 'Otro' : f.lugar,
      medico: f.medico,
      especialidad: f.especialidad,
      diagnostico: f.diagnostico,
      procedimientos,
      proximoControl: f.proximoControl,
      tratamiento: tratamiento && { ...tratamiento, frecuencia: tratamiento.cadaHoras ? `cada ${tratamiento.cadaHoras} h` : '' },
    })
    if (tratamiento)
      agregarTratamiento({
        hijoId: h.id,
        medicamento: trat.medicamento,
        dosis: trat.dosis,
        cadaHoras: Number(trat.cadaHoras) || null,
        duracionDias: Number(trat.duracionDias) || null,
        tipo: trat.duracionDias ? 'temporal' : 'cronico',
        notificaciones: true,
        inicio: iniciar ? new Date().toISOString() : null,
        estado: iniciar ? 'en_curso' : 'pendiente',
      })
    navigate('/visitas')
  }

  return (
    <Pagina titulo="Registrar visita" subtitulo={`Consulta de ${h.nombre}, para tenerla siempre a mano.`} volver>
      <form onSubmit={guardar} className="space-y-5">
        <Bloque icono="event" titulo="Información básica">
          <Campo etiqueta="Fecha de la visita">
            <input type="date" className="campo" value={f.fecha} onChange={cambiar('fecha')} />
          </Campo>
          <div>
            <span className="block text-sm font-semibold mb-1.5">Motivo</span>
            <div className="grid grid-cols-2 gap-2">
              {['Consulta', 'Control'].map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setF({ ...f, motivo: m })}
                  className={`min-h-12 rounded-xl font-semibold ${f.motivo === m ? 'bg-primary text-white shadow-float' : 'bg-surface-container text-on-surface'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="block text-sm font-semibold mb-1.5">Lugar de atención</span>
            <div className="flex flex-wrap gap-2">
              {proveedores.map((p) => (
                <Chip key={p} activo={f.lugar === p} onClick={() => setF({ ...f, lugar: p })}>
                  {p}
                </Chip>
              ))}
            </div>
            {f.lugar === 'Otro' && <input className="campo mt-2" placeholder="¿Dónde?" value={f.lugarOtro} onChange={cambiar('lugarOtro')} />}
          </div>
        </Bloque>

        <Bloque icono="stethoscope" titulo="Profesional">
          <Campo etiqueta="Médico tratante">
            <input className="campo" placeholder="Ej. Dra. Elena Ruiz" value={f.medico} onChange={cambiar('medico')} />
          </Campo>
          <Campo etiqueta="Especialidad">
            <input className="campo" list="especialidades" placeholder="Ej. Pediatra" value={f.especialidad} onChange={cambiar('especialidad')} />
            <datalist id="especialidades">
              {ESPECIALIDADES.map((e) => (
                <option key={e} value={e} />
              ))}
            </datalist>
          </Campo>
        </Bloque>

        <Bloque icono="clinical_notes" titulo="Hallazgos clínicos">
          <Campo etiqueta="Diagnóstico">
            <textarea className="campo min-h-24" placeholder="Anotá el diagnóstico principal…" value={f.diagnostico} onChange={cambiar('diagnostico')} />
          </Campo>
          <div>
            <span className="block text-sm font-semibold mb-1.5">Procedimientos realizados</span>
            <div className="flex flex-wrap gap-2">
              {[...new Set([...PROCEDIMIENTOS, ...procedimientos])].map((p) => (
                <Chip key={p} activo={procedimientos.includes(p)} onClick={() => alternarProc(p)}>
                  {p}
                </Chip>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <input className="campo" placeholder="Otro procedimiento" value={nuevoProc} onChange={(e) => setNuevoProc(e.target.value)} />
              <button
                type="button"
                className="w-12 shrink-0 rounded-xl bg-primary-fixed text-primary flex items-center justify-center"
                onClick={() => {
                  if (nuevoProc.trim()) alternarProc(nuevoProc.trim())
                  setNuevoProc('')
                }}
                aria-label="Agregar procedimiento"
              >
                <Icon name="add" />
              </button>
            </div>
          </div>
          <Campo etiqueta="Próximo control (nota)">
            <input className="campo" placeholder="Ej. En 10 días con pediatra" value={f.proximoControl} onChange={cambiar('proximoControl')} />
          </Campo>
        </Bloque>

        <Bloque
          icono="medication"
          titulo="Tratamiento"
          accion={
            !conTratamiento && (
              <button type="button" onClick={() => setConTratamiento(true)} className="text-primary font-semibold flex items-center gap-1 min-h-12">
                <Icon name="add" /> Agregar
              </button>
            )
          }
        >
          {conTratamiento ? (
            <>
              <Campo etiqueta="Medicamento">
                <input className="campo" placeholder="Ej. Ibuprofeno" value={trat.medicamento} onChange={(e) => setTrat({ ...trat, medicamento: e.target.value })} />
              </Campo>
              <div className="grid grid-cols-3 gap-2">
                <Campo etiqueta="Dosis">
                  <input className="campo" placeholder="5 ml" value={trat.dosis} onChange={(e) => setTrat({ ...trat, dosis: e.target.value })} />
                </Campo>
                <Campo etiqueta="Cada (h)">
                  <input className="campo" inputMode="numeric" placeholder="8" value={trat.cadaHoras} onChange={(e) => setTrat({ ...trat, cadaHoras: e.target.value })} />
                </Campo>
                <Campo etiqueta="Días">
                  <input className="campo" inputMode="numeric" placeholder="7" value={trat.duracionDias} onChange={(e) => setTrat({ ...trat, duracionDias: e.target.value })} />
                </Campo>
              </div>
              <Interruptor etiqueta="¿Iniciar tratamiento ahora?" activo={iniciar} onChange={setIniciar} />
            </>
          ) : (
            <p className="text-sm text-on-surface-variant">Si le recetaron algo, agregalo y queda en Tratamientos.</p>
          )}
        </Bloque>

        <Boton type="submit" icono="save" className="w-full uppercase tracking-wide">
          Guardar visita
        </Boton>
      </form>
    </Pagina>
  )
}
