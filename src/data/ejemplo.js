// Datos de ejemplo para el prototipo. En el paso 2 se reemplazan por guardado local real.

const hoy = new Date()
const haceHoras = (h) => new Date(hoy.getTime() - h * 3600_000).toISOString()
const haceDias = (d) => {
  const f = new Date(hoy)
  f.setDate(f.getDate() - d)
  return f.toISOString().slice(0, 10)
}

export const PROVEEDORES = [
  'CASMU',
  'Emergencia CASMU',
  '1727',
  'Suat',
  'Anda',
  'Médico a domicilio',
  'Otro',
]

export const ESPECIALIDADES = ['Pediatra', 'Otorrino', 'Dermatólogo', 'Neumólogo', 'Oftalmólogo', 'Traumatólogo']

export const hijos = [
  {
    id: 'h1',
    nombre: 'Martina',
    nacimiento: '2018-04-12',
    peso: 24.5,
    altura: 122,
    grupoSanguineo: 'A+',
    cedula: '5.432.118-3',
    alergias: ['Penicilina', 'Ácaros'],
    condiciones: [{ nombre: 'Asma infantil', tipo: 'Crónica', estado: 'Controlada', desde: '2022' }],
    prematuro: false,
    vacunasAlDia: true,
  },
  {
    id: 'h2',
    nombre: 'Tomás',
    nacimiento: '2021-09-03',
    peso: 15.2,
    altura: 98,
    grupoSanguineo: 'O+',
    cedula: '6.019.774-1',
    alergias: ['Proteína de huevo'],
    condiciones: [],
    prematuro: true,
    vacunasAlDia: true,
  },
]

export const tratamientos = [
  {
    id: 't1',
    hijoId: 'h1',
    medicamento: 'Amoxicilina + ácido clavulánico',
    dosis: '5 ml',
    cadaHoras: 12,
    duracionDias: 7,
    inicio: haceHoras(24 * 5 + 3),
    tipo: 'temporal',
    notificaciones: true,
    estado: 'en_curso',
  },
  {
    id: 't2',
    hijoId: 'h1',
    medicamento: 'Salbutamol inhalador',
    dosis: '2 puffs',
    cadaHoras: null,
    duracionDias: null,
    inicio: haceHoras(24 * 120),
    tipo: 'cronico',
    notificaciones: false,
    estado: 'en_curso',
  },
  {
    id: 't3',
    hijoId: 'h1',
    medicamento: 'Ibuprofeno',
    dosis: '7,5 ml',
    cadaHoras: 8,
    duracionDias: 3,
    inicio: null,
    tipo: 'temporal',
    notificaciones: true,
    estado: 'pendiente',
  },
  {
    id: 't4',
    hijoId: 'h2',
    medicamento: 'Vitamina D (gotas)',
    dosis: '4 gotas',
    cadaHoras: 24,
    duracionDias: null,
    inicio: haceHoras(24 * 60),
    tipo: 'cronico',
    notificaciones: true,
    estado: 'en_curso',
  },
  {
    id: 't5',
    hijoId: 'h2',
    medicamento: 'Cetirizina',
    dosis: '2,5 ml',
    cadaHoras: 24,
    duracionDias: 5,
    inicio: haceHoras(24 * 30),
    tipo: 'temporal',
    notificaciones: true,
    estado: 'finalizado',
  },
]

export const rescates = [
  { id: 'r1', hijoId: 'h1', medicamento: 'Salbutamol', dosis: '2 puffs', fecha: haceHoras(30) },
  { id: 'r2', hijoId: 'h2', medicamento: 'Paracetamol', dosis: '5 ml', fecha: haceHoras(24 * 9) },
]

export const visitas = [
  {
    id: 'v1',
    hijoId: 'h1',
    fecha: haceDias(5),
    lugar: 'Emergencia CASMU',
    medico: 'Dra. Laura Pérez',
    especialidad: 'Pediatra',
    motivo: 'Consulta',
    diagnostico: 'Otitis media aguda derecha',
    procedimientos: ['Otoscopía'],
    proximoControl: 'Control en 10 días con pediatra',
  },
  {
    id: 'v2',
    hijoId: 'h1',
    fecha: haceDias(48),
    lugar: 'CASMU',
    medico: 'Dr. Martín Silva',
    especialidad: 'Neumólogo',
    motivo: 'Control',
    diagnostico: 'Asma leve persistente, controlada',
    procedimientos: ['Espirometría'],
    proximoControl: 'Control en 6 meses',
  },
  {
    id: 'v3',
    hijoId: 'h1',
    fecha: haceDias(130),
    lugar: '1727',
    medico: 'Dr. Andrés Gómez',
    especialidad: 'Pediatra',
    motivo: 'Consulta',
    diagnostico: 'Broncoespasmo',
    procedimientos: ['Nebulizaciones', 'Placa de tórax'],
    proximoControl: '',
  },
  {
    id: 'v4',
    hijoId: 'h2',
    fecha: haceDias(9),
    lugar: 'Médico a domicilio',
    medico: 'Dra. Sofía Rodríguez',
    especialidad: 'Pediatra',
    motivo: 'Consulta',
    diagnostico: 'Faringitis viral',
    procedimientos: [],
    proximoControl: '',
  },
  {
    id: 'v5',
    hijoId: 'h2',
    fecha: haceDias(75),
    lugar: 'CASMU',
    medico: 'Dra. Laura Pérez',
    especialidad: 'Pediatra',
    motivo: 'Control',
    diagnostico: 'Control de 4 años, desarrollo normal',
    procedimientos: ['Vacuna antigripal'],
    proximoControl: 'Control de 5 años',
  },
]

export const sintomas = [
  {
    id: 's1',
    hijoId: 'h2',
    fecha: haceHoras(0.3),
    etiqueta: 'Fiebre',
    temperatura: 38.6,
    descripcion: 'Se despertó caliente y molesto. Le di paracetamol, revisar en una hora.',
    medicacion: { medicamento: 'Paracetamol', dosis: '5 ml' },
  },
  {
    id: 's2',
    hijoId: 'h1',
    fecha: haceHoras(20),
    etiqueta: 'Tos',
    descripcion: 'Tos seca antes de dormir. Usó el inhalador y se calmó.',
    medicacion: { medicamento: 'Salbutamol', dosis: '2 puffs' },
  },
  {
    id: 's3',
    hijoId: 'h1',
    fecha: haceHoras(24 * 6),
    etiqueta: 'Sarpullido',
    descripcion: 'Manchitas rojas en la panza, no le pican. Crema hidratante.',
    medicacion: null,
  },
  {
    id: 's4',
    hijoId: 'h2',
    fecha: haceHoras(24 * 3 + 5),
    etiqueta: 'Vómito',
    descripcion: 'Devolvió después del almuerzo. Con buena energía, lo mantengo hidratado.',
    medicacion: null,
  },
]

export const ETIQUETAS_SINTOMA = ['Fiebre', 'Tos', 'Mocos', 'Vómito', 'Diarrea', 'Dolor', 'Sarpullido', 'Otro']
