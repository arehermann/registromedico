import { openDB } from 'idb'

// Todo se guarda en el celular (IndexedDB). Cada registro lleva `modificado` para poder fusionar
// respaldos entre padres, y los borrados quedan marcados con `borrado: true` para que un respaldo
// viejo no los "reviva" al importarlo.

export const COLECCIONES = ['hijos', 'tratamientos', 'visitas', 'sintomas', 'rescates', 'tomas']

const dbPromesa = openDB('kindred-care', 1, {
  upgrade(db) {
    for (const c of COLECCIONES) db.createObjectStore(c, { keyPath: 'id' })
    db.createObjectStore('ajustes')
  },
})

export async function leerTodo() {
  const db = await dbPromesa
  const datos = {}
  for (const c of COLECCIONES) datos[c] = await db.getAll(c)
  datos.ajustes = {
    proveedores: await db.get('ajustes', 'proveedores'),
    hijoActivoId: await db.get('ajustes', 'hijoActivoId'),
  }
  return datos
}

export async function guardar(coleccion, registro) {
  const db = await dbPromesa
  await db.put(coleccion, registro)
}

export async function guardarVarios(coleccion, registros) {
  const db = await dbPromesa
  const tx = db.transaction(coleccion, 'readwrite')
  await Promise.all([...registros.map((r) => tx.store.put(r)), tx.done])
}

export async function guardarAjuste(clave, valor) {
  const db = await dbPromesa
  await db.put('ajustes', valor, clave)
}

// Pide al navegador que no borre los datos cuando le falte espacio
export async function pedirPersistencia() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist()
  } catch {
    /* no disponible: los datos igual quedan guardados */
  }
}
