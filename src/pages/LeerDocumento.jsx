import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Boton, Icon, Interruptor, Pagina } from '../components/ui'
import { useStore } from '../data/store'
import { pesoLegible, prepararArchivo } from '../data/archivos'
import { iaConfigurada, leerDocumento } from '../data/ia'
import { fechaCorta, hoy } from '../data/fechas'

export function Miniatura({ a, onQuitar, onAbrir }) {
  return (
    <div className="flex items-center gap-3 bg-surface-low rounded-2xl p-2 pr-3">
      <button type="button" onClick={onAbrir} className="w-14 h-14 rounded-xl overflow-hidden bg-surface-container flex items-center justify-center shrink-0">
        {a.tipo.startsWith('image/') ? <img src={a.datos} alt="" className="w-full h-full object-cover" /> : <Icon name="picture_as_pdf" className="text-3xl text-error" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">{a.nombre}</div>
        <div className="text-xs text-on-surface-variant">{pesoLegible(a.datos)}</div>
      </div>
      {onQuitar && (
        <button type="button" onClick={onQuitar} className="w-10 h-10 rounded-full text-on-surface-variant flex items-center justify-center" aria-label={`Quitar ${a.nombre}`}>
          <Icon name="close" />
        </button>
      )}
    </div>
  )
}

const sinTildes = (t) => (t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function LeerDocumento() {
  const { hijoActivo: h, proveedores, lecturaIA } = useStore()
  const navigate = useNavigate()
  const [archivos, setArchivos] = useState([])
  const [estado, setEstado] = useState('elegir') // elegir | leyendo | listo
  const [error, setError] = useState(null)
  const [resultado, setResultado] = useState(null)
  const [aplicar, setAplicar] = useState({ peso: true, altura: true, alergias: true })
  const foto = useRef(null)
  const elegir = useRef(null)
  const configurada = iaConfigurada(lecturaIA)

  const agregar = async (e) => {
    const lista = [...e.target.files]
    e.target.value = ''
    setError(null)
    try {
      const nuevos = await Promise.all(lista.map(prepararArchivo))
      setArchivos((a) => [...a, ...nuevos].slice(0, 10))
    } catch (err) {
      setError(err.message)
    }
  }

  const leer = async () => {
    setEstado('leyendo')
    setError(null)
    try {
      const r = await leerDocumento(lecturaIA, archivos, {
        hijo: { nombre: h.nombre, nacimiento: h.nacimiento || null },
        lugares: proveedores.filter((p) => p !== 'Otro'),
        hoy: hoy(),
      })
      setResultado(r.datos)
      setEstado('listo')
    } catch (err) {
      setError(err.message)
      setEstado('elegir')
    }
  }

  const d = resultado
  const alergiasNuevas = (d?.alergias ?? []).filter((a) => !h.alergias?.some((x) => sinTildes(x) === sinTildes(a)))
  const nombrePaciente = d?.paciente?.nombre
  const otroPaciente = nombrePaciente && !sinTildes(nombrePaciente).includes(sinTildes(h.nombre).split(' ')[0])

  const continuar = (conDatos) => {
    const perfil = conDatos
      ? {
          peso: aplicar.peso ? d.medidas?.pesoKg : null,
          altura: aplicar.altura ? d.medidas?.alturaCm : null,
          alergias: aplicar.alergias ? alergiasNuevas : [],
        }
      : null
    navigate('/visitas/nueva', { state: { prefill: conDatos ? d : null, adjuntos: archivos, perfil } })
  }

  if (estado === 'leyendo')
    return (
      <Pagina titulo="Leyendo el documento" volver>
        <div className="bg-surface-lowest rounded-3xl shadow-soft p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full border-4 border-primary-fixed border-t-primary animate-spin" />
          <p className="font-semibold">Claude está leyendo {archivos.length > 1 ? `las ${archivos.length} páginas` : 'el documento'}…</p>
          <p className="text-sm text-on-surface-variant">Puede tardar hasta un minuto. No cierres la app.</p>
        </div>
      </Pagina>
    )

  if (estado === 'listo')
    return (
      <Pagina titulo="Esto es lo que leí" subtitulo={`${d.tipoDocumento} de ${h.nombre}`} volver>
        <div className="space-y-4">
          <div className="bg-surface-lowest rounded-3xl shadow-soft p-5 space-y-2">
            <p>{d.resumen}</p>
            <div className="text-sm text-on-surface-variant flex flex-wrap gap-x-4 gap-y-1">
              {d.visita.fecha && <span>{fechaCorta(d.visita.fecha)}</span>}
              {d.visita.lugar && <span>{d.visita.lugar}</span>}
              {d.visita.medico && <span>{d.visita.medico}</span>}
            </div>
            {d.tratamientos.length > 0 && (
              <ul className="pt-2 space-y-1">
                {d.tratamientos.map((t, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Icon name="medication" className="text-primary text-lg" />
                    <span>
                      <b>{t.medicamento}</b> {t.dosis} {t.cadaHoras && `cada ${t.cadaHoras} h`} {t.duracionDias && `por ${t.duracionDias} días`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {(otroPaciente || d.advertencias.length > 0) && (
            <div className="bg-tertiary-fixed/60 rounded-3xl p-5 space-y-2">
              <div className="font-semibold flex items-center gap-2">
                <Icon name="warning" /> Revisá con cuidado
              </div>
              <ul className="list-disc pl-5 text-sm space-y-1">
                {otroPaciente && (
                  <li>
                    El documento dice «{nombrePaciente}». ¿Es de {h.nombre}? Si no, volvé y elegí el hijo correcto arriba.
                  </li>
                )}
                {d.advertencias.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          {(d.medidas?.pesoKg || d.medidas?.alturaCm || alergiasNuevas.length > 0) && (
            <div className="bg-surface-lowest rounded-3xl shadow-soft p-5 space-y-2">
              <div className="font-semibold">Actualizar el perfil de {h.nombre} al guardar</div>
              {d.medidas?.pesoKg && (
                <Interruptor etiqueta={`Peso: ${String(d.medidas.pesoKg).replace('.', ',')} kg`} activo={aplicar.peso} onChange={(v) => setAplicar({ ...aplicar, peso: v })} />
              )}
              {d.medidas?.alturaCm && (
                <Interruptor etiqueta={`Altura: ${d.medidas.alturaCm} cm`} activo={aplicar.altura} onChange={(v) => setAplicar({ ...aplicar, altura: v })} />
              )}
              {alergiasNuevas.length > 0 && (
                <Interruptor etiqueta={`Alergias: ${alergiasNuevas.join(', ')}`} activo={aplicar.alergias} onChange={(v) => setAplicar({ ...aplicar, alergias: v })} />
              )}
            </div>
          )}

          <Boton icono="edit_note" className="w-full" onClick={() => continuar(true)}>
            Revisar y guardar la visita
          </Boton>
          <Boton variante="suave" className="w-full" onClick={() => setEstado('elegir')}>
            Volver a los archivos
          </Boton>
        </div>
      </Pagina>
    )

  return (
    <Pagina titulo="Leer un documento" subtitulo={`Receta, informe o alta de ${h.nombre}. Completo la visita por vos y la revisás antes de guardar.`} volver>
      <input ref={foto} type="file" accept="image/*" capture="environment" className="hidden" onChange={agregar} />
      <input ref={elegir} type="file" accept="application/pdf,image/*" multiple className="hidden" onChange={agregar} />

      <div className="grid grid-cols-2 gap-3 mb-4">
        <button onClick={() => foto.current.click()} className="bg-surface-lowest rounded-3xl shadow-soft p-5 flex flex-col items-center gap-2 font-semibold">
          <span className="w-12 h-12 rounded-full bg-primary-fixed text-primary flex items-center justify-center">
            <Icon name="photo_camera" />
          </span>
          Sacar foto
        </button>
        <button onClick={() => elegir.current.click()} className="bg-surface-lowest rounded-3xl shadow-soft p-5 flex flex-col items-center gap-2 font-semibold">
          <span className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
            <Icon name="upload_file" />
          </span>
          PDF o imagen
        </button>
      </div>

      {archivos.length > 0 && (
        <div className="space-y-2 mb-4">
          {archivos.map((a, i) => (
            <Miniatura key={i} a={a} onQuitar={() => setArchivos((l) => l.filter((_, j) => j !== i))} />
          ))}
          {archivos.length > 1 && <p className="text-xs text-on-surface-variant">Se leen juntas, como páginas de un mismo documento.</p>}
        </div>
      )}

      {error && (
        <div className="bg-error-container text-on-error-container rounded-2xl p-4 mb-4 flex gap-2">
          <Icon name="error" /> <span>{error}</span>
        </div>
      )}

      {configurada ? (
        <>
          <Boton icono="auto_awesome" className="w-full" disabled={!archivos.length} onClick={leer}>
            Leer con IA
          </Boton>
          <p className="text-xs text-on-surface-variant mt-3">
            El documento pasa por tu Raspberry y lo lee Claude (Anthropic). Nada se guarda hasta que revises y confirmes la visita.
          </p>
        </>
      ) : (
        <div className="bg-surface-lowest rounded-3xl shadow-soft p-5 space-y-2">
          <p className="font-semibold">Falta conectar la app con tu Raspberry</p>
          <p className="text-sm text-on-surface-variant">Para que la IA lea documentos, cargá la dirección y la contraseña del servidor en Ajustes.</p>
          <Link to="/configuracion" className="inline-flex min-h-11 items-center px-5 rounded-full bg-primary text-white font-semibold text-sm">
            Ir a Ajustes
          </Link>
        </div>
      )}

      {archivos.length > 0 && (
        <Boton variante="suave" className="w-full mt-3" onClick={() => continuar(false)}>
          Solo adjuntar, sin leer
        </Boton>
      )}
    </Pagina>
  )
}
