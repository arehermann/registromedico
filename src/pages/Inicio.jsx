import { Link, useNavigate } from 'react-router-dom'
import { Avatar, Icon, Pagina } from '../components/ui'
import { useStore } from '../data/store'
import { edad, hora, proximaDosis } from '../data/fechas'

function Dato({ icono, color, etiqueta, valor }) {
  return (
    <div className="bg-surface-lowest/80 rounded-2xl py-3 px-2 text-center">
      <Icon name={icono} className={`text-xl ${color}`} />
      <div className="text-xs text-on-surface-variant mt-0.5">{etiqueta}</div>
      <div className="font-bold">{valor}</div>
    </div>
  )
}

export default function Inicio() {
  const { hijos, tratamientos, setHijoActivoId } = useStore()
  const navigate = useNavigate()

  const abrir = (id, ruta = '/perfil') => {
    setHijoActivoId(id)
    navigate(ruta)
  }

  // Próximas tomas de todos los hijos, para tenerlas a la vista al abrir la app
  const proximas = tratamientos
    .map((t) => ({ t, cuando: proximaDosis(t) }))
    .filter((x) => x.cuando && x.t.notificaciones)
    .sort((a, b) => a.cuando - b.cuando)
    .slice(0, 2)

  return (
    <Pagina titulo="Mis pacientes" subtitulo="La salud de tus hijos, siempre a mano.">
      {proximas.length > 0 && (
        <div className="mb-6 space-y-2">
          {proximas.map(({ t, cuando }) => {
            const hijo = hijos.find((h) => h.id === t.hijoId)
            return (
              <button
                key={t.id}
                onClick={() => abrir(t.hijoId, '/tratamientos')}
                className="w-full flex items-center gap-3 bg-primary-container text-white rounded-2xl px-4 py-3 text-left"
              >
                <Icon name="notifications_active" fill />
                <span className="flex-1 text-sm">
                  <b>{hijo?.nombre}</b>: {t.medicamento} {t.dosis}
                </span>
                <span className="font-display font-bold">{hora(cuando.toISOString())}</span>
              </button>
            )
          })}
        </div>
      )}

      <div className="space-y-4">
        {hijos.map((h) => (
          <button
            key={h.id}
            onClick={() => abrir(h.id)}
            className="w-full text-left bg-surface-container rounded-3xl p-5 shadow-soft active:shadow-none active:scale-[0.99] transition"
          >
            <div className="flex items-center gap-4 mb-4">
              <Avatar hijo={h} size="w-14 h-14" texto="text-2xl" />
              <div className="flex-1">
                <div className="font-display text-2xl font-semibold leading-tight">{h.nombre}</div>
                <div className="text-on-surface-variant font-semibold text-sm">{edad(h.nacimiento)}</div>
              </div>
              {h.alergias.length > 0 && (
                <span className="flex items-center gap-1 text-xs font-semibold bg-error-container text-on-error-container rounded-full px-3 py-1">
                  <Icon name="warning" className="text-base" /> Alergias
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Dato icono="scale" color="text-secondary" etiqueta="Peso" valor={`${h.peso} kg`} />
              <Dato icono="height" color="text-tertiary" etiqueta="Altura" valor={`${h.altura} cm`} />
              <Dato icono="water_drop" color="text-error" etiqueta="Sangre" valor={h.grupoSanguineo} />
            </div>
          </button>
        ))}

        <Link
          to="/hijo/nuevo"
          className="flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-outline-variant bg-surface-low py-8 text-primary font-semibold"
        >
          <span className="w-14 h-14 rounded-full bg-primary-container text-white flex items-center justify-center shadow-float">
            <Icon name="add" className="text-3xl" />
          </span>
          Agregar un hijo
        </Link>
      </div>

      <h2 className="text-xl font-bold mt-8 mb-3">Registro rápido</h2>
      <div className="grid grid-cols-3 gap-3">
        {[
          { to: '/sintomas/nuevo', icono: 'thermostat', texto: 'Síntoma', tono: 'bg-tertiary-fixed text-tertiary' },
          { to: '/visitas/nueva', icono: 'stethoscope', texto: 'Visita', tono: 'bg-primary-fixed text-primary' },
          { to: '/tratamientos?rescate=1', icono: 'medication', texto: 'Rescate', tono: 'bg-secondary-container text-on-secondary-container' },
        ].map((a) => (
          <Link key={a.to} to={a.to} className="bg-surface-lowest rounded-3xl shadow-soft p-4 flex flex-col items-center gap-2 font-semibold text-sm">
            <span className={`w-12 h-12 rounded-full flex items-center justify-center ${a.tono}`}>
              <Icon name={a.icono} />
            </span>
            {a.texto}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <Link to="/sintomas" className="bg-surface-lowest rounded-2xl shadow-soft p-4 flex items-center gap-2 font-semibold text-sm">
          <Icon name="history" className="text-primary" /> Historial de síntomas
        </Link>
        <Link to="/configuracion" className="bg-surface-lowest rounded-2xl shadow-soft p-4 flex items-center gap-2 font-semibold text-sm">
          <Icon name="settings" className="text-primary" /> Ajustes y respaldo
        </Link>
      </div>
    </Pagina>
  )
}
