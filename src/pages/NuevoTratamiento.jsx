import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Boton, Campo, Chip, Interruptor, Pagina } from '../components/ui'
import { useStore } from '../data/store'

export default function NuevoTratamiento() {
  const { hijoActivo: h, agregarTratamiento } = useStore()
  const navigate = useNavigate()
  const [f, setF] = useState({ medicamento: '', dosis: '', cadaHoras: '8', duracionDias: '7' })
  const [cronico, setCronico] = useState(false)
  const [notificaciones, setNotificaciones] = useState(true)
  const [iniciarAhora, setIniciarAhora] = useState(true)
  const cambiar = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const guardar = (e) => {
    e.preventDefault()
    agregarTratamiento({
      hijoId: h.id,
      medicamento: f.medicamento,
      dosis: f.dosis,
      cadaHoras: Number(f.cadaHoras) || null,
      duracionDias: cronico ? null : Number(f.duracionDias) || null,
      tipo: cronico ? 'cronico' : 'temporal',
      notificaciones,
      inicio: iniciarAhora ? new Date().toISOString() : null,
      estado: iniciarAhora ? 'en_curso' : 'pendiente',
    })
    navigate('/tratamientos')
  }

  return (
    <Pagina titulo="Nuevo tratamiento" subtitulo={`Para ${h.nombre}`} volver>
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
        </div>

        <div className="bg-surface-lowest rounded-3xl shadow-soft p-5 space-y-3">
          <Interruptor etiqueta="Sin duración definida (crónico)" activo={cronico} onChange={setCronico} />
          {!cronico && (
            <Campo etiqueta="Duración (días)">
              <input className="campo" inputMode="numeric" value={f.duracionDias} onChange={cambiar('duracionDias')} />
            </Campo>
          )}
          <Interruptor etiqueta="Recordatorios de cada toma" activo={notificaciones} onChange={setNotificaciones} />
          <Interruptor etiqueta="Iniciar ahora" activo={iniciarAhora} onChange={setIniciarAhora} />
          {!iniciarAhora && (
            <p className="text-sm text-on-surface-variant">Queda precargado. Cuando lo empiecen, tocá “Iniciar tratamiento” y los avisos arrancan desde ese momento.</p>
          )}
        </div>

        <Boton type="submit" icono="save" className="w-full uppercase tracking-wide">
          Guardar tratamiento
        </Boton>
      </form>
    </Pagina>
  )
}
