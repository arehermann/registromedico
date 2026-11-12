import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as ejemplo from './ejemplo'
import { COLECCIONES, guardar, guardarAjuste, guardarVarios, leerTodo, pedirPersistencia } from './db'
import { fusionar } from './respaldo'

const StoreContext = createContext(null)

const nuevoId = (prefijo) => `${prefijo}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
const ahora = () => new Date().toISOString()
const vacio = () => Object.fromEntries(COLECCIONES.map((c) => [c, []]))

export function StoreProvider({ children }) {
  const [datos, setDatos] = useState(vacio)
  const [proveedores, setProveedores] = useState(ejemplo.PROVEEDORES)
  const [hijoActivoId, setHijoActivoIdEstado] = useState(null)
  const [cargado, setCargado] = useState(false)

  useEffect(() => {
    leerTodo().then((d) => {
      setDatos(Object.fromEntries(COLECCIONES.map((c) => [c, d[c]])))
      if (d.ajustes.proveedores) setProveedores(d.ajustes.proveedores)
      setHijoActivoIdEstado(d.ajustes.hijoActivoId ?? null)
      setCargado(true)
    })
    pedirPersistencia()
  }, [])

  // Escribe en memoria y en IndexedDB a la vez
  const escribir = useCallback((coleccion, registro) => {
    setDatos((d) => {
      const lista = d[coleccion]
      const i = lista.findIndex((r) => r.id === registro.id)
      return { ...d, [coleccion]: i === -1 ? [registro, ...lista] : lista.with(i, registro) }
    })
    guardar(coleccion, registro)
    return registro
  }, [])

  const setHijoActivoId = useCallback((id) => {
    setHijoActivoIdEstado(id)
    guardarAjuste('hijoActivoId', id)
  }, [])

  const valor = useMemo(() => {
    const vivos = (c) => datos[c].filter((r) => !r.borrado)
    const hijos = vivos('hijos').sort((a, b) => (a.creado ?? '').localeCompare(b.creado ?? ''))
    const idsHijos = new Set(hijos.map((h) => h.id))
    const deHijosVivos = (c) => vivos(c).filter((r) => idsHijos.has(r.hijoId))
    const hijoActivo = hijos.find((h) => h.id === hijoActivoId) ?? hijos[0] ?? null

    const crear = (c, prefijo, campos) => escribir(c, { id: nuevoId(prefijo), creado: ahora(), ...campos, modificado: ahora() })
    const actualizar = (c, id, cambios) => {
      const actual = datos[c].find((r) => r.id === id)
      if (actual) escribir(c, { ...actual, ...cambios, modificado: ahora() })
    }
    // Borrado "lógico": queda una marca para que la fusión de respaldos lo respete
    const borrar = (c, id) => {
      const actual = datos[c].find((r) => r.id === id)
      if (actual) escribir(c, { id, hijoId: actual.hijoId, borrado: true, modificado: ahora() })
    }

    const eliminarHijo = (id) => {
      borrar('hijos', id)
      for (const c of ['tratamientos', 'visitas', 'sintomas', 'rescates']) datos[c].filter((r) => r.hijoId === id && !r.borrado).forEach((r) => borrar(c, r.id))
    }

    return {
      cargado,
      datos,
      hijos,
      tratamientos: deHijosVivos('tratamientos'),
      visitas: deHijosVivos('visitas'),
      sintomas: deHijosVivos('sintomas'),
      rescates: deHijosVivos('rescates'),
      tomas: vivos('tomas'),
      proveedores,
      hijoActivo,
      setHijoActivoId,

      agregarHijo(campos) {
        const hijo = crear('hijos', 'h', { alergias: [], condiciones: [], ...campos })
        setHijoActivoId(hijo.id)
        return hijo
      },
      actualizarHijo: (id, cambios) => actualizar('hijos', id, cambios),
      eliminarHijo,
      agregarVisita: (campos) => crear('visitas', 'v', campos),
      eliminarVisita: (id) => borrar('visitas', id),
      agregarTratamiento: (campos) => crear('tratamientos', 't', campos),
      actualizarTratamiento: (id, cambios) => actualizar('tratamientos', id, cambios),
      eliminarTratamiento: (id) => borrar('tratamientos', id),
      agregarSintoma: (campos) => crear('sintomas', 's', campos),
      eliminarSintoma: (id) => borrar('sintomas', id),
      agregarRescate: (campos) => crear('rescates', 'r', campos),
      registrarToma: (tratamientoId, turno) => crear('tomas', 'm', { tratamientoId, turno, fecha: ahora() }),
      agregarProveedor(nombre) {
        const lista = [...proveedores.filter((p) => p !== 'Otro' && p !== nombre), nombre, 'Otro']
        setProveedores(lista)
        guardarAjuste('proveedores', lista)
      },

      // Importa un respaldo del otro padre: gana el dato modificado más recientemente
      async importar(respaldo) {
        let total = 0
        const nuevos = { ...datos }
        for (const c of COLECCIONES) {
          const cambios = fusionar(datos[c], respaldo[c])
          if (!cambios.length) continue
          total += cambios.length
          await guardarVarios(c, cambios)
          const porId = new Map(datos[c].map((r) => [r.id, r]))
          cambios.forEach((r) => porId.set(r.id, r))
          nuevos[c] = [...porId.values()]
        }
        setDatos(nuevos)
        if (Array.isArray(respaldo.proveedores)) {
          const union = [...new Set([...proveedores.filter((p) => p !== 'Otro'), ...respaldo.proveedores.filter((p) => p !== 'Otro')]), 'Otro']
          setProveedores(union)
          guardarAjuste('proveedores', union)
        }
        return total
      },

      async cargarEjemplo() {
        const marca = ahora()
        const fijar = (lista) => lista.map((r) => ({ ...r, creado: marca, modificado: marca, ejemplo: true }))
        const conjuntos = {
          hijos: fijar(ejemplo.hijos),
          tratamientos: fijar(ejemplo.tratamientos),
          visitas: fijar(ejemplo.visitas),
          sintomas: fijar(ejemplo.sintomas),
          rescates: fijar(ejemplo.rescates),
        }
        for (const [c, lista] of Object.entries(conjuntos)) await guardarVarios(c, lista)
        setDatos((d) => {
          const n = { ...d }
          for (const [c, lista] of Object.entries(conjuntos)) n[c] = [...lista, ...d[c].filter((r) => !lista.some((x) => x.id === r.id))]
          return n
        })
      },
      hayEjemplo: hijos.some((h) => h.ejemplo),
      eliminarEjemplo() {
        hijos.filter((h) => h.ejemplo).forEach((h) => eliminarHijo(h.id))
      },
    }
  }, [datos, proveedores, hijoActivoId, cargado, escribir, setHijoActivoId])

  return <StoreContext.Provider value={valor}>{children}</StoreContext.Provider>
}

export function useStore() {
  return useContext(StoreContext)
}
