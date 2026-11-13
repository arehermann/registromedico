import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar, Boton, Campo, Card, EtiquetaEstado, Fila, Icon, Lista, Pagina, Seccion, Vacio } from '../components/ui'
import { useStore } from '../data/store'
import { edad, estadoTratamiento, fechaCorta } from '../data/fechas'

// Ficha del niño: lo más importante para una emergencia va arriba
export default function Perfil() {
  const { hijoActivo: h, tratamientos, visitas } = useStore()
  const [editando, setEditando] = useState(false)

  if (!h)
    return (
      <Pagina>
        <Vacio icono="child_care" titulo="Todavía no hay hijos" texto="Agregá el primero para armar su ficha.">
          <Link to="/hijo/nuevo" className="text-primary font-semibold">
            Agregar hijo
          </Link>
        </Vacio>
      </Pagina>
    )

  const activos = tratamientos.filter((t) => t.hijoId === h.id && t.estado === 'en_curso')
  const ultimaConControl = visitas
    .filter((v) => v.hijoId === h.id && v.proximoControl)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))[0]

  const chevron = <Icon name="chevron_right" className="text-on-surface-variant" />

  return (
    <Pagina>
      <div className="flex items-center gap-3 mb-4">
        <Avatar hijo={h} size="w-12 h-12" texto="text-xl" />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl leading-8 font-bold">{h.nombre}</h1>
          <p className="text-on-surface-variant text-sm">
            {edad(h.nacimiento)} · {fechaCorta(h.nacimiento)}
            {h.cedula && ` · C.I. ${h.cedula}`}
          </p>
        </div>
        <Link to="/hijo/editar" className="w-10 h-10 rounded-full text-primary flex items-center justify-center shrink-0" aria-label="Editar ficha">
          <Icon name="edit" />
        </Link>
      </div>

      {/* Lo de emergencia, en texto simple y bien visible */}
      <div className="rounded-2xl bg-primary-container text-white px-4 py-3 mb-6 space-y-1">
        <div className="text-xs font-semibold uppercase tracking-wider opacity-80">Emergencia</div>
        <div className="flex items-baseline gap-2">
          <span className="opacity-80 text-sm">Sangre</span>
          <b className="text-lg">{h.grupoSanguineo || '—'}</b>
        </div>
        <div className="text-sm">
          <span className="opacity-80">Alergias: </span>
          <b>{h.alergias.length ? h.alergias.join(', ') : 'ninguna conocida'}</b>
        </div>
        {h.condiciones?.length > 0 && (
          <div className="text-sm">
            <span className="opacity-80">Condiciones: </span>
            <b>{h.condiciones.map((c) => c.nombre).join(', ')}</b>
          </div>
        )}
      </div>

      <Seccion
        titulo="Datos"
        accion={
          <button onClick={() => setEditando((e) => !e)} className="text-primary font-semibold text-sm min-h-8">
            {editando ? 'Cerrar' : 'Actualizar medidas'}
          </button>
        }
      >
        {editando ? (
          <Card>
            <EditarMedidas hijo={h} onListo={() => setEditando(false)} />
          </Card>
        ) : (
          <Lista>
            <Fila titulo="Peso" derecha={<span className="font-semibold">{h.peso} kg</span>} />
            <Fila titulo="Altura" derecha={<span className="font-semibold">{h.altura} cm</span>} />
            <Fila
              titulo="Vacunas"
              derecha={<span className={`font-semibold ${h.vacunasAlDia ? 'text-secondary' : 'text-tertiary'}`}>{h.vacunasAlDia ? 'Al día' : 'Pendientes'}</span>}
            />
            {h.prematuro && <Fila titulo="Prematuro" derecha={<span className="font-semibold">Sí</span>} />}
          </Lista>
        )}
      </Seccion>

      <Seccion
        titulo="Tratamientos en curso"
        accion={
          <Link to="/tratamientos" className="text-primary font-semibold text-sm">
            Ver todos
          </Link>
        }
      >
        {activos.length ? (
          <Lista>
            {activos.map((t) => (
              <Fila
                key={t.id}
                to="/tratamientos"
                titulo={t.medicamento}
                detalle={[t.dosis, t.cadaHoras && `cada ${t.cadaHoras} h`].filter(Boolean).join(' · ')}
                derecha={<EtiquetaEstado estado={estadoTratamiento(t)} />}
              />
            ))}
          </Lista>
        ) : (
          <p className="text-on-surface-variant px-1">No tiene tratamientos en curso.</p>
        )}
      </Seccion>

      {ultimaConControl && (
        <Seccion titulo="Próximo control">
          <Lista>
            <Fila to="/visitas" titulo={ultimaConControl.proximoControl} detalle={`Indicado el ${fechaCorta(ultimaConControl.fecha)} en ${ultimaConControl.lugar}`} derecha={chevron} />
          </Lista>
        </Seccion>
      )}
    </Pagina>
  )
}

function EditarMedidas({ hijo, onListo }) {
  const { actualizarHijo } = useStore()
  const [peso, setPeso] = useState(hijo.peso)
  const [altura, setAltura] = useState(hijo.altura)
  const guardar = () => {
    actualizarHijo(hijo.id, {
      peso: Number(String(peso).replace(',', '.')) || hijo.peso,
      altura: Number(altura) || hijo.altura,
    })
    onListo()
  }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Peso (kg)">
          <input className="campo" inputMode="decimal" value={peso} onChange={(e) => setPeso(e.target.value)} />
        </Campo>
        <Campo etiqueta="Altura (cm)">
          <input className="campo" inputMode="numeric" value={altura} onChange={(e) => setAltura(e.target.value)} />
        </Campo>
      </div>
      <Boton onClick={guardar} className="w-full" icono="check">
        Guardar medidas
      </Boton>
    </div>
  )
}
