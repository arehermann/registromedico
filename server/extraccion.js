// Qué datos se le piden a Claude y cómo. El esquema obliga a que la respuesta sea JSON válido
// con estos campos; lo que no figure en el documento vuelve como null o lista vacía.

const texto = (descripcion) => ({ type: ['string', 'null'], description: descripcion })
const entero = (descripcion) => ({ type: ['integer', 'null'], description: descripcion })
const lista = (descripcion) => ({ type: 'array', items: { type: 'string' }, description: descripcion })
const objeto = (properties) => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false })

export const ESQUEMA = objeto({
  tipoDocumento: { type: 'string', description: 'Qué es: receta, informe de consulta, alta de emergencia, resultado de análisis, carné de vacunas, otro' },
  resumen: { type: 'string', description: 'Una o dos frases simples sobre lo que dice el documento' },
  paciente: objeto({
    nombre: texto('Nombre del paciente tal como figura'),
    fechaNacimiento: texto('AAAA-MM-DD'),
  }),
  visita: objeto({
    fecha: texto('Fecha de la consulta, AAAA-MM-DD'),
    motivo: texto('"Control" si es un control de salud o de seguimiento; "Consulta" en cualquier otro caso'),
    lugar: texto('Institución o servicio donde se atendió'),
    medico: texto('Nombre del médico, con Dr. o Dra. si figura'),
    especialidad: texto('Especialidad del médico, por ejemplo Pediatra'),
    diagnostico: texto('Diagnóstico principal en lenguaje claro'),
    procedimientos: lista('Estudios o procedimientos que se hicieron en la consulta'),
    proximoControl: texto('Cuándo y con quién es el próximo control, como nota breve'),
  }),
  tratamientos: {
    type: 'array',
    description: 'Medicamentos indicados',
    items: objeto({
      medicamento: { type: 'string', description: 'Nombre del medicamento, con la concentración si figura' },
      dosis: texto('Cantidad por toma, por ejemplo "5 ml" o "1 comprimido"'),
      cadaHoras: entero('Horas entre tomas. "3 veces al día" son 8; "cada 12 h" son 12'),
      duracionDias: entero('Días de tratamiento; null si es crónico o no lo dice'),
      indicaciones: texto('Otras indicaciones, por ejemplo "con las comidas"'),
    }),
  },
  medidas: objeto({
    pesoKg: { type: ['number', 'null'], description: 'Peso en kilos' },
    alturaCm: { type: ['number', 'null'], description: 'Talla en centímetros' },
  }),
  alergias: lista('Alergias mencionadas'),
  advertencias: lista('Partes ilegibles o dudosas que la familia debería revisar, en frases cortas'),
})

export function instrucciones({ hijo, lugares, hoy }) {
  return `Ayudás a una familia de Uruguay a pasar documentos médicos de sus hijos (recetas, informes, altas, análisis) a su app FamLog.
Leé el documento adjunto (puede ser un PDF, una foto o varias fotos de las páginas) y completá los campos.

Reglas:
- Copiá solo lo que dice el documento. No inventes ni deduzcas datos que no estén escritos; si algo no figura, devolvé null o una lista vacía.
- Si un dato es difícil de leer, poné tu mejor lectura y agregá una advertencia corta en "advertencias".
- Fechas en formato AAAA-MM-DD. Las fechas escritas como 05/03/26 son día/mes/año.
- Escribí en español rioplatense claro, sin abreviaturas médicas difíciles cuando haya una palabra común.
${lugares?.length ? `- Si el lugar de atención coincide con uno de estos, usá exactamente ese nombre: ${lugares.join(', ')}.` : ''}
${hijo?.nombre ? `- El documento debería ser de ${hijo.nombre}${hijo.nacimiento ? ` (nació el ${hijo.nacimiento})` : ''}. Si el paciente parece otra persona, avisalo en "advertencias".` : ''}
${hoy ? `- Hoy es ${hoy}.` : ''}`
}
