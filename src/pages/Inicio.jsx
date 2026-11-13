import { Link, useNavigate } from 'react-router-dom'
import { Avatar, Boton, Icon, Pagina } from '../components/ui'
import { ActivarRecordatorios, DosisPendientes, InstalarApp } from '../components/avisos'
import { useStore } from '../data/store'
import { edad, hora, proximaDosis } from '../data/fechas'

function Dato({ icono, color, etiqueta, valor }) {
  return (
    <div className="bg-surface-lowest/80 rounded-xl py-1.5 px-2 flex items-center justify-center gap-1.5">
      <Icon name={icono} className={`text-base ${color}`} />
      <div className="font-bold text-sm" title={etiqueta}>{valor}</div>
    </div>
  )
}

export default function Inicio() {
  const { hijos, tratamientos, setHijoActivoId, cargarEjemplo } = useStore()
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

  if (!hijos.length)
    return (
      <Pagina>
        <InstalarApp />
        <div className="text-center pt-6 pb-4">
          <div className="w-24 h-24 mx-auto rounded-full bg-surface-container flex items-center justify-center mb-5">
            <Icon name="child_care" className="text-5xl text-primary" />
          </div>
          <h1 className="text-[28px] leading-9 font-bold mb-2">Empecemos por tus hijos</h1>
          <p className="text-on-surface-variant mb-8">Cargá sus datos básicos para tener la ficha de emergencia siempre a mano. Todo queda guardado solo en este celular.</p>
          <div className="space-y-3">
            <Boton className="w-full" icono="add" onClick={() => navigate('/hijo/nuevo')}>
              Agregar el primer hijo
            </Boton>
            <Boton className="w-full" variante="suave" icono="science" onClick={cargarEjemplo}>
              Probar con datos de ejemplo
            </Boton>
            <Boton className="w-full" variante="suave" icono="download" onClick={() => navigate('/respaldo')}>
              Importar un respaldo
            </Boton>
          </div>
        </div>
      </Pagina>
    )

  return (
    <Pagina titulo="Mis pacientes">
      <InstalarApp />
      <ActivarRecordatorios />
      <DosisPendientes mostrarNombre />
      {proximas.length > 0 && (
        <div className="mb-4 space-y-2">
          {proximas.map(({ t, cuando }) => {
            const hijo = hijos.find((h) => h.id === t.hijoId)
            return (
              <button
                key={t.id}
                onClick={() => abrir(t.hijoId, '/tratamientos')}
                className="w-full flex items-center gap-3 bg-primary-container text-white rounded-xl px-3 py-2 text-left"
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

      <div className="space-y-3">
        {hijos.map((h) => (
          <button
            key={h.id}
            onClick={() => abrir(h.id)}
            className="w-full text-left bg-surface-container rounded-2xl p-3 shadow-soft active:shadow-none active:scale-[0.99] transition"
          >
            <div className="flex items-center gap-3 mb-2">
              <Avatar hijo={h} size="w-10 h-10" texto="text-base" />
              <div className="flex-1">
                <div className="font-display text-lg font-semibold leading-tight">{h.nombre}</div>
                <div className="text-on-surface-variant text-xs font-semibold">{edad(h.nacimiento)}</div>
              </div>
              {h.alergias.length > 0 && (
                <span className="flex items-center gap-1 text-xs font-semibold bg-error-container text-on-error-container rounded-full px-2.5 py-0.5">
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
          className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-outline-variant bg-surface-low py-2.5 text-primary font-semibold text-sm"
        >
          <Icon name="add" />
          Agregar un hijo
        </Link>
      </div>

      <h2 className="text-lg font-bold mt-5 mb-2">Registro rápido</h2>
      <div className="grid grid-cols-4 gap-2">
        {[
          { to: '/sintomas/nuevo', icono: 'thermostat', texto: 'Síntoma', tono: 'bg-tertiary-fixed text-tertiary' },
          { to: '/visitas/nueva', icono: 'stethoscope', texto: 'Visita', tono: 'bg-primary-fixed text-primary' },
          { to: '/tratamientos?rescate=1', icono: 'medication', texto: 'Rescate', tono: 'bg-secondary-container text-on-secondary-container' },
          { to: '/documento', icono: 'document_scanner', texto: 'Documento', tono: 'bg-primary-container text-white' },
        ].map((a) => (
          <Link key={a.to} to={a.to} className="bg-surface-lowest rounded-2xl shadow-soft py-2.5 px-1 flex flex-col items-center gap-1 font-semibold text-xs">
            <span className={`w-10 h-10 rounded-full flex items-center justify-center ${a.tono}`}>
              <Icon name={a.icono} />
            </span>
            {a.texto}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <Link to="/sintomas" className="bg-surface-lowest rounded-2xl shadow-soft px-3 py-2.5 flex items-center gap-2 font-semibold text-sm">
          <Icon name="history" className="text-primary" /> Historial de síntomas
        </Link>
        <Link to="/configuracion" className="bg-surface-lowest rounded-2xl shadow-soft px-3 py-2.5 flex items-center gap-2 font-semibold text-sm">
          <Icon name="settings" className="text-primary" /> Ajustes y respaldo
        </Link>
      </div>
    </Pagina>
  )
}
