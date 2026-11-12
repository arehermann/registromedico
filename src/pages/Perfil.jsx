import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar, Boton, Campo, Card, EtiquetaEstado, Icon, Pagina, Seccion, Vacio } from '../components/ui'
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

  return (
    <Pagina>
      <div className="flex items-center gap-4 mb-6">
        <Avatar hijo={h} size="w-20 h-20" texto="text-3xl" />
        <div className="flex-1 min-w-0">
          <h1 className="text-[28px] leading-9 font-bold">{h.nombre}</h1>
          <p className="text-on-surface-variant font-semibold">
            {edad(h.nacimiento)} · nació el {fechaCorta(h.nacimiento)}
          </p>
          {h.cedula && <p className="text-on-surface-variant text-sm">C.I. {h.cedula}</p>}
        </div>
        <Link to="/hijo/editar" className="w-12 h-12 rounded-full bg-surface-container text-primary flex items-center justify-center shrink-0" aria-label="Editar ficha">
          <Icon name="edit" />
        </Link>
      </div>

      {/* Bloque de emergencia */}
      <div className="rounded-3xl bg-primary-container text-white p-5 mb-4 shadow-float">
        <div className="flex items-center gap-2 text-sm font-semibold opacity-90 mb-3">
          <Icon name="emergency" /> Datos para emergencia
        </div>
        <div className="flex items-stretch gap-3">
          <div className="bg-white/15 rounded-2xl px-4 py-3 text-center">
            <div className="text-xs opacity-90">Sangre</div>
            <div className="font-display text-3xl font-bold">{h.grupoSanguineo || '—'}</div>
          </div>
          <div className="flex-1 bg-white/15 rounded-2xl px-4 py-3">
            <div className="text-xs opacity-90 mb-1">Alergias</div>
            {h.alergias.length ? (
              <div className="flex flex-wrap gap-1.5">
                {h.alergias.map((a) => (
                  <span key={a} className="bg-white text-on-error-container font-semibold text-sm rounded-full px-3 py-1">
                    {a}
                  </span>
                ))}
              </div>
            ) : (
              <div className="font-semibold">Sin alergias conocidas</div>
            )}
          </div>
        </div>
        {h.condiciones?.length > 0 && (
          <div className="mt-3 text-sm">
            <span className="opacity-90">Condiciones: </span>
            <b>{h.condiciones.map((c) => c.nombre).join(', ')}</b>
          </div>
        )}
      </div>

      <Card className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg">Medidas</h2>
          <button onClick={() => setEditando((e) => !e)} className="text-primary font-semibold text-sm flex items-center gap-1 min-h-10">
            <Icon name={editando ? 'close' : 'edit'} className="text-lg" /> {editando ? 'Cerrar' : 'Actualizar'}
          </button>
        </div>
        {editando ? (
          <EditarMedidas hijo={h} onListo={() => setEditando(false)} />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-low rounded-2xl p-3 flex items-center gap-3">
              <Icon name="scale" className="text-secondary" />
              <div>
                <div className="text-xs text-on-surface-variant">Peso</div>
                <div className="font-bold text-lg">{h.peso} kg</div>
              </div>
            </div>
            <div className="bg-surface-low rounded-2xl p-3 flex items-center gap-3">
              <Icon name="height" className="text-tertiary" />
              <div>
                <div className="text-xs text-on-surface-variant">Altura</div>
                <div className="font-bold text-lg">{h.altura} cm</div>
              </div>
            </div>
          </div>
        )}
        <div className="flex gap-2 mt-3 text-sm">
          <span className={`rounded-full px-3 py-1 font-semibold ${h.vacunasAlDia ? 'bg-secondary-container text-on-secondary-container' : 'bg-tertiary-fixed text-tertiary'}`}>
            {h.vacunasAlDia ? 'Vacunas al día' : 'Vacunas pendientes'}
          </span>
          {h.prematuro && <span className="rounded-full px-3 py-1 font-semibold bg-primary-fixed text-primary">Prematuro</span>}
        </div>
      </Card>

      <Seccion
        icono="prescriptions"
        titulo="Tratamientos activos"
        accion={
          <Link to="/tratamientos" className="text-primary font-semibold text-sm">
            Ver todos
          </Link>
        }
      >
        {activos.length ? (
          <div className="space-y-2">
            {activos.map((t) => (
              <Card key={t.id} className="!p-4 flex items-center gap-3">
                <span className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${t.tipo === 'cronico' ? 'bg-primary-fixed text-primary' : 'bg-tertiary-fixed text-tertiary'}`}>
                  <Icon name={t.tipo === 'cronico' ? 'autorenew' : 'medication'} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{t.medicamento}</div>
                  <div className="text-sm text-on-surface-variant">
                    {t.dosis}
                    {t.cadaHoras ? ` · cada ${t.cadaHoras} h` : ''}
                  </div>
                </div>
                <EtiquetaEstado estado={estadoTratamiento(t)} />
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-on-surface-variant">No tiene tratamientos en curso.</p>
        )}
      </Seccion>

      {ultimaConControl && (
        <Card className="mb-6 !bg-tertiary-fixed/60 flex items-start gap-3">
          <Icon name="event_upcoming" className="text-tertiary" />
          <div>
            <div className="text-xs font-semibold text-tertiary uppercase tracking-wide">Próximo control</div>
            <div className="font-semibold">{ultimaConControl.proximoControl}</div>
            <div className="text-sm text-on-surface-variant">
              Indicado el {fechaCorta(ultimaConControl.fecha)} en {ultimaConControl.lugar}
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link to="/visitas" className="bg-surface-lowest shadow-soft rounded-3xl p-5 flex flex-col gap-2 font-semibold">
          <Icon name="clinical_notes" className="text-primary text-3xl" />
          Historia clínica
        </Link>
        <Link to="/visitas/nueva" className="bg-primary text-white shadow-float rounded-3xl p-5 flex flex-col gap-2 font-semibold">
          <Icon name="add_circle" className="text-3xl" />
          Agregar visita
        </Link>
      </div>
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
