import { useEffect, useState } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { StoreProvider, useStore } from './data/store'
import Inicio from './pages/Inicio'
import NuevoHijo from './pages/NuevoHijo'
import Perfil from './pages/Perfil'
import Tratamientos from './pages/Tratamientos'
import NuevoTratamiento from './pages/NuevoTratamiento'
import Visitas from './pages/Visitas'
import NuevaVisita from './pages/NuevaVisita'
import LeerDocumento from './pages/LeerDocumento'
import Sintomas from './pages/Sintomas'
import NuevoSintoma from './pages/NuevoSintoma'
import Respaldo from './pages/Respaldo'
import Configuracion from './pages/Configuracion'
import Recordatorios from './components/Recordatorios'
import ErrorPantalla from './components/ErrorPantalla'
import { Logo } from './components/ui'

function ScrollArriba() {
  const { pathname } = useLocation()
  // Con llaves: en Chrome nuevo scrollTo devuelve una promesa, y React la trataría como función de limpieza
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

// Las pantallas de un hijo necesitan que exista al menos uno
function ConHijo({ children }) {
  const { hijoActivo } = useStore()
  return hijoActivo ? children : <Navigate to="/" replace />
}

// Mientras se leen los datos guardados (es casi instantáneo) se muestra el logo.
// Si tarda, se explica qué pasa en vez de dejar la pantalla vacía.
function Cargando({ children }) {
  const { cargado, errorCarga } = useStore()
  const [lento, setLento] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setLento(true), 3000)
    return () => clearTimeout(id)
  }, [])
  if (cargado) return children
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-8 text-center">
      <Logo className="w-16 h-16 animate-pulse" />
      {(lento || errorCarga) && (
        <>
          <p className="text-on-surface-variant">
            {errorCarga ? `No se pudieron leer los datos guardados (${errorCarga}).` : 'Está tardando en abrir los datos guardados. Si tenés la app abierta en otra pestaña, cerrala.'}
          </p>
          <button onClick={() => location.reload()} className="min-h-12 px-6 rounded-full bg-primary text-white font-semibold">
            Volver a cargar
          </button>
        </>
      )}
    </div>
  )
}

// HashRouter: las rutas funcionan en GitHub Pages sin configurar el servidor
export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <ScrollArriba />
        <ErrorPantalla>
          <Recordatorios />
          <Cargando>
            <Routes>
              <Route path="/" element={<Inicio />} />
              <Route path="/hijo/nuevo" element={<NuevoHijo />} />
              <Route
                path="/hijo/editar"
                element={
                  <ConHijo>
                    <NuevoHijo editar />
                  </ConHijo>
                }
              />
              <Route
                path="/perfil"
                element={
                  <ConHijo>
                    <Perfil />
                  </ConHijo>
                }
              />
              <Route
                path="/tratamientos"
                element={
                  <ConHijo>
                    <Tratamientos />
                  </ConHijo>
                }
              />
              <Route
                path="/tratamientos/nuevo"
                element={
                  <ConHijo>
                    <NuevoTratamiento />
                  </ConHijo>
                }
              />
              <Route
                path="/visitas"
                element={
                  <ConHijo>
                    <Visitas />
                  </ConHijo>
                }
              />
              <Route
                path="/documento"
                element={
                  <ConHijo>
                    <LeerDocumento />
                  </ConHijo>
                }
              />
              <Route
                path="/visitas/nueva"
                element={
                  <ConHijo>
                    <NuevaVisita />
                  </ConHijo>
                }
              />
              <Route path="/sintomas" element={<Sintomas />} />
              <Route
                path="/sintomas/nuevo"
                element={
                  <ConHijo>
                    <NuevoSintoma />
                  </ConHijo>
                }
              />
              <Route path="/respaldo" element={<Respaldo />} />
              <Route path="/configuracion" element={<Configuracion />} />
            </Routes>
          </Cargando>
        </ErrorPantalla>
      </HashRouter>
    </StoreProvider>
  )
}
