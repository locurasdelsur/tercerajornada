'use client'

import { type FormEvent, useEffect, useState } from 'react'
import Image from 'next/image'
import useSWR from 'swr'
import {
  ArrowLeft, ArrowRight, CheckCircle2, ClipboardList, FileImage,
  LoaderCircle, LogOut, MapPin, MessageSquareQuote, Plus, Save, Send, ShieldCheck, Trash2, X,
} from 'lucide-react'

type Course = { ID_CURSO: string; CURSO: string; DIVISION: string; TURNO: string; ACTIVO?: string }
type Student = { username: string; course: string; division: string; shift: string }
type MapItem = {
  ID_MAPA: string; FECHA_CARGA: string; CURSO: string; DIVISION: string; TURNO: string;
  SECTOR_PLANO?: string; TITULO: string; DESCRIPCION: string;
}
type MuroItem = { ID_FRASE: string; CURSO: string; DIVISION: string; TURNO: string; FRASE_LOGRAMOS: string; FECHA_HORA: string }
type PuntoCritico = {
  situacionIdentificada: string
  accionesRealizadas: string
  cambiosObservados: string
  desafiosPersistentes: string
}

type Props = {
  courses: Course[]
  student?: Student
  loading?: boolean
  error?: string
  onEnter: (name: string, course: Course) => Promise<void>
  onLogout: () => void
}

const SECTORES_PLANO = [
  { id: 'Teoría - Planta baja', titulo: 'Teoría', subtitulo: 'Planta baja' },
  { id: 'Teoría - Planta alta', titulo: 'Teoría', subtitulo: 'Planta alta' },
  { id: 'Talleres - Planta baja', titulo: 'Talleres', subtitulo: 'Planta baja' },
  { id: 'Talleres - Planta alta', titulo: 'Talleres', subtitulo: 'Planta alta' },
  { id: 'Patios - Espacios comunes', titulo: 'Patios', subtitulo: 'Espacios comunes' },
]

const PREGUNTAS_ANALISIS = [
  { key: 'p1', text: '¿Qué muestran los mapas sobre la vida cotidiana de nuestra escuela? ¿Qué aspectos aparecen con mayor fuerza?' },
  { key: 'p2', text: '¿Qué espacios fueron señalados de manera similar por la mayoría? ¿Cuáles generaron miradas diferentes? ¿Por qué creen que sucede?' },
  { key: 'p3', text: 'Si las paredes de estos espacios hablaran, ¿qué historias contarían?' },
  { key: 'p4', text: '¿Qué nos dicen los grafitis, carteles, dibujos o mensajes que aparecen en esos lugares?' },
  { key: 'p5', text: '¿Qué escenas cotidianas podrían relatarse a partir de estos lugares? ¿Qué suele ocurrir allí?' },
  { key: 'p6', text: '¿Quiénes habitan esos espacios? ¿Hay personas o grupos que permanecen habitualmente allí? ¿Quiénes no aparecen?' },
  { key: 'p7', text: '¿Con qué personas adultas nos encontramos en esos espacios? ¿Cómo influye su presencia —o su ausencia— en lo que allí sucede?' },
  { key: 'p8', text: '¿Qué es lo que no suele decirse o no suele verse acerca de esos lugares?' },
  { key: 'p9', text: '¿Qué espacios aparecen como lugares de cuidado, encuentro y pertenencia? ¿Qué tienen en común?' },
  { key: 'p10', text: '¿Qué espacios fueron identificados como lugares de tensión, conflicto o malestar? ¿Qué condiciones creen que hacen que sean vividos de esa manera?' },
  { key: 'p11', text: '¿Qué situaciones o conflictos permanecen únicamente en la escuela y cuáles continúan en otros territorios, como las redes sociales, WhatsApp, el barrio, los clubes o el transporte?' },
  { key: 'p12', text: '¿Qué tendría que transformarse para que cambien los lugares identificados como espacios de tensión, conflicto o malestar?' },
  { key: 'p13', text: '¿Qué espacios no aparecen en los mapas? ¿Qué lugares casi nadie mencionó? ¿Qué podría significar esa ausencia?' },
]

const jsonFetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url, { cache: 'no-store' })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Error al cargar datos.')
  return json.data
}

export function StudentPortal({ courses, student, loading = false, error, onEnter, onLogout }: Props) {
  const [name, setName] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  // Paso 1: Subida y visión general de mapas
  const [sectorPlano, setSectorPlano] = useState(SECTORES_PLANO[0].id)
  const [filtroSector, setFiltroSector] = useState('TODOS')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10))
  const [zoomMapUrl, setZoomMapUrl] = useState<string | null>(null)

  // Paso 2: 13 preguntas
  const [respuestas, setRespuestas] = useState<Record<string, string>>({})

  // Paso 3: Matriz 3ra Jornada + Frase de cierre
  const [puntos, setPuntos] = useState<PuntoCritico[]>([
    { situacionIdentificada: '', accionesRealizadas: '', cambiosObservados: '', desafiosPersistentes: '' },
  ])
  const [fraseLogramos, setFraseLogramos] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [formError, setFormError] = useState('')

  const { data: allMaps, mutate: refreshMaps } = useSWR<MapItem[]>(student ? '/api/observatory?action=maps' : null, jsonFetcher)
  const { data: muroItems, mutate: refreshMuro } = useSWR<MuroItem[]>(student ? '/api/observatory?action=muro' : null, jsonFetcher)

  useEffect(() => {
    if (!file) { setPreviewUrl(null); return }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const course = courses.find((item) => item.ID_CURSO === selectedCourse)

  async function enter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!course) return
    setFormError('')
    try {
      await onEnter(name, course)
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'No se pudo iniciar el recorrido.')
    }
  }

  async function submitMapa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    setMessage('')
    if (!file) { setFormError('Seleccioná una imagen PNG o JPG para continuar.'); return }
    if (file.size > 10 * 1024 * 1024) { setFormError('La imagen no puede superar los 10 MB.'); return }
    setSubmitting(true)
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result.split(',')[1]) : reject(new Error('No se pudo leer la imagen.'))
        reader.onerror = () => reject(new Error('No se pudo leer la imagen.'))
        reader.readAsDataURL(file)
      })
      const response = await fetch('/api/observatory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'subirMapa',
          payload: {
            sectorPlano,
            fechaMapeo: date,
            titulo: title || `${sectorPlano} · ${student?.division}`,
            descripcion: description,
            base64Data,
            fileName: file.name,
            mimeType: file.type,
          },
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'No se pudo enviar el mapa.')
      setMessage('¡Mapa publicado en la galería general de la escuela!')
      setFile(null)
      setTitle('')
      setDescription('')
      await refreshMaps()
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'No se pudo enviar el mapa.')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitAnalisis(estado: 'BORRADOR' | 'ENVIADO') {
    setFormError('')
    setMessage('')
    setSubmitting(true)
    try {
      const response = await fetch('/api/observatory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'guardarAnalisisMapas',
          payload: { respuestas, estado },
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'No se pudieron guardar las respuestas.')
      setMessage(
        estado === 'BORRADOR'
          ? 'Borrador del análisis guardado correctamente.'
          : '¡Análisis colectivo de los mapas enviado! Ya pueden avanzar al Paso 3.'
      )
      if (estado === 'ENVIADO') setStep(3)
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Error al guardar el análisis.')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitJornada(mode: 'guardarBorrador' | 'guardarRegistros') {
    setFormError('')
    setMessage('')
    const validos = puntos.filter((p) => p.situacionIdentificada.trim() !== '')
    if (validos.length === 0) {
      setFormError('Completá al menos una situación identificada en la matriz.')
      return
    }
    setSubmitting(true)
    try {
      const response = await fetch('/api/observatory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: mode,
          payload: { puntos: validos, fraseLogramos },
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'No se pudo guardar el cuestionario.')
      await refreshMuro()
      setMessage(
        mode === 'guardarBorrador'
          ? 'Borrador guardado en Google Sheets.'
          : '¡Cuestionario de la 3ra Jornada enviado y publicado en la cartelera institucional!'
      )
      if (mode === 'guardarRegistros') setStep(4)
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Error al guardar el cuestionario.')
    } finally {
      setSubmitting(false)
    }
  }

  const mapsFiltrados = (allMaps || []).filter((m) =>
    filtroSector === 'TODOS' ? true : (m.SECTOR_PLANO || '').toLowerCase() === filtroSector.toLowerCase()
  )

  return (
    <main className="min-h-screen bg-[#f6f7f3] px-4 py-8 text-slate-900 sm:py-10">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-FSJVc7cMySTJm8LqhqvGTmua4KQhzg.png"
              alt="Escudo E.E.S.T. N.º 6"
              width={52}
              height={52}
              unoptimized
              className="size-[52px] object-contain"
            />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#56816a]">E.E.S.T. N.º 6 · Banfield</p>
              <p className="mt-0.5 text-sm font-semibold">Observatorio de Convivencia · 3ra Jornada</p>
            </div>
          </div>
          {student && (
            <button onClick={onLogout} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50">
              <LogOut size={15} /> Cambiar curso
            </button>
          )}
        </header>

        {!student ? (
          <section className="mx-auto max-w-xl rounded-2xl border border-[#e6e8e1] bg-white p-6 shadow-[0_18px_55px_rgba(30,58,47,.07)] sm:p-9">
            <div className="mb-7">
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-[#edf4ef] text-[#356b4f]">
                <ShieldCheck size={20} />
              </span>
              <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#56816a]">Acceso estudiantes · sin contraseña</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">Del mapa a la acción</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">Ingresá tu nombre y elegí tu curso para compartir mapas y completar los cuestionarios de la jornada.</p>
            </div>
            <form onSubmit={enter} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                Nombre y apellido (o representantes del grupo)
                <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#56816a]" placeholder="Ej. Camila Gómez / Grupo 1" />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                Curso, división y turno
                <select required value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} disabled={loading || courses.length === 0} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#56816a]">
                  <option value="">{loading ? 'Cargando cursos…' : 'Elegí tu curso'}</option>
                  {courses.filter((c) => String(c.ACTIVO ?? 'TRUE').toUpperCase() === 'TRUE').map((c) => (
                    <option key={c.ID_CURSO} value={c.ID_CURSO}>{c.CURSO} {c.DIVISION} · {c.TURNO}</option>
                  ))}
                </select>
              </label>
              {(error || formError) && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-xs text-red-800">{formError || error}</p>}
              <button disabled={loading || !course} className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#174b38] px-4 text-sm font-semibold text-white hover:bg-[#103b2c] disabled:opacity-50">
                Ingresar al recorrido <ArrowRight size={16} />
              </button>
            </form>
          </section>
        ) : (
          <>
            {/* Cabecera del curso autenticado + Navegación en 4 pasos */}
            <section className="rounded-2xl bg-[#174b38] p-6 text-white sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">Sesión activa · Sin revisión previa</p>
                  <h1 className="mt-1 text-xl font-semibold sm:text-2xl">{student.division} · Turno {student.shift}</h1>
                  <p className="mt-0.5 text-xs text-white/80">Participante: {student.username}</p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-2 border-t border-white/15 pt-5 sm:grid-cols-4">
                {[
                  { n: 1, label: '1. Mapas y Visión General' },
                  { n: 2, label: '2. Análisis (13 Preguntas)' },
                  { n: 3, label: '3. Matriz 3ra Jornada' },
                  { n: 4, label: '4. Cartelera Colectiva' },
                ].map((tab) => (
                  <button
                    key={tab.n}
                    onClick={() => { setStep(tab.n as 1 | 2 | 3 | 4); setMessage(''); setFormError('') }}
                    className={`rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition ${
                      step === tab.n ? 'bg-white text-[#174b38] shadow-sm' : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </section>

            {message && (
              <p role="status" className="mt-4 flex items-center gap-2 rounded-xl border border-[#c6dfd0] bg-[#edf4ef] px-4 py-3 text-xs font-medium text-[#174b38]">
                <CheckCircle2 size={16} className="shrink-0" /> {message}
              </p>
            )}
            {(formError || error) && (
              <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
                {formError || error}
              </p>
            )}

            {/* PASO 1: SUBIR MAPA Y RECORDAR LOS 5 PLANOS */}
            {step === 1 && (
              <div className="mt-6 space-y-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-base font-semibold">Recordá los 5 planos relevados en la escuela</h2>
                  <p className="mt-1 text-xs text-slate-500">Seleccioná a qué plano corresponde el mapa que van a subir (se publica automáticamente para compartir la visión general):</p>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {SECTORES_PLANO.map((sec) => (
                      <button
                        type="button"
                        key={sec.id}
                        onClick={() => setSectorPlano(sec.id)}
                        className={`rounded-xl border p-3.5 text-left transition ${
                          sectorPlano === sec.id
                            ? 'border-[#174b38] bg-[#edf4ef] ring-1 ring-[#174b38]'
                            : 'border-slate-200 bg-[#fafaf8] hover:border-slate-300'
                        }`}
                      >
                        <MapPin size={16} className={sectorPlano === sec.id ? 'text-[#174b38]' : 'text-slate-400'} />
                        <p className="mt-2 text-xs font-bold text-slate-900">{sec.titulo}</p>
                        <p className="text-[11px] text-slate-500">{sec.subtitulo}</p>
                      </button>
                    ))}
                  </div>

                  <form onSubmit={submitMapa} className="mt-6 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2">
                    <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                      Título del mapa
                      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`Ej. ${sectorPlano} - Grupo 1`} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
                    </label>
                    <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                      Fecha del mapeo
                      <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
                    </label>
                    <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700 sm:col-span-2">
                      Observaciones del recorrido / bitácora
                      <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="¿Qué íconos o situaciones marcaron en este plano?" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                    </label>
                    <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center hover:bg-slate-100 sm:col-span-2">
                      <input type="file" accept="image/png,image/jpeg" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                      <FileImage size={22} className="text-slate-400" />
                      <span className="mt-2 text-xs font-semibold text-slate-700">{file?.name || 'Subir imagen del mapa (PNG o JPG)'}</span>
                    </label>
                    {previewUrl && (
                      <div className="overflow-hidden rounded-xl border border-slate-200 sm:col-span-2">
                        <Image src={previewUrl} alt="Vista previa" width={1000} height={600} unoptimized className="max-h-64 w-full object-contain" />
                      </div>
                    )}
                    <div className="flex justify-end sm:col-span-2">
                      <button disabled={submitting || !file} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#174b38] px-5 text-xs font-semibold text-white hover:bg-[#103b2c] disabled:opacity-50">
                        {submitting ? <LoaderCircle className="animate-spin" size={15} /> : <ArrowRight size={15} />}
                        Publicar mapa en la visión general
                      </button>
                    </div>
                  </form>
                </section>

                {/* Galería compartida de todos los mapas cargados */}
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold">Visión General: Mapas de toda la escuela ({mapsFiltrados.length})</h2>
                      <p className="mt-0.5 text-xs text-slate-500">Júntense a observar los planos cargados por los distintos cursos antes de responder las preguntas.</p>
                    </div>
                    <select value={filtroSector} onChange={(e) => setFiltroSector(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium">
                      <option value="TODOS">Todos los planos</option>
                      {SECTORES_PLANO.map((s) => <option key={s.id} value={s.id}>{s.id}</option>)}
                    </select>
                  </div>

                  {mapsFiltrados.length === 0 ? (
                    <p className="mt-6 rounded-xl border border-dashed border-slate-200 py-10 text-center text-xs text-slate-500">
                      Todavía no hay mapas cargados en este filtro. ¡Suban el primero!
                    </p>
                  ) : (
                    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {mapsFiltrados.map((m) => {
                        const imgUrl = `/api/observatory?action=mapImage&idMapa=${encodeURIComponent(m.ID_MAPA)}`
                        return (
                          <button
                            key={m.ID_MAPA}
                            type="button"
                            onClick={() => setZoomMapUrl(imgUrl)}
                            className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50 text-left transition hover:border-[#56816a] hover:shadow-md"
                          >
                            <div className="relative aspect-[16/10] bg-slate-100">
                              <Image src={imgUrl} alt={m.TITULO} fill unoptimized className="object-contain" />
                            </div>
                            <div className="p-3.5">
                              <span className="inline-block rounded-full bg-[#edf4ef] px-2 py-0.5 text-[10px] font-semibold text-[#174b38]">
                                {m.SECTOR_PLANO || 'Plano escolar'}
                              </span>
                              <p className="mt-1.5 text-xs font-semibold text-slate-900">{m.TITULO}</p>
                              <p className="mt-0.5 text-[11px] text-slate-500">{m.DIVISION} · Turno {m.TURNO}</p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
                    <button type="button" onClick={() => setStep(2)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#174b38] px-4 text-xs font-semibold text-white">
                      Continuar al Análisis (13 Preguntas) <ArrowRight size={15} />
                    </button>
                  </div>
                </section>
              </div>
            )}

            {/* PASO 2: LAS 13 PREGUNTAS DE ANÁLISIS COLECTIVO */}
            {step === 2 && (
              <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-lg font-semibold">Análisis colectivo de los mapas</h2>
                <p className="mt-1 text-xs text-slate-500">A partir de la visión general de los mapas de la escuela, debatan en grupo y respondan:</p>
                <div className="mt-6 space-y-5">
                  {PREGUNTAS_ANALISIS.map((preg, idx) => (
                    <label key={preg.key} className="block rounded-xl border border-slate-200/80 bg-[#fafaf8] p-4">
                      <span className="text-xs font-semibold leading-5 text-slate-800">
                        {idx + 1}. {preg.text}
                      </span>
                      <textarea
                        rows={3}
                        value={respuestas[preg.key] || ''}
                        onChange={(e) => setRespuestas((prev) => ({ ...prev, [preg.key]: e.target.value }))}
                        placeholder="Escriban la reflexión del curso..."
                        className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#56816a]"
                      />
                    </label>
                  ))}
                </div>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                  <button type="button" onClick={() => setStep(1)} className="inline-flex h-10 items-center gap-2 text-xs font-medium text-slate-600">
                    <ArrowLeft size={15} /> Volver a los mapas
                  </button>
                  <div className="flex gap-2">
                    <button type="button" disabled={submitting} onClick={() => submitAnalisis('BORRADOR')} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                      <Save size={15} /> Guardar borrador
                    </button>
                    <button type="button" disabled={submitting} onClick={() => submitAnalisis('ENVIADO')} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#174b38] px-5 text-xs font-semibold text-white hover:bg-[#103b2c]">
                      <Send size={15} /> Enviar respuestas y seguir
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* PASO 3: CUESTIONARIO 3RA JORNADA (DEL MAPA A LA ACCIÓN) */}
            {step === 3 && (
              <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-center gap-2 text-[#174b38]">
                  <ClipboardList size={18} />
                  <h2 className="text-lg font-semibold">Cuestionario 3ra Jornada (Del mapa a la acción)</h2>
                </div>
                <p className="mt-1 text-xs text-slate-500">Completen la matriz de seguimiento por cada situación prioritaria identificada en la 2da Jornada o en el Buzón:</p>

                <div className="mt-6 space-y-5">
                  {puntos.map((punto, index) => (
                    <div key={index} className="rounded-xl border border-slate-200 bg-[#fafaf8] p-4 sm:p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#174b38]">Punto crítico #{index + 1}</span>
                        {puntos.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setPuntos((prev) => prev.filter((_, i) => i !== index))}
                            className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
                          >
                            <Trash2 size={14} /> Quitar fila
                          </button>
                        )}
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
                          1. Situación identificada en el mapa / buzón
                          <textarea
                            rows={3}
                            value={punto.situacionIdentificada}
                            onChange={(e) => {
                              const copy = [...puntos]
                              copy[index].situacionIdentificada = e.target.value
                              setPuntos(copy)
                            }}
                            placeholder="Ej. Conflictos en los recreos / falta de espacios de escucha..."
                            className="rounded-lg border border-slate-200 bg-white p-2.5 text-sm"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
                          2. ¿Qué acciones realizamos desde la jornada anterior?
                          <textarea
                            rows={3}
                            value={punto.accionesRealizadas}
                            onChange={(e) => {
                              const copy = [...puntos]
                              copy[index].accionesRealizadas = e.target.value
                              setPuntos(copy)
                            }}
                            placeholder="Acuerdos, propuestas, intervenciones..."
                            className="rounded-lg border border-slate-200 bg-white p-2.5 text-sm"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
                          3. ¿Qué cambios observamos hoy?
                          <textarea
                            rows={3}
                            value={punto.cambiosObservados}
                            onChange={(e) => {
                              const copy = [...puntos]
                              copy[index].cambiosObservados = e.target.value
                              setPuntos(copy)
                            }}
                            placeholder="Avances, mejoras o cosas que siguen igual..."
                            className="rounded-lg border border-slate-200 bg-white p-2.5 text-sm"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
                          4. ¿Qué desafíos persisten para 2027?
                          <textarea
                            rows={3}
                            value={punto.desafiosPersistentes}
                            onChange={(e) => {
                              const copy = [...puntos]
                              copy[index].desafiosPersistentes = e.target.value
                              setPuntos(copy)
                            }}
                            placeholder="Compromisos y actores necesarios para el próximo año..."
                            className="rounded-lg border border-slate-200 bg-white p-2.5 text-sm"
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setPuntos((prev) => [
                      ...prev,
                      { situacionIdentificada: '', accionesRealizadas: '', cambiosObservados: '', desafiosPersistentes: '' },
                    ])
                  }
                  className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg border border-dashed border-[#356b4f] bg-[#f3f8f4] px-4 text-xs font-semibold text-[#174b38] hover:bg-[#e5f0e7]"
                >
                  <Plus size={16} /> Agregar otro punto crítico
                </button>

                {/* Cierre colectivo */}
                <div className="mt-7 rounded-2xl border border-[#dce9df] bg-[#f3f8f4] p-5">
                  <div className="flex items-center gap-2 text-[#174b38]">
                    <MessageSquareQuote size={18} />
                    <h3 className="text-sm font-bold">Cierre colectivo para la cartelera institucional</h3>
                  </div>
                  <label className="mt-3 block text-xs font-medium text-slate-700">
                    Completen la frase: <strong className="text-[#174b38]">&ldquo;En nuestra escuela logramos...&rdquo;</strong>
                    <textarea
                      rows={2}
                      value={fraseLogramos}
                      onChange={(e) => setFraseLogramos(e.target.value)}
                      placeholder="En nuestra escuela logramos..."
                      className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                  </label>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                  <button type="button" onClick={() => setStep(2)} className="inline-flex h-10 items-center gap-2 text-xs font-medium text-slate-600">
                    <ArrowLeft size={15} /> Volver al análisis
                  </button>
                  <div className="flex gap-2">
                    <button type="button" disabled={submitting} onClick={() => submitJornada('guardarBorrador')} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                      <Save size={15} /> Guardar borrador
                    </button>
                    <button type="button" disabled={submitting} onClick={() => submitJornada('guardarRegistros')} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#174b38] px-5 text-xs font-semibold text-white hover:bg-[#103b2c]">
                      <Send size={15} /> Enviar definitivamente
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* PASO 4: CARTELERA COLECTIVA */}
            {step === 4 && (
              <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-lg font-semibold">Cartelera Institucional: &ldquo;En nuestra escuela logramos...&rdquo;</h2>
                <p className="mt-1 text-xs text-slate-500">Producción colectiva de los cursos de la E.E.S.T. N.º 6 · Tercera Jornada de Convivencia 2026.</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {(muroItems || []).map((item) => (
                    <article key={item.ID_FRASE} className="rounded-xl border border-[#dce9df] bg-[#f6f9f6] p-5">
                      <span className="rounded-full bg-[#174b38] px-2.5 py-0.5 text-[10px] font-semibold text-white">
                        {item.DIVISION} · {item.TURNO}
                      </span>
                      <p className="mt-3 text-sm font-medium leading-6 text-slate-800">&ldquo;{item.FRASE_LOGRAMOS}&rdquo;</p>
                    </article>
                  ))}
                  {(!muroItems || muroItems.length === 0) && (
                    <p className="col-span-full py-8 text-center text-xs text-slate-500">Aún no hay frases publicadas en el muro.</p>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {zoomMapUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4" onClick={() => setZoomMapUrl(null)}>
          <button className="absolute right-5 top-5 rounded-full bg-white/15 p-2 text-white" aria-label="Cerrar"><X size={20} /></button>
          <div className="relative h-[80vh] w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <Image src={zoomMapUrl} alt="Mapa ampliado" fill unoptimized className="object-contain" />
          </div>
        </div>
      )}
    </main>
  )
}