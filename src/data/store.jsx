import { createContext, useContext, useMemo, useState } from 'react'
import * as ejemplo from './ejemplo'

// Estado en memoria para el prototipo: los cambios se pierden al recargar.
// En el paso 2 esto pasa a guardado local real (IndexedDB) con fecha de modificación por registro.

const StoreContext = createContext(null)

const nuevoId = (prefijo) => `${prefijo}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export function StoreProvider({ children }) {
  const [hijos, setHijos] = useState(ejemplo.hijos)
  const [tratamientos, setTratamientos] = useState(ejemplo.tratamientos)
  const [visitas, setVisitas] = useState(ejemplo.visitas)
  const [sintomas, setSintomas] = useState(ejemplo.sintomas)
  const [rescates, setRescates] = useState(ejemplo.rescates)
  const [proveedores, setProveedores] = useState(ejemplo.PROVEEDORES)
  const [hijoActivoId, setHijoActivoId] = useState(ejemplo.hijos[0].id)

  const valor = useMemo(() => {
    const hijoActivo = hijos.find((h) => h.id === hijoActivoId) ?? hijos[0]
    return {
      hijos,
      tratamientos,
      visitas,
      sintomas,
      rescates,
      proveedores,
      hijoActivo,
      setHijoActivoId,

      agregarHijo(datos) {
        const hijo = { id: nuevoId('h'), alergias: [], condiciones: [], ...datos }
        setHijos((l) => [...l, hijo])
        setHijoActivoId(hijo.id)
        return hijo
      },
      actualizarHijo(id, cambios) {
        setHijos((l) => l.map((h) => (h.id === id ? { ...h, ...cambios } : h)))
      },
      eliminarHijo(id) {
        setHijos((l) => l.filter((h) => h.id !== id))
      },
      agregarVisita(datos) {
        setVisitas((l) => [{ id: nuevoId('v'), ...datos }, ...l])
      },
      agregarTratamiento(datos) {
        setTratamientos((l) => [{ id: nuevoId('t'), ...datos }, ...l])
      },
      actualizarTratamiento(id, cambios) {
        setTratamientos((l) => l.map((t) => (t.id === id ? { ...t, ...cambios } : t)))
      },
      agregarSintoma(datos) {
        setSintomas((l) => [{ id: nuevoId('s'), ...datos }, ...l])
      },
      agregarRescate(datos) {
        setRescates((l) => [{ id: nuevoId('r'), ...datos }, ...l])
      },
      agregarProveedor(nombre) {
        setProveedores((l) => [...l.filter((p) => p !== 'Otro'), nombre, 'Otro'])
      },
    }
  }, [hijos, tratamientos, visitas, sintomas, rescates, proveedores, hijoActivoId])

  return <StoreContext.Provider value={valor}>{children}</StoreContext.Provider>
}

export function useStore() {
  return useContext(StoreContext)
}
