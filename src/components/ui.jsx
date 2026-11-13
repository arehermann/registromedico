import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useStore } from '../data/store'

export function Icon({ name, fill = false, className = '' }) {
  return (
    <span className={`icon notranslate ${fill ? 'fill' : ''} ${className}`} translate="no" aria-hidden="true">
      {name}
    </span>
  )
}

export function Logo({ className = 'w-7 h-7' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="22" y="6" width="20" height="52" rx="8" fill="#4a90d6" />
      <rect x="6" y="22" width="52" height="20" rx="8" fill="#4a90d6" />
      <path d="M32 40l-6.5-6.4a4.2 4.2 0 016-6l.5.5.5-.5a4.2 4.2 0 016 6z" fill="#fcdc84" />
    </svg>
  )
}

export function Avatar({ hijo, size = 'w-12 h-12', texto = 'text-lg' }) {
  if (hijo?.foto) return <img src={hijo.foto} alt="" className={`${size} rounded-full object-cover`} />
  const tonos = ['bg-tertiary-fixed text-tertiary', 'bg-primary-fixed text-primary', 'bg-secondary-container text-on-secondary-container']
  const i = hijo ? hijo.nombre.charCodeAt(0) % tonos.length : 0
  return (
    <div className={`${size} ${texto} ${tonos[i]} rounded-full flex items-center justify-center font-display font-bold shrink-0`}>
      {hijo?.nombre?.[0] ?? '?'}
    </div>
  )
}

export function TopBar({ volver }) {
  const { hijos, hijoActivo, setHijoActivoId } = useStore()
  const [abierto, setAbierto] = useState(false)
  const navigate = useNavigate()
  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(74,144,226,0.08)] pt-safe">
      <div className="h-14 max-w-xl mx-auto px-4 flex items-center justify-between gap-3">
        {volver ? (
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary font-semibold -ml-2 p-2 rounded-full">
            <Icon name="arrow_back" /> Volver
          </button>
        ) : (
          <Link to="/" className="flex items-center gap-2">
            <Logo />
            <span className="font-display font-bold text-xl text-primary tracking-tight">FamLog</span>
          </Link>
        )}
        {hijoActivo && (
          <div className="relative">
            <button onClick={() => setAbierto((a) => !a)} className="flex items-center gap-1.5 rounded-full pl-1 pr-2.5 py-1 bg-surface-container" aria-label="Cambiar de hijo">
              <Avatar hijo={hijoActivo} size="w-7 h-7" texto="text-xs" />
              <span className="text-sm font-semibold max-w-24 truncate">{hijoActivo.nombre}</span>
              <Icon name="expand_more" className="text-on-surface-variant text-lg" />
            </button>
            {abierto && (
              <div className="absolute right-0 mt-2 w-56 bg-surface-lowest rounded-2xl shadow-soft p-2 border border-surface-high">
                {hijos.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => {
                      setHijoActivoId(h.id)
                      setAbierto(false)
                    }}
                    className={`w-full flex items-center gap-3 p-2 rounded-xl text-left ${h.id === hijoActivo.id ? 'bg-surface-container' : ''}`}
                  >
                    <Avatar hijo={h} size="w-9 h-9" texto="text-sm" />
                    <span className="font-semibold">{h.nombre}</span>
                    {h.id === hijoActivo.id && <Icon name="check" className="ml-auto text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

const pestanas = [
  { to: '/', icon: 'grid_view', texto: 'Inicio', end: true },
  { to: '/perfil', icon: 'medical_information', texto: 'Perfil' },
  { to: '/tratamientos', icon: 'prescriptions', texto: 'Tratamientos' },
  { to: '/visitas', icon: 'calendar_month', texto: 'Visitas' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-surface-lowest/95 backdrop-blur-xl border-t border-surface-high pb-safe">
      <div className="max-w-xl mx-auto grid grid-cols-4 gap-1 px-2 py-1">
        {pestanas.map((p) => (
          <NavLink
            key={p.to}
            to={p.to}
            end={p.end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 py-1 text-[11px] font-medium transition-colors ${
                isActive ? 'text-primary font-semibold' : 'text-on-surface-variant'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`px-4 py-0.5 rounded-full ${isActive ? 'bg-primary-fixed' : ''}`}>
                  <Icon name={p.icon} fill={isActive} className="text-[22px]" />
                </span>
                {p.texto}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export function Pagina({ titulo, subtitulo, volver = false, children, accion }) {
  return (
    <>
      <TopBar volver={volver} />
      <main className={`max-w-xl mx-auto px-4 pt-[4.5rem] ${accion ? 'pb-40' : 'pb-24'}`}>
        {titulo && (
          <div className="mb-4">
            <h1 className="text-2xl leading-8 font-bold">{titulo}</h1>
            {subtitulo && <p className="text-sm text-on-surface-variant">{subtitulo}</p>}
          </div>
        )}
        {children}
      </main>
      {accion}
      <BottomNav />
    </>
  )
}

export function Card({ children, className = '', ...props }) {
  return (
    <div className={`bg-surface-lowest rounded-2xl p-4 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function Seccion({ icono, titulo, accion, children, className = '' }) {
  return (
    <section className={`mb-5 ${className}`}>
      <div className="flex items-center justify-between mb-1.5 px-1 min-h-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-sans flex items-center gap-1.5">
          {icono && <Icon name={icono} className="text-base" />}
          {titulo}
        </h2>
        {accion}
      </div>
      {children}
    </section>
  )
}

export function Boton({ children, variante = 'primario', className = '', icono, ...props }) {
  const estilos = {
    primario: 'bg-primary text-white shadow-float active:shadow-none',
    secundario: 'bg-surface-container text-primary border-2 border-primary-fixed-dim',
    suave: 'bg-surface-container text-primary',
    peligro: 'bg-error-container text-on-error-container',
  }
  return (
    <button
      className={`min-h-12 rounded-full px-6 font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-50 disabled:pointer-events-none ${estilos[variante]} ${className}`}
      {...props}
    >
      {icono && <Icon name={icono} />}
      {children}
    </button>
  )
}

export function Fab({ icono = 'add', onClick, to, etiqueta }) {
  const clases =
    'fixed z-30 bottom-[5.5rem] right-4 w-14 h-14 rounded-2xl bg-primary text-white shadow-float flex items-center justify-center active:scale-95 transition'
  if (to)
    return (
      <Link to={to} className={clases} aria-label={etiqueta}>
        <Icon name={icono} className="text-2xl" />
      </Link>
    )
  return (
    <button onClick={onClick} className={clases} aria-label={etiqueta}>
      <Icon name={icono} className="text-2xl" />
    </button>
  )
}

export function Campo({ etiqueta, icono, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-sm font-semibold mb-1.5">{etiqueta}</span>
      <div className="relative">
        {icono && <Icon name={icono} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />}
        {children}
      </div>
    </label>
  )
}

export function Chip({ activo, children, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-9 px-3.5 rounded-full text-sm font-semibold whitespace-nowrap transition ${
        activo ? 'bg-primary text-white' : 'bg-surface-lowest text-on-surface-variant'
      } ${className}`}
    >
      {children}
    </button>
  )
}

export function Interruptor({ activo, onChange, etiqueta, detalle, className = '' }) {
  return (
    <label className={`flex items-center justify-between gap-3 min-h-11 cursor-pointer ${className}`}>
      <span className="min-w-0">
        <span className="block font-medium">{etiqueta}</span>
        {detalle && <span className="block text-xs text-on-surface-variant">{detalle}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={activo}
        onClick={() => onChange(!activo)}
        className={`w-12 h-7 rounded-full relative transition-colors shrink-0 ${activo ? 'bg-primary' : 'bg-outline-variant'}`}
      >
        <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${activo ? 'left-6' : 'left-1'}`} />
      </button>
    </label>
  )
}

const puntoEstado = {
  activo: 'bg-secondary',
  por_vencer: 'bg-tertiary-fixed-dim',
  vencido: 'bg-error',
  pendiente: 'bg-primary-fixed-dim',
  finalizado: 'bg-outline-variant',
}

// Estado en texto con un punto de color: sin pastillas de fondo, para no recargar
export function EtiquetaEstado({ estado }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-on-surface-variant whitespace-nowrap shrink-0">
      <span className={`w-2 h-2 rounded-full ${puntoEstado[estado.clave]}`} />
      {estado.texto}
    </span>
  )
}

// Lista plana con separadores: el bloque básico de las pantallas
export function Lista({ children, className = '' }) {
  return <div className={`bg-surface-lowest rounded-2xl divide-y divide-surface-high overflow-hidden ${className}`}>{children}</div>
}

export function Fila({ titulo, detalle, izquierda, derecha, onClick, to, className = '' }) {
  const contenido = (
    <>
      {izquierda}
      <div className="flex-1 min-w-0">
        <div className="font-medium leading-snug">{titulo}</div>
        {detalle && <div className="text-sm text-on-surface-variant leading-snug">{detalle}</div>}
      </div>
      {derecha}
    </>
  )
  const clases = `w-full flex items-center gap-3 px-4 py-3 text-left min-h-12 ${className}`
  if (to)
    return (
      <Link to={to} className={clases}>
        {contenido}
      </Link>
    )
  if (onClick)
    return (
      <button type="button" onClick={onClick} className={clases}>
        {contenido}
      </button>
    )
  return <div className={clases}>{contenido}</div>
}

export function Aviso({ children }) {
  return (
    <div className="fixed bottom-24 inset-x-4 z-50 max-w-md mx-auto bg-inverse-surface bg-[#23323f] text-white rounded-2xl px-5 py-4 shadow-float flex items-center gap-3">
      <Icon name="check_circle" className="text-secondary-container" fill />
      {children}
    </div>
  )
}

export function useAviso() {
  const [texto, setTexto] = useState(null)
  const mostrar = (t) => {
    setTexto(t)
    setTimeout(() => setTexto(null), 2200)
  }
  return [texto ? <Aviso>{texto}</Aviso> : null, mostrar]
}

export function Vacio({ icono, titulo, texto, children }) {
  return (
    <div className="text-center py-6 px-6">
      <div className="w-14 h-14 mx-auto rounded-full bg-surface-container flex items-center justify-center mb-3">
        <Icon name={icono} className="text-3xl text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{titulo}</h3>
      {texto && <p className="text-on-surface-variant mb-4">{texto}</p>}
      {children}
    </div>
  )
}
