import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { StoreProvider, useStore } from './data/store'
import Inicio from './pages/Inicio'
import NuevoHijo from './pages/NuevoHijo'
import Perfil from './pages/Perfil'
import Tratamientos from './pages/Tratamientos'
import NuevoTratamiento from './pages/NuevoTratamiento'
import Visitas from './pages/Visitas'
import NuevaVisita from './pages/NuevaVisita'
import Sintomas from './pages/Sintomas'
import NuevoSintoma from './pages/NuevoSintoma'
import Respaldo from './pages/Respaldo'
import Configuracion from './pages/Configuracion'

function ScrollArriba() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
  return null
}

// Las pantallas de un hijo necesitan que exista al menos uno
function ConHijo({ children }) {
  const { hijoActivo } = useStore()
  return hijoActivo ? children : <Navigate to="/" replace />
}

// HashRouter: las rutas funcionan en GitHub Pages sin configurar el servidor
export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <ScrollArriba />
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/hijo/nuevo" element={<NuevoHijo />} />
          <Route path="/perfil" element={<ConHijo><Perfil /></ConHijo>} />
          <Route path="/tratamientos" element={<ConHijo><Tratamientos /></ConHijo>} />
          <Route path="/tratamientos/nuevo" element={<ConHijo><NuevoTratamiento /></ConHijo>} />
          <Route path="/visitas" element={<ConHijo><Visitas /></ConHijo>} />
          <Route path="/visitas/nueva" element={<ConHijo><NuevaVisita /></ConHijo>} />
          <Route path="/sintomas" element={<Sintomas />} />
          <Route path="/sintomas/nuevo" element={<ConHijo><NuevoSintoma /></ConHijo>} />
          <Route path="/respaldo" element={<Respaldo />} />
          <Route path="/configuracion" element={<Configuracion />} />
        </Routes>
      </HashRouter>
    </StoreProvider>
  )
}
