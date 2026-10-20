import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Boton, Campo, Icon, Interruptor, Pagina } from '../components/ui'
import { useStore } from '../data/store'

const GRUPOS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export default function NuevoHijo() {
  const { agregarHijo, agregarTratamiento } = useStore()
  const navigate = useNavigate()
  const [f, setF] = useState({
    nombre: '',
    cedula: '',
    nacimiento: '',
    peso: '',
    altura: '',
    grupoSanguineo: '',
    alergias: '',
    prematuro: false,
    vacunasAlDia: true,
    foto: null,
  })
  const [enfermedades, setEnfermedades] = useState([])
  const [prolongados, setProlongados] = useState([])
  const cambiar = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const elegirFoto = (e) => {
    const archivo = e.target.files?.[0]
    if (archivo) setF({ ...f, foto: URL.createObjectURL(archivo) })
  }

  const guardar = (e) => {
    e.preventDefault()
    const hijo = agregarHijo({
      ...f,
      peso: Number(f.peso) || 0,
      altura: Number(f.altura) || 0,
      alergias: f.alergias.split(',').map((a) => a.trim()).filter(Boolean),
      condiciones: enfermedades
        .filter((x) => x.nombre)
        .map((x) => ({ nombre: x.nombre, tipo: 'Crónica', estado: 'Controlada', desde: x.anio })),
    })
    // Los tratamientos de enfermedades crónicas y los prolongados quedan como crónicos sin notificaciones
    ;[...enfermedades.filter((x) => x.medicamento), ...prolongados.filter((x) => x.medicamento)].forEach((x) =>
      agregarTratamiento({
        hijoId: hijo.id,
        medicamento: x.medicamento,
        dosis: x.dosis,
        cadaHoras: Number(x.frecuencia) || null,
        duracionDias: null,
        inicio: new Date().toISOString(),
        tipo: 'cronico',
        notificaciones: false,
        estado: 'en_curso',
      }),
    )
    navigate('/perfil')
  }

  const editarLista = (lista, setLista, i, k) => (e) =>
    setLista(lista.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)))

  return (
    <Pagina titulo="Agregar hijo" subtitulo="Estos datos forman su ficha de emergencia." volver>
      <form onSubmit={guardar} className="space-y-6">
        <label className="flex flex-col items-center gap-2 cursor-pointer">
          <span className="relative w-32 h-32 rounded-full bg-surface-high flex items-center justify-center overflow-hidden">
            {f.foto ? <img src={f.foto} alt="" className="w-full h-full object-cover" /> : <Icon name="add_a_photo" className="text-4xl text-primary" />}
            <span className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center border-4 border-background">
              <Icon name="add" className="text-xl" />
            </span>
          </span>
          <span className="text-primary font-semibold text-sm">Agregar foto (opcional)</span>
          <input type="file" accept="image/*" className="hidden" onChange={elegirFoto} />
        </label>

        <div className="bg-surface-low rounded-3xl p-5 space-y-4">
          <Campo etiqueta="Nombre" icono="person">
            <input className="campo pl-11" required placeholder="Ej. Mateo" value={f.nombre} onChange={cambiar('nombre')} />
          </Campo>
          <Campo etiqueta="Cédula de identidad" icono="badge">
            <input className="campo pl-11" inputMode="numeric" placeholder="Ej. 5.123.456-7" value={f.cedula} onChange={cambiar('cedula')} />
          </Campo>
          <Campo etiqueta="Fecha de nacimiento" icono="calendar_month">
            <input type="date" className="campo pl-11" required value={f.nacimiento} onChange={cambiar('nacimiento')} />
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Peso (kg)" icono="scale">
              <input className="campo pl-11" inputMode="decimal" placeholder="0,0" value={f.peso} onChange={cambiar('peso')} />
            </Campo>
            <Campo etiqueta="Altura (cm)" icono="height">
              <input className="campo pl-11" inputMode="numeric" placeholder="0" value={f.altura} onChange={cambiar('altura')} />
            </Campo>
          </div>
          <Campo etiqueta="Grupo sanguíneo" icono="water_drop">
            <select className="campo pl-11 appearance-none" value={f.grupoSanguineo} onChange={cambiar('grupoSanguineo')}>
              <option value="">Seleccionar grupo</option>
              {GRUPOS.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </Campo>
        </div>

        <div className="bg-surface-low rounded-3xl p-5 space-y-2">
          <Campo etiqueta="Alergias conocidas (separadas por coma)">
            <textarea className="campo min-h-24" placeholder="Ej. Penicilina, ácaros" value={f.alergias} onChange={cambiar('alergias')} />
          </Campo>
          <Interruptor etiqueta="¿Es prematuro?" activo={f.prematuro} onChange={(v) => setF({ ...f, prematuro: v })} />
          <Interruptor etiqueta="¿Vacunas al día?" activo={f.vacunasAlDia} onChange={(v) => setF({ ...f, vacunasAlDia: v })} />
        </div>

        <BloqueLista
          titulo="Enfermedades crónicas"
          vacio="Por ejemplo asma, con su tratamiento asociado."
          onAgregar={() => setEnfermedades([...enfermedades, { nombre: '', anio: '', medicamento: '', dosis: '', frecuencia: '' }])}
        >
          {enfermedades.map((x, i) => (
            <div key={i} className="bg-surface-low rounded-3xl p-5 space-y-4">
              <Campo etiqueta="Enfermedad">
                <input className="campo" placeholder="Ej. Asma" value={x.nombre} onChange={editarLista(enfermedades, setEnfermedades, i, 'nombre')} />
              </Campo>
              <Campo etiqueta="Año de diagnóstico">
                <input className="campo" inputMode="numeric" placeholder="AAAA" value={x.anio} onChange={editarLista(enfermedades, setEnfermedades, i, 'anio')} />
              </Campo>
              <div className="text-primary font-semibold text-sm pt-2 border-t border-surface-high">Tratamiento asociado</div>
              <CamposMedicamento x={x} onCambio={(k) => editarLista(enfermedades, setEnfermedades, i, k)} />
            </div>
          ))}
        </BloqueLista>

        <BloqueLista
          titulo="Tratamientos prolongados"
          vacio="Vitaminas, inhaladores o cualquier medicación diaria."
          onAgregar={() => setProlongados([...prolongados, { medicamento: '', dosis: '', frecuencia: '' }])}
        >
          {prolongados.map((x, i) => (
            <div key={i} className="bg-surface-low rounded-3xl p-5 space-y-4">
              <CamposMedicamento x={x} onCambio={(k) => editarLista(prolongados, setProlongados, i, k)} />
            </div>
          ))}
        </BloqueLista>

        <Boton type="submit" icono="save" className="w-full uppercase tracking-wide">
          Guardar perfil
        </Boton>
      </form>
    </Pagina>
  )
}

function BloqueLista({ titulo, vacio, onAgregar, children }) {
  const hay = Array.isArray(children) ? children.length > 0 : !!children
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">
          {titulo} <span className="text-on-surface-variant font-normal text-sm">(opcional)</span>
        </h2>
        <button type="button" onClick={onAgregar} className="text-primary font-semibold flex items-center gap-1 min-h-12 px-2">
          <Icon name="add_circle" /> Agregar
        </button>
      </div>
      {hay ? children : <p className="text-sm text-on-surface-variant">{vacio}</p>}
    </section>
  )
}

function CamposMedicamento({ x, onCambio }) {
  return (
    <>
      <Campo etiqueta="Medicamento">
        <input className="campo" placeholder="Nombre del medicamento" value={x.medicamento} onChange={onCambio('medicamento')} />
      </Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Dosis">
          <input className="campo" placeholder="Ej. 5 ml" value={x.dosis} onChange={onCambio('dosis')} />
        </Campo>
        <Campo etiqueta="Cada (horas)">
          <input className="campo" inputMode="numeric" placeholder="Ej. 12" value={x.frecuencia} onChange={onCambio('frecuencia')} />
        </Campo>
      </div>
    </>
  )
}
