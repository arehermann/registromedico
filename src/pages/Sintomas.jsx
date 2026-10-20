import { Link } from 'react-router-dom'
import { Avatar, Fab, Icon, Pagina, Vacio } from '../components/ui'
import { useStore } from '../data/store'
import { haceCuanto } from '../data/fechas'

const ICONOS = { Fiebre: 'thermostat', Tos: 'sentiment_dissatisfied', Mocos: 'humidity_high', Vómito: 'sick', Diarrea: 'gastroenterology', Dolor: 'healing', Sarpullido: 'water_drop', Otro: 'help' }

export default function Sintomas() {
  const { hijos, sintomas } = useStore()
  const ordenados = [...sintomas].sort((a, b) => b.fecha.localeCompare(a.fecha))
  // El síntoma más reciente de las últimas 6 horas se destaca arriba
  const activo = ordenados.find((s) => Date.now() - new Date(s.fecha).getTime() < 6 * 3600_000)
  const hijoActivo = activo && hijos.find((h) => h.id === activo.hijoId)

  return (
    <Pagina titulo="Historial de síntomas" subtitulo="Lo que fuiste observando, por hijo." volver accion={<Fab to="/sintomas/nuevo" etiqueta="Registrar síntoma" />}>
      {activo && (
        <div className="relative overflow-hidden rounded-3xl bg-primary-container text-white p-5 mb-8 shadow-float">
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full border-[24px] border-white/10" />
          <div className="flex items-center gap-3 mb-3">
            <span className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
              <Icon name={ICONOS[activo.etiqueta] ?? 'help'} />
            </span>
            <div className="flex-1">
              <div className="font-semibold">{hijoActivo?.nombre}</div>
              <div className="text-sm opacity-90">{haceCuanto(activo.fecha)}</div>
            </div>
            <span className="bg-error text-white text-xs font-bold rounded-full px-3 py-1">{activo.etiqueta}</span>
          </div>
          {activo.temperatura && <div className="font-display text-4xl font-bold mb-1">{activo.temperatura.toString().replace('.', ',')} °C</div>}
          <p className="opacity-95">{activo.descripcion}</p>
          <Link to="/sintomas/nuevo" className="mt-4 flex items-center justify-center gap-2 min-h-12 rounded-full bg-white text-primary font-semibold">
            <Icon name="add_task" /> Actualizar
          </Link>
        </div>
      )}

      {ordenados.length === 0 && <Vacio icono="thermostat" titulo="Sin síntomas anotados" texto="Cuando algo te llame la atención, anotalo con el botón +." />}

      {hijos.map((h) => {
        const propios = ordenados.filter((s) => s.hijoId === h.id && s !== activo)
        if (!propios.length) return null
        return (
          <section key={h.id} className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <Avatar hijo={h} size="w-10 h-10" texto="text-base" />
              <h2 className="font-display text-xl font-semibold">{h.nombre}</h2>
            </div>
            <div className="space-y-3">
              {propios.map((s) => (
                <div key={s.id} className="bg-surface-container rounded-3xl p-5">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-sm text-on-surface-variant">{haceCuanto(s.fecha)}</span>
                    <span className="flex items-center gap-1 bg-surface-lowest rounded-full px-3 py-1 text-sm font-medium">
                      <Icon name={ICONOS[s.etiqueta] ?? 'help'} className="text-base text-tertiary" /> {s.etiqueta}
                    </span>
                  </div>
                  <p>{s.descripcion}</p>
                  {s.medicacion && (
                    <p className="text-sm text-on-surface-variant mt-2 flex items-center gap-1">
                      <Icon name="medication" className="text-base" /> {s.medicacion.medicamento} {s.medicacion.dosis}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </Pagina>
  )
}
