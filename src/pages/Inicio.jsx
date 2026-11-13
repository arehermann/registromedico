import { Link, useNavigate } from 'react-router-dom'
import { Avatar, Boton, Fila, Icon, Lista, Pagina } from '../components/ui'
import { ActivarRecordatorios, DosisPendientes, InstalarApp } from '../components/avisos'
import { useStore } from '../data/store'
import { edad } from '../data/fechas'

export default function Inicio() {
  const { hijos, setHijoActivoId, cargarEjemplo } = useStore()
  const navigate = useNavigate()

  const abrir = (id, ruta = '/perfil') => {
    setHijoActivoId(id)
    navigate(ruta)
  }

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
    <Pagina titulo="Mis hijos">
      <InstalarApp />
      <ActivarRecordatorios />
      <DosisPendientes mostrarNombre />

      <Lista className="mb-6">
        {hijos.map((h) => (
          <Fila
            key={h.id}
            onClick={() => abrir(h.id)}
            izquierda={<Avatar hijo={h} size="w-10 h-10" texto="text-base" />}
            titulo={
              <span className="flex items-center gap-1.5">
                {h.nombre}
                {h.alergias.length > 0 && <Icon name="warning" className="text-base text-error" />}
              </span>
            }
            detalle={[edad(h.nacimiento), h.peso && `${h.peso} kg`, h.grupoSanguineo].filter(Boolean).join(' · ')}
            derecha={<Icon name="chevron_right" className="text-on-surface-variant" />}
          />
        ))}
        <Fila to="/hijo/nuevo" className="text-primary" izquierda={<Icon name="add" className="w-10 text-center" />} titulo="Agregar un hijo" />
      </Lista>

      <div className="grid grid-cols-4 gap-2 mb-6">
        {[
          { to: '/sintomas/nuevo', icono: 'thermostat', texto: 'Síntoma' },
          { to: '/visitas/nueva', icono: 'stethoscope', texto: 'Visita' },
          { to: '/tratamientos?rescate=1', icono: 'medication', texto: 'Rescate' },
          { to: '/documento', icono: 'document_scanner', texto: 'Documento' },
        ].map((a) => (
          <Link key={a.to} to={a.to} className="flex flex-col items-center gap-1 text-xs font-medium text-on-surface-variant py-1">
            <span className="w-12 h-12 rounded-full bg-surface-lowest text-primary flex items-center justify-center">
              <Icon name={a.icono} />
            </span>
            {a.texto}
          </Link>
        ))}
      </div>

      <Lista>
        <Fila to="/sintomas" titulo="Historial de síntomas" derecha={<Icon name="chevron_right" className="text-on-surface-variant" />} />
        <Fila to="/configuracion" titulo="Ajustes y respaldo" derecha={<Icon name="chevron_right" className="text-on-surface-variant" />} />
      </Lista>
    </Pagina>
  )
}
