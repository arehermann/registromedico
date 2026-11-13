import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Boton, Campo, Chip, Icon, Interruptor, Pagina } from '../components/ui'
import { useStore } from '../data/store'
import { ESPECIALIDADES } from '../data/ejemplo'
import { abrirAdjunto, prepararArchivo } from '../data/archivos'
import { Miniatura } from './LeerDocumento'
import { hoy } from '../data/fechas'

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

const TRAT_VACIO = { medicamento: '', dosis: '', cadaHoras: '', duracionDias: '', indicaciones: '' }
const texto = (v) => (v == null ? '' : String(v))

const tratDeVisita = (v) => v.tratamientos ?? (v.tratamiento ? [v.tratamiento] : [])
const nombreMed = (t) => t.medicamento.trim().toLowerCase()

// Campos del formulario: los de la visita que se edita, o los leídos por la IA (si vienen de "Leer un documento")
function inicial(prefill, proveedores, existente) {
  const v = existente ?? prefill?.visita ?? {}
  const lugarConocido = v.lugar && proveedores.find((p) => p.toLowerCase() === v.lugar.toLowerCase())
  return {
    f: {
      fecha: /^\d{4}-\d{2}-\d{2}$/.test(v.fecha ?? '') ? v.fecha : hoy(),
      motivo: v.motivo === 'Control' ? 'Control' : 'Consulta',
      lugar: lugarConocido || (v.lugar ? 'Otro' : ''),
      lugarOtro: lugarConocido ? '' : texto(v.lugar),
      medico: texto(v.medico),
      especialidad: texto(v.especialidad),
      diagnostico: texto(v.diagnostico),
      proximoControl: texto(v.proximoControl),
      notas: texto(v.notas),
    },
    procedimientos: v.procedimientos ?? [],
    trats: (existente ? tratDeVisita(existente) : (prefill?.tratamientos ?? [])).map((t) => ({
      medicamento: texto(t.medicamento),
      dosis: texto(t.dosis),
      cadaHoras: texto(t.cadaHoras),
      duracionDias: texto(t.duracionDias),
      indicaciones: texto(t.indicaciones),
    })),
  }
}

export default function NuevaVisita({ editar = false }) {
  const { hijoActivo: h, hijos, proveedores, visitas, adjuntos: guardados, agregarVisita, actualizarVisita, agregarTratamiento, agregarAdjunto, eliminarAdjunto, actualizarHijo } = useStore()
  const navigate = useNavigate()
  const { state } = useLocation()
  const { id } = useParams()
  const existente = editar ? visitas.find((v) => v.id === id) : null
  if (editar && !existente) return <Pagina titulo="Visita no encontrada" volver />
  return <Formulario key={id ?? 'nueva'} {...{ h: existente ? (hijos.find((x) => x.id === existente.hijoId) ?? h) : h, proveedores, existente, guardados, state, navigate, agregarVisita, actualizarVisita, agregarTratamiento, agregarAdjunto, eliminarAdjunto, actualizarHijo }} />
}

function Formulario({ h, proveedores, existente, guardados, state, navigate, agregarVisita, actualizarVisita, agregarTratamiento, agregarAdjunto, eliminarAdjunto, actualizarHijo }) {
  const [ini] = useState(() => inicial(existente ? null : state?.prefill, proveedores, existente))
  const leido = !existente && Boolean(state?.prefill)
  // Al editar, solo los medicamentos que se agregan ahora pueden ir a Tratamientos (los demás ya fueron)
  const [yaEstaban] = useState(() => new Set(ini.trats.filter(() => existente).map(nombreMed)))
  const [previos, setPrevios] = useState(() => (existente ? guardados.filter((a) => a.visitaId === existente.id) : []))
  const [agregarATratamientos, setAgregarATratamientos] = useState(null)
  const [f, setF] = useState(ini.f)
  const [procedimientos, setProcedimientos] = useState(ini.procedimientos)
  const [nuevoProc, setNuevoProc] = useState('')
  const [trats, setTrats] = useState(ini.trats)
  const [iniciar, setIniciar] = useState(false)
  const [adjuntos, setAdjuntos] = useState(existente ? [] : (state?.adjuntos ?? []))
  const [errorAdjunto, setErrorAdjunto] = useState(null)
  const entradaArchivo = useRef(null)
  const cambiar = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const cambiarTrat = (i, k) => (e) => setTrats((l) => l.with(i, { ...l[i], [k]: e.target.value }))

  const adjuntar = async (e) => {
    const lista = [...e.target.files]
    e.target.value = ''
    setErrorAdjunto(null)
    try {
      const nuevos = await Promise.all(lista.map(prepararArchivo))
      setAdjuntos((a) => [...a, ...nuevos])
    } catch (err) {
      setErrorAdjunto(err.message)
    }
  }

  const alternarProc = (p) => setProcedimientos((l) => (l.includes(p) ? l.filter((x) => x !== p) : [...l, p]))

  // Una visita de otra fecha (por ejemplo una receta vieja) no carga sus medicamentos en Tratamientos, salvo que se pida
  const esDeHoy = f.fecha === hoy()
  const medsNuevos = trats.filter((t) => t.medicamento.trim() && !yaEstaban.has(nombreMed(t)))
  const aTratamientos = agregarATratamientos ?? esDeHoy

  const guardar = (e) => {
    e.preventDefault()
    const tratamientos = trats.filter((t) => t.medicamento.trim()).map((t) => ({ ...t, frecuencia: t.cadaHoras ? `cada ${t.cadaHoras} h` : '' }))
    const campos = {
      fecha: f.fecha,
      motivo: f.motivo,
      lugar: f.lugar === 'Otro' ? f.lugarOtro || 'Otro' : f.lugar,
      medico: f.medico,
      especialidad: f.especialidad,
      diagnostico: f.diagnostico,
      procedimientos,
      proximoControl: f.proximoControl,
      notas: f.notas.trim() || undefined,
      // `tratamiento` queda por compatibilidad con visitas y respaldos anteriores
      tratamiento: tratamientos[0] ?? null,
      tratamientos,
    }
    let visita = existente
    if (existente) actualizarVisita(existente.id, campos)
    else visita = agregarVisita({ hijoId: h.id, ...campos, leidoConIA: leido || undefined })
    const originales = existente ? guardados.filter((a) => a.visitaId === existente.id) : []
    for (const a of originales) if (!previos.some((p) => p.id === a.id)) eliminarAdjunto(a.id)
    if (aTratamientos)
      for (const t of medsNuevos)
        agregarTratamiento({
        hijoId: h.id,
        medicamento: t.medicamento.trim(),
        dosis: t.dosis,
        cadaHoras: Number(t.cadaHoras) || null,
        duracionDias: Number(t.duracionDias) || null,
        indicaciones: t.indicaciones || undefined,
        tipo: t.duracionDias ? 'temporal' : 'cronico',
        notificaciones: true,
        inicio: iniciar ? new Date().toISOString() : null,
        estado: iniciar ? 'en_curso' : 'pendiente',
      })
    for (const a of adjuntos) agregarAdjunto({ hijoId: h.id, visitaId: visita.id, nombre: a.nombre, tipo: a.tipo, datos: a.datos })
    const p = state?.perfil
    if (p && (p.peso || p.altura || p.alergias?.length)) {
      const cambios = {}
      if (p.peso) cambios.peso = p.peso
      if (p.altura) cambios.altura = p.altura
      if (p.alergias?.length) cambios.alergias = [...(h.alergias ?? []), ...p.alergias]
      actualizarHijo(h.id, cambios)
    }
    if (existente) navigate(-1)
    else navigate('/visitas')
  }

  return (
    <Pagina titulo={existente ? 'Editar visita' : 'Registrar visita'} subtitulo={existente ? `Consulta de ${h.nombre}` : `Consulta de ${h.nombre}, para tenerla siempre a mano.`} volver>
      <form onSubmit={guardar} className="space-y-5">
        {existente ? null : leido ? (
          <div className="bg-primary-fixed/60 rounded-3xl p-4 flex gap-3">
            <Icon name="auto_awesome" className="text-primary" />
            <p className="text-sm">Completé los campos con lo que leí del documento. Revisalos y corregí lo que haga falta antes de guardar.</p>
          </div>
        ) : (
          <Link to="/documento" className="bg-primary-fixed/60 rounded-3xl p-4 flex items-center gap-3">
            <Icon name="document_scanner" className="text-primary" />
            <span className="flex-1 text-sm">
              <b>¿Tenés la receta o el informe?</b> Sacale una foto y la IA completa la visita.
            </span>
            <Icon name="chevron_right" className="text-on-surface-variant" />
          </Link>
        )}
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
          <Campo etiqueta="Notas">
            <textarea className="campo min-h-24" placeholder="Lo que quieras recordar. No aparece en la lista de visitas, solo al abrirla." value={f.notas} onChange={cambiar('notas')} />
          </Campo>
        </Bloque>

        <Bloque
          icono="medication"
          titulo="Tratamiento"
          accion={
            <button type="button" onClick={() => setTrats((l) => [...l, TRAT_VACIO])} className="text-primary font-semibold flex items-center gap-1 min-h-12">
              <Icon name="add" /> Agregar
            </button>
          }
        >
          {trats.length ? (
            <>
              {trats.map((t, i) => (
                <div key={i} className={`space-y-3 ${i > 0 ? 'pt-4 border-t border-surface-high' : ''}`}>
                  <div className="flex items-end gap-2">
                    <Campo etiqueta="Medicamento" className="flex-1">
                      <input className="campo" placeholder="Ej. Ibuprofeno" value={t.medicamento} onChange={cambiarTrat(i, 'medicamento')} />
                    </Campo>
                    <button
                      type="button"
                      onClick={() => setTrats((l) => l.filter((_, j) => j !== i))}
                      className="w-12 h-12 shrink-0 rounded-xl bg-surface-container text-on-surface-variant flex items-center justify-center"
                      aria-label="Quitar medicamento"
                    >
                      <Icon name="delete" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Campo etiqueta="Dosis">
                      <input className="campo" placeholder="5 ml" value={t.dosis} onChange={cambiarTrat(i, 'dosis')} />
                    </Campo>
                    <Campo etiqueta="Cada (h)">
                      <input className="campo" inputMode="numeric" placeholder="8" value={t.cadaHoras} onChange={cambiarTrat(i, 'cadaHoras')} />
                    </Campo>
                    <Campo etiqueta="Días">
                      <input className="campo" inputMode="numeric" placeholder="7" value={t.duracionDias} onChange={cambiarTrat(i, 'duracionDias')} />
                    </Campo>
                  </div>
                  {t.indicaciones && (
                    <Campo etiqueta="Indicaciones">
                      <input className="campo" value={t.indicaciones} onChange={cambiarTrat(i, 'indicaciones')} />
                    </Campo>
                  )}
                </div>
              ))}
              {medsNuevos.length > 0 && !esDeHoy && (
                <div className="space-y-1">
                  <Interruptor etiqueta="Agregar también a Tratamientos" activo={aTratamientos} onChange={setAgregarATratamientos} />
                  {!aTratamientos && <p className="text-sm text-on-surface-variant">La visita no es de hoy, así que la medicación queda anotada solo en la visita.</p>}
                </div>
              )}
              {medsNuevos.length > 0 && aTratamientos && (
                <Interruptor etiqueta={medsNuevos.length > 1 ? '¿Iniciar los tratamientos ahora?' : '¿Iniciar tratamiento ahora?'} activo={iniciar} onChange={setIniciar} />
              )}
            </>
          ) : (
            <p className="text-sm text-on-surface-variant">Si le recetaron algo, agregalo y queda en Tratamientos.</p>
          )}
        </Bloque>

        <Bloque
          icono="attach_file"
          titulo="Documentos"
          accion={
            <button type="button" onClick={() => entradaArchivo.current.click()} className="text-primary font-semibold flex items-center gap-1 min-h-12">
              <Icon name="add" /> Adjuntar
            </button>
          }
        >
          <input ref={entradaArchivo} type="file" accept="application/pdf,image/*" multiple className="hidden" onChange={adjuntar} />
          {previos.length || adjuntos.length ? (
            <div className="space-y-2">
              {previos.map((a) => (
                <Miniatura key={a.id} a={a} onAbrir={() => abrirAdjunto(a)} onQuitar={() => setPrevios((l) => l.filter((x) => x.id !== a.id))} />
              ))}
              {adjuntos.map((a, i) => (
                <Miniatura key={i} a={a} onAbrir={() => abrirAdjunto(a)} onQuitar={() => setAdjuntos((l) => l.filter((_, j) => j !== i))} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant">Recetas, informes o resultados. Quedan guardados con la visita.</p>
          )}
          {errorAdjunto && <p className="text-sm text-error">{errorAdjunto}</p>}
        </Bloque>

        <Boton type="submit" icono="save" className="w-full uppercase tracking-wide">
          {existente ? 'Guardar cambios' : 'Guardar visita'}
        </Boton>
      </form>
    </Pagina>
  )
}
