import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Boton, Campo, Chip, Interruptor, Pagina } from '../components/ui'
import { useStore } from '../data/store'

export default function NuevoTratamiento({ editar = false }) {
  const { hijoActivo: h, tratamientos } = useStore()
  const { id } = useParams()
  const existente = editar ? tratamientos.find((t) => t.id === id) : null
  if (editar && !existente) return <Pagina titulo="Tratamiento no encontrado" volver />
  return <Formulario key={id ?? 'nuevo'} h={h} existente={existente} />
}

const texto = (v) => (v == null ? '' : String(v))

function Formulario({ h, existente }) {
  const { agregarTratamiento, actualizarTratamiento } = useStore()
  const navigate = useNavigate()
  const [f, setF] = useState(() =>
    existente
      ? { medicamento: texto(existente.medicamento), dosis: texto(existente.dosis), cadaHoras: texto(existente.cadaHoras), duracionDias: texto(existente.duracionDias || '7'), indicaciones: texto(existente.indicaciones) }
      : { medicamento: '', dosis: '', cadaHoras: '8', duracionDias: '7', indicaciones: '' },
  )
  const [cronico, setCronico] = useState(existente ? !existente.duracionDias : false)
  const [notificaciones, setNotificaciones] = useState(existente ? Boolean(existente.notificaciones) : true)
  const [iniciarAhora, setIniciarAhora] = useState(true)
  const cambiar = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const guardar = (e) => {
    e.preventDefault()
    const campos = {
      medicamento: f.medicamento.trim(),
      dosis: f.dosis,
      cadaHoras: Number(f.cadaHoras) || null,
      duracionDias: cronico ? null : Number(f.duracionDias) || null,
      indicaciones: f.indicaciones.trim() || undefined,
      tipo: cronico ? 'cronico' : 'temporal',
      notificaciones,
    }
    if (existente) {
      actualizarTratamiento(existente.id, campos)
      navigate(-1)
      return
    }
    agregarTratamiento({
      hijoId: h.id,
      ...campos,
      inicio: iniciarAhora ? new Date().toISOString() : null,
      estado: iniciarAhora ? 'en_curso' : 'pendiente',
    })
    navigate('/tratamientos')
  }

  return (
    <Pagina titulo={existente ? 'Editar tratamiento' : 'Nuevo tratamiento'} subtitulo={`Para ${h.nombre}`} volver>
      <form onSubmit={guardar} className="space-y-6">
        <div className="bg-surface-lowest rounded-3xl shadow-soft p-5 space-y-4">
          <Campo etiqueta="Medicamento" icono="medication">
            <input className="campo pl-11" required placeholder="Ej. Amoxicilina" value={f.medicamento} onChange={cambiar('medicamento')} />
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Dosis">
              <input className="campo" required placeholder="Ej. 5 ml" value={f.dosis} onChange={cambiar('dosis')} />
            </Campo>
            <Campo etiqueta="Cada (horas)">
              <input className="campo" inputMode="numeric" placeholder="Ej. 8" value={f.cadaHoras} onChange={cambiar('cadaHoras')} />
            </Campo>
          </div>
          <div className="flex flex-wrap gap-2">
            {['6', '8', '12', '24'].map((x) => (
              <Chip key={x} activo={f.cadaHoras === x} onClick={() => setF({ ...f, cadaHoras: x })}>
                Cada {x} h
              </Chip>
            ))}
          </div>
          {(existente || f.indicaciones) && (
            <Campo etiqueta="Indicaciones">
              <input className="campo" placeholder="Ej. Después de comer" value={f.indicaciones} onChange={cambiar('indicaciones')} />
            </Campo>
          )}
        </div>

        <div className="bg-surface-lowest rounded-3xl shadow-soft p-5 space-y-3">
          <Interruptor etiqueta="Sin duración definida (crónico)" activo={cronico} onChange={setCronico} />
          {!cronico && (
            <Campo etiqueta="Duración (días)">
              <input className="campo" inputMode="numeric" value={f.duracionDias} onChange={cambiar('duracionDias')} />
            </Campo>
          )}
          <Interruptor etiqueta="Recordatorios de cada toma" activo={notificaciones} onChange={setNotificaciones} />
          {!existente && <Interruptor etiqueta="Iniciar ahora" activo={iniciarAhora} onChange={setIniciarAhora} />}
          {!existente && !iniciarAhora && (
            <p className="text-sm text-on-surface-variant">Queda precargado. Cuando lo empiecen, tocá “Iniciar tratamiento” y los avisos arrancan desde ese momento.</p>
          )}
        </div>

        <Boton type="submit" icono="save" className="w-full uppercase tracking-wide">
          {existente ? 'Guardar cambios' : 'Guardar tratamiento'}
        </Boton>
      </form>
    </Pagina>
  )
}
