'use client'

import { type FormEvent, useMemo, useState } from 'react'
import useSWR from 'swr'
import {
  Activity, AlertCircle, BookOpen, CalendarDays, CheckCircle2, ClipboardList,
  CloudUpload, FileImage, Flame, LayoutDashboard, LoaderCircle, LogOut, Menu,
  MessageSquareQuote, MessageSquareText, Plus, Search, ShieldCheck, Users, X,
} from 'lucide-react'
import {
  cleanDescriptionText,
  type DetectedHotspot,
  extractAutoScan,
  ICONOS_CONVIVENCIA,
} from '@/components/student-portal'

type Section =
  | 'Inicio'
  | 'Biblioteca de mapas'
  | 'Análisis institucional'
  | '3ra Jornada: Del Mapa a la Acción'
  | 'Agenda institucional 2027'

const navItems: { label: Section; icon: typeof LayoutDashboard }[] = [
  { label: 'Inicio', icon: LayoutDashboard },
  { label: 'Biblioteca de mapas', icon: BookOpen },
  { label: 'Análisis institucional', icon: Activity },
  { label: '3ra Jornada: Del Mapa a la Acción', icon: ClipboardList },
  { label: 'Agenda institucional 2027', icon: CalendarDays },
]

const PLANOS_ESCUELA = [
  { id: 'Teoría - Planta baja', short: 'Teoría PB', img: '/planos/teoria-pb.jpg' },
  { id: 'Teoría - Planta alta', short: 'Teoría PA', img: '/planos/teoria-pa.jpg' },
  { id: 'Talleres - Planta baja', short: 'Talleres PB', img: '/planos/talleres-pb.jpg' },
  { id: 'Talleres - Planta alta', short: 'Talleres PA', img: '/planos/talleres-pa.jpg' },
  { id: 'Patios - Espacios comunes', short: 'Patios', img: '/planos/patios.jpg' },
]

const PREGUNTAS_LABELS: { key: string; label: string }[] = [
  { key: 'P1_VIDA_COTIDIANA', label: '1. Vida cotidiana de la escuela' },
  { key: 'P2_COINCIDENCIAS_DIFERENCIAS', label: '2. Coincidencias y miradas diferentes' },
  { key: 'P3_HISTORIAS_PAREDES', label: '3. Si las paredes hablaran...' },
  { key: 'P4_GRAFITIS_CARTELES', label: '4. Grafitis, carteles o mensajes' },
  { key: 'P5_ESCENAS_COTIDIANAS', label: '5. Escenas cotidianas' },
  { key: 'P6_QUIENES_HABITAN', label: '6. Quiénes habitan / quiénes no aparecen' },
  { key: 'P7_PRESENCIA_ADULTA', label: '7. Presencia o ausencia adulta' },
  { key: 'P8_NO_SE_DICE_O_VE', label: '8. Lo que no suele decirse o verse' },
  { key: 'P9_CUIDADO_ENCUENTRO', label: '9. Lugares de cuidado y pertenencia' },
  { key: 'P10_TENSION_CONFLICTO', label: '10. Lugares de tensión o malestar' },
  { key: 'P11_OTROS_TERRITORIOS', label: '11. Conflictos en otros territorios (redes, barrio)' },
  { key: 'P12_QUE_TRANSFORMAR', label: '12. Qué tendría que transformarse' },
  { key: 'P13_ESPACIOS_AUSENTES', label: '13. Espacios ausentes en los mapas' },
]

const jsonFetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url, { cache: 'no-store' })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error || 'Error al cargar datos.')
  return body.data
}

function Sidebar({ active, onChange, open, onClose }: { active: Section; onChange: (value: Section) => void; open: boolean; onClose: () => void }) {
  return (
    <>
      {open && <button aria-label="Cerrar menú" className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col border-r border-slate-200 bg-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[92px] items-center gap-3 border-b border-slate-100 px-5">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-FSJVc7cMySTJm8LqhqvGTmua4KQhzg.png"
            alt="Escudo E.E.S.T. N.º 6"
            className="size-[54px] shrink-0 object-contain"
          />
          <div>
            <p className="text-[13px] font-bold tracking-wide text-slate-900">OBSERVATORIO</p>
            <p className="text-[11px] leading-4 text-slate-500">E.E.S.T. N.º 6 · Banfield<br />Lomas de Zamora</p>
          </div>
          <button className="ml-auto rounded-md p-1 text-slate-400 lg:hidden" onClick={onClose} aria-label="Cerrar navegación"><X size={18} /></button>
        </div>
        <div className="px-4 pt-7">
          <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Espacio institucional</p>
          <nav aria-label="Navegación principal" className="flex flex-col gap-1">
            {navItems.map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => { onChange(label); onClose() }}
                className={`flex min-h-10 items-center gap-3 rounded-lg px-3 text-left text-[13px] transition ${
                  active === label ? 'bg-[#edf4ef] font-semibold text-[#174b38]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={17} strokeWidth={1.8} />
                <span className="leading-5">{label}</span>
                {active === label && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#397356]" />}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4">
          <div className="rounded-xl border border-[#e2eae4] bg-[#f6f9f6] p-4">
            <div className="flex items-center gap-2 text-[#174b38]"><ShieldCheck size={16} /><span className="text-xs font-semibold">Vista Directivos</span></div>
            <p className="mt-2 text-[11px] leading-5 text-slate-500">Lectura automática de mapas, gráficos consolidados y acuerdos 2027.</p>
          </div>
        </div>
      </aside>
    </>
  )
}

function MetricCard({ label, value, detail, icon: Icon, tone }: { label: string; value: string; detail: string; icon: typeof Users; tone: string }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.03)]">
      <div className="flex items-start justify-between">
        <p className="text-[12px] font-medium text-slate-500">{label}</p>
        <span className={`flex size-9 items-center justify-center rounded-lg ${tone}`}><Icon size={17} /></span>
      </div>
      <p className="mt-4 text-[28px] font-semibold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-[11px] text-slate-400">{detail}</p>
    </article>
  )
}

type PortalUser = { id: string; username: string; role: string; course: string; division: string; shift: string }
type PortalStats = {
  totalCursosActivos: number
  totalMapas: number
  totalPuntosCriticos: number
  totalPropuestas2027: number
  mapasPorEstado: Record<string, number>
}
type PortalMap = {
  ID_MAPA: string; FECHA_CARGA: string; FECHA_MAPEO: string; CURSO: string; DIVISION: string; TURNO: string;
  SECTOR_PLANO?: string; TITULO: string; DESCRIPCION: string; ESTADO_REVISION: string;
}
type PortalCourse = { ID_CURSO: string; CURSO: string; DIVISION: string; TURNO: string }
type AnalisisItem = Record<string, string>
type RegistroJornada = {
  ID_REGISTRO: string; FECHA_HORA: string; CURSO: string; DIVISION: string; TURNO: string;
  SITUACION_IDENTIFICADA: string; ACCIONES_REALIZADAS: string; CAMBIOS_OBSERVADOS: string; DESAFIOS_PERSISTENTES: string; ESTADO: string;
}
type MuroItem = { ID_FRASE: string; CURSO: string; DIVISION: string; TURNO: string; FRASE_LOGRAMOS: string; FECHA_HORA: string }
type AgendaItem = {
  ID_PROPUESTA: string; FECHA_ALTA: string; TITULO: string; DESCRIPCION: string; CURSOS_PROPONENTES: string;
  SITUACION_A_TRANSFORMAR: string; ACCION_PROPUESTA: string; RESPONSABLE: string; PRIORIDAD: string; ESTADO: string;
}

export function ObservatoryApp({
  user, stats, maps, courses = [], dataError, onUploaded, onLogout,
}: {
  user: PortalUser
  stats?: PortalStats
  maps?: PortalMap[]
  courses?: PortalCourse[]
  driveReady: boolean
  dataError?: string
  onUploaded: () => Promise<void>
  onLogout: () => void
}) {
  const [active, setActive] = useState<Section>('Inicio')
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [sectorFilter, setSectorFilter] = useState('TODOS')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)

  const { data: analisisList } = useSWR<AnalisisItem[]>('/api/observatory?action=analisis', jsonFetcher)
  const { data: registrosList } = useSWR<RegistroJornada[]>('/api/observatory?action=records', jsonFetcher)
  const { data: muroList } = useSWR<MuroItem[]>('/api/observatory?action=muro', jsonFetcher)
  const { data: agendaList, mutate: refreshAgenda } = useSWR<AgendaItem[]>('/api/observatory?action=agenda', jsonFetcher)

  const [divisionFilter, setDivisionFilter] = useState('TODAS')
  const [heatmapPlano, setHeatmapPlano] = useState(PLANOS_ESCUELA[0].id)
  const [heatmapCategory, setHeatmapCategory] = useState<'ALL' | DetectedHotspot['category']>('ALL')

  const [propTitulo, setPropTitulo] = useState('')
  const [propSituacion, setPropSituacion] = useState('')
  const [propAccion, setPropAccion] = useState('')
  const [propResponsable, setPropResponsable] = useState('')
  const [propPrioridad, setPropPrioridad] = useState('ALTA')
  const [savingProp, setSavingProp] = useState(false)
  const [propMsg, setPropMsg] = useState('')

  const visibleMaps = useMemo(() => {
    return (maps ?? []).filter((item) => {
      const matchText = `${item.TITULO} ${item.SECTOR_PLANO || ''} ${item.CURSO} ${item.DIVISION} ${item.TURNO}`
        .toLowerCase()
        .includes(query.toLowerCase())
      const matchSector = sectorFilter === 'TODOS' || (item.SECTOR_PLANO || item.TITULO) === sectorFilter
      return matchText && matchSector
    })
  }, [maps, query, sectorFilter])

  const mapsPorFiltroCurso = useMemo(() => {
    return (maps ?? []).filter((m) =>
      divisionFilter === 'TODAS' ? true : String(m.DIVISION).trim() === divisionFilter
    )
  }, [maps, divisionFilter])

  const filteredAnalisis = useMemo(() => {
    return (analisisList ?? []).filter((item) =>
      divisionFilter === 'TODAS' ? true : String(item.DIVISION).trim() === divisionFilter
    )
  }, [analisisList, divisionFilter])

  const filteredRegistros = useMemo(() => {
    return (registrosList ?? []).filter((item) =>
      divisionFilter === 'TODAS' ? true : String(item.DIVISION).trim() === divisionFilter
    )
  }, [registrosList, divisionFilter])

  // Consolidación automática de los símbolos escaneados de todos los mapas filtrados
  const resumenSimbolos = useMemo(() => {
    const totals: Record<string, number> = {}
    mapsPorFiltroCurso.forEach((m) => {
      const scan = extractAutoScan(m.DESCRIPCION)
      if (scan?.counts) {
        Object.entries(scan.counts).forEach(([k, val]) => {
          totals[k] = (totals[k] || 0) + Number(val || 0)
        })
      }
    })

    const relevantIcons = ICONOS_CONVIVENCIA.filter((ic) =>
      ['espacio_cuidado', 'espacio_transicion', 'espacio_riesgo', 'espacio_dialogo', 'producciones_grafitis'].includes(ic.id)
    )

    return relevantIcons
      .map((ic) => ({ ...ic, count: totals[ic.id] || 0 }))
      .sort((a, b) => b.count - a.count)
  }, [mapsPorFiltroCurso])

  // Hotspots reales extraídos de las capturas del plano seleccionado
  const activePlanHotspots = useMemo(() => {
    const spots: DetectedHotspot[] = []
    mapsPorFiltroCurso
      .filter((m) => (m.SECTOR_PLANO || m.TITULO || '').toLowerCase() === heatmapPlano.toLowerCase())
      .forEach((m) => {
        const scan = extractAutoScan(m.DESCRIPCION)
        if (scan?.hotspots) {
          scan.hotspots.forEach((h) => {
            if (heatmapCategory === 'ALL' || h.category === heatmapCategory) {
              spots.push(h)
            }
          })
        }
      })
    return spots
  }, [mapsPorFiltroCurso, heatmapPlano, heatmapCategory])

  const resumenPorPlano = useMemo(() => {
    return PLANOS_ESCUELA.map((pl) => {
      const count = mapsPorFiltroCurso.filter(
        (m) => (m.SECTOR_PLANO || m.TITULO || '').toLowerCase() === pl.id.toLowerCase()
      ).length
      return { ...pl, count }
    })
  }, [mapsPorFiltroCurso])

  const maxPlanoCount = Math.max(1, ...resumenPorPlano.map((p) => p.count))
  const maxSimboloCount = Math.max(1, ...resumenSimbolos.map((s) => s.count))
  const activePlanoObj = PLANOS_ESCUELA.find((p) => p.id === heatmapPlano) || PLANOS_ESCUELA[0]
  const activePlanoCount = resumenPorPlano.find((p) => p.id === heatmapPlano)?.count || 0

  async function handleCreatePropuesta(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!propTitulo.trim()) return
    setSavingProp(true)
    setPropMsg('')
    try {
      const res = await fetch('/api/observatory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'crearPropuesta',
          payload: {
            titulo: propTitulo,
            situacionATransformar: propSituacion,
            accionPropuesta: propAccion,
            responsable: propResponsable,
            prioridad: propPrioridad,
            estado: 'PENDIENTE',
          },
        }),
      })
      if (!res.ok) throw new Error('No se pudo guardar la propuesta.')
      setPropTitulo('')
      setPropSituacion('')
      setPropAccion('')
      setPropResponsable('')
      setPropMsg('Propuesta agregada a la Agenda Institucional 2027.')
      await refreshAgenda()
      await onUploaded()
    } catch {
      setPropMsg('Error al guardar la propuesta.')
    } finally {
      setSavingProp(false)
    }
  }

  async function handleToggleEstadoPropuesta(idPropuesta: string, nuevoEstado: string) {
    await fetch('/api/observatory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'actualizarPropuesta',
        payload: { idPropuesta, estado: nuevoEstado },
      }),
    })
    await refreshAgenda()
  }

  function getHotspotGradient(cat: DetectedHotspot['category'], weight: number) {
    const alpha = Math.min(0.85, 0.35 + weight * 0.1)
    if (cat === 'riesgo') return `radial-gradient(circle, rgba(239,68,68,${alpha}) 0%, rgba(239,68,68,0) 72%)`
    if (cat === 'transicion') return `radial-gradient(circle, rgba(245,158,11,${alpha}) 0%, rgba(245,158,11,0) 72%)`
    if (cat === 'dialogo') return `radial-gradient(circle, rgba(59,130,246,${alpha}) 0%, rgba(59,130,246,0) 72%)`
    if (cat === 'produccion') return `radial-gradient(circle, rgba(168,85,247,${alpha}) 0%, rgba(168,85,247,0) 72%)`
    return `radial-gradient(circle, rgba(16,185,129,${alpha}) 0%, rgba(16,185,129,0) 72%)`
  }

  return (
    <div className="min-h-screen bg-[#f7f8f6] text-slate-900 lg:flex">
      <Sidebar active={active} onChange={setActive} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button aria-label="Abrir menú" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setMenuOpen(true)}><Menu size={20} /></button>
            <div className="hidden items-center gap-2 text-xs text-slate-400 sm:flex">
              <span>Observatorio</span><span>/</span><span className="font-medium text-slate-700">{active}</span>
            </div>
            <span className="text-sm font-semibold text-slate-800 sm:hidden">E.E.S.T. N.º 6</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-600">{user.username}</span>
            <button onClick={onLogout} aria-label="Cerrar sesión" title="Cerrar sesión" className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"><LogOut size={17} /></button>
            <div aria-hidden="true" className="flex size-8 items-center justify-center rounded-full bg-[#e8efe9] text-xs font-semibold uppercase text-[#174b38]">{user.username.slice(0, 2)}</div>
          </div>
        </header>

        <div className="mx-auto max-w-[1320px] px-4 py-7 md:px-8 md:py-9">
          {/* SECCIÓN 1: INICIO */}
          {active === 'Inicio' && (
            <>
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#56816a]">Ciclo 2026 · Tercera Jornada</p>
                  <h1 className="mt-2 text-[26px] font-semibold tracking-tight text-slate-900 md:text-[30px]">Construir convivencia</h1>
                  <p className="mt-1.5 text-sm text-slate-500">Escuchar, reconocer y transformar · Panel Directivo</p>
                </div>
                <button onClick={() => { setActive('Biblioteca de mapas'); setShowUpload(true) }} className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg bg-[#174b38] px-4 text-xs font-semibold text-white shadow-sm hover:bg-[#103b2c] sm:self-auto">
                  <Plus size={16} /> Cargar mapa <ArrowRight size={14} />
                </button>
              </div>

              {dataError ? (
                <div role="alert" className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
                  <AlertCircle className="mt-0.5 shrink-0 text-amber-700" size={17} />
                  <div>
                    <p className="text-xs font-semibold text-amber-900">Aviso de conexión</p>
                    <p className="mt-1 text-xs text-amber-800">{dataError}</p>
                  </div>
                </div>
              ) : (
                <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#dce9df] bg-[#f3f8f4] px-4 py-3.5">
                  <ShieldCheck className="mt-0.5 shrink-0 text-[#356b4f]" size={17} />
                  <div>
                    <p className="text-xs font-semibold text-[#174b38]">Conectado a Google Sheets y Drive institucional</p>
                    <p className="mt-1 text-xs text-slate-600">Lectura automática de mapas, análisis de 13 preguntas y matrices de jornada en vivo.</p>
                  </div>
                </div>
              )}

              <section aria-label="Indicadores institucionales" className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Mapas cargados" value={stats ? String(stats.totalMapas) : '…'} detail="Planos subidos por los cursos" icon={FileImage} tone="bg-[#eef4ef] text-[#356b4f]" />
                <MetricCard label="Análisis (13 preguntas)" value={analisisList ? String(analisisList.length) : '…'} detail="Reflexiones colectivas enviadas" icon={MessageSquareText} tone="bg-[#f5f1e6] text-[#9a7830]" />
                <MetricCard label="Puntos críticos (3ra J.)" value={registrosList ? String(registrosList.length) : '…'} detail="Filas de matriz cargadas" icon={ClipboardList} tone="bg-[#eef2f7] text-[#526b8b]" />
                <MetricCard label="Acciones Agenda 2027" value={agendaList ? String(agendaList.length) : '…'} detail="Compromisos institucionales" icon={CalendarDays} tone="bg-[#f2eff6] text-[#735d8d]" />
              </section>

              <section className="mt-7 grid gap-5 md:grid-cols-3">
                <button onClick={() => setActive('Biblioteca de mapas')} className="rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:border-[#56816a] hover:shadow-sm">
                  <BookOpen size={20} className="text-[#174b38]" />
                  <h2 className="mt-3 text-sm font-semibold">1. Ver todos los mapas ({maps?.length ?? 0})</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Visualizar los planos cargados por cada división y turno.</p>
                </button>
                <button onClick={() => setActive('Análisis institucional')} className="rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:border-[#56816a] hover:shadow-sm">
                  <Activity size={20} className="text-[#174b38]" />
                  <h2 className="mt-3 text-sm font-semibold">2. Mapas de calor y gráficos</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Explorar lo que más resalta por curso o en toda la escuela.</p>
                </button>
                <button onClick={() => setActive('3ra Jornada: Del Mapa a la Acción')} className="rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:border-[#56816a] hover:shadow-sm">
                  <ClipboardList size={20} className="text-[#174b38]" />
                  <h2 className="mt-3 text-sm font-semibold">3. Matriz y Muro de cierre ({muroList?.length ?? 0})</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Ver desafíos persistentes y frases &ldquo;En nuestra escuela logramos...&rdquo;.</p>
                </button>
              </section>
            </>
          )}

          {/* SECCIÓN 2: BIBLIOTECA DE MAPAS */}
          {active === 'Biblioteca de mapas' && (
            <>
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#56816a]">Consolidado de toda la escuela</p>
                  <h1 className="mt-2 text-[26px] font-semibold tracking-tight">Biblioteca de mapas ({visibleMaps.length})</h1>
                  <p className="mt-1.5 text-sm text-slate-500">Planos relevados por todos los cursos y turnos.</p>
                </div>
                <button onClick={() => setShowUpload(true)} className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg bg-[#174b38] px-4 text-xs font-semibold text-white hover:bg-[#103b2c] sm:self-auto">
                  <CloudUpload size={16} /> Cargar mapa
                </button>
              </div>

              <div className="mt-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row">
                <label className="relative flex flex-1 items-center">
                  <Search size={16} className="absolute left-3 text-slate-400" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por curso (ej. 3°5°), turno o plano..." className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-[#7da58a]" />
                </label>
                <select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700">
                  <option value="TODOS">Todos los planos</option>
                  {PLANOS_ESCUELA.map((s) => <option key={s.id} value={s.id}>{s.id}</option>)}
                </select>
              </div>

              {visibleMaps.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-xs text-slate-500">
                  No hay mapas cargados con ese filtro todavía.
                </div>
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {visibleMaps.map((item) => {
                    const imageSrc = `/api/observatory?action=mapImage&idMapa=${encodeURIComponent(item.ID_MAPA)}`
                    const cleanDesc = cleanDescriptionText(item.DESCRIPCION)
                    return (
                      <button
                        key={item.ID_MAPA}
                        onClick={() => setSelectedImage(imageSrc)}
                        className="overflow-hidden rounded-xl border border-slate-200 bg-white text-left transition hover:border-[#b8cbbd] hover:shadow-md"
                      >
                        <div className="flex aspect-[1.7/1] items-center justify-center bg-slate-100">
                          <img src={imageSrc} alt={item.TITULO} className="h-full w-full object-contain" />
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-xs font-semibold text-slate-900">{item.TITULO}</h3>
                            <span className="shrink-0 rounded-full bg-[#edf4ef] px-2 py-0.5 text-[10px] font-semibold text-[#174b38]">{item.DIVISION}</span>
                          </div>
                          <p className="mt-1.5 text-[11px] text-slate-500">Turno {item.TURNO} · {item.FECHA_CARGA ? new Date(item.FECHA_CARGA).toLocaleDateString('es-AR') : '—'}</p>
                          {cleanDesc && <p className="mt-2 line-clamp-2 text-[11px] text-slate-600">{cleanDesc}</p>}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* SECCIÓN 3: ANÁLISIS INSTITUCIONAL (HEATMAP AUTOMÁTICO + GRÁFICOS) */}
          {active === 'Análisis institucional' && (
            <div className="space-y-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#56816a]">E.E.S.T. N.º 6 · Detección Automática sobre Planos</p>
                  <h1 className="mt-2 text-[26px] font-semibold tracking-tight">Análisis institucional</h1>
                  <p className="mt-1.5 text-sm text-slate-500">Mapas de calor generados automáticamente a partir de los símbolos detectados en las entregas.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500">Curso:</span>
                  <select value={divisionFilter} onChange={(e) => setDivisionFilter(e.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-[#174b38]">
                    <option value="TODAS">Todos los cursos (Escuela completa)</option>
                    {courses.map((c) => <option key={c.ID_CURSO} value={c.DIVISION}>{c.DIVISION} · {c.TURNO}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
                {/* Mapa de calor real */}
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                      <Flame size={18} className="text-amber-600" />
                      <div>
                        <h2 className="text-sm font-bold text-slate-900">Mapa de calor por plano</h2>
                        <p className="text-[11px] text-slate-500">Concentración real de símbolos detectados ({divisionFilter === 'TODAS' ? 'Toda la escuela' : divisionFilter})</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-[#edf4ef] px-3 py-1 text-xs font-bold text-[#174b38]">
                      {activePlanoCount} {activePlanoCount === 1 ? 'mapa' : 'mapas'}
                    </span>
                  </div>

                  {/* Selector de los 5 planos */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {resumenPorPlano.map((pl) => (
                      <button
                        key={pl.id}
                        type="button"
                        onClick={() => setHeatmapPlano(pl.id)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                          heatmapPlano === pl.id
                            ? 'border-[#174b38] bg-[#174b38] text-white'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {pl.short} ({pl.count})
                      </button>
                    ))}
                  </div>

                  {/* Filtro rápido por tipo de símbolo */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {[
                      { id: 'ALL', label: 'Todos los símbolos' },
                      { id: 'cuidado', label: '🟢 Cuidado' },
                      { id: 'transicion', label: '🟡 Transición' },
                      { id: 'riesgo', label: '🔴 Tensión / Riesgo' },
                      { id: 'dialogo', label: '💬 Diálogo / Digital' },
                      { id: 'produccion', label: '🎨 Producciones' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setHeatmapCategory(cat.id as typeof heatmapCategory)}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                          heatmapCategory === cat.id
                            ? 'bg-slate-800 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <img src={activePlanoObj.img} alt={activePlanoObj.id} className="w-full object-contain" />
                    {activePlanHotspots.map((spot, idx) => {
                      const size = 65 + spot.weight * 14
                      return (
                        <div
                          key={idx}
                          style={{
                            left: `${spot.x}%`,
                            top: `${spot.y}%`,
                            width: `${size}px`,
                            height: `${size}px`,
                            transform: 'translate(-50%, -50%)',
                            background: getHotspotGradient(spot.category, spot.weight),
                          }}
                          className="pointer-events-none absolute rounded-full blur-[3px]"
                        />
                      )
                    })}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/90 px-4 py-2.5 text-[11px] text-slate-600">
                      <span className="font-semibold">{activePlanoObj.id}</span>
                      <span>{activePlanHotspots.length} zonas detectadas</span>
                    </div>
                  </div>
                </section>

                {/* Gráficos de barras resumidos */}
                <div className="space-y-5">
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-bold text-slate-900">Símbolos detectados automáticamente</h2>
                    <p className="mt-0.5 text-[11px] text-slate-500">Conteo automático extraído de los planos subidos</p>
                    <div className="mt-4 space-y-3">
                      {resumenSimbolos.map((ic) => {
                        const pct = ic.count > 0 ? Math.max(10, Math.round((ic.count / maxSimboloCount) * 100)) : 3
                        return (
                          <div key={ic.id}>
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-slate-700">{ic.emoji} {ic.label}</span>
                              <span className="font-bold text-[#174b38]">{ic.count}</span>
                            </div>
                            <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                              <div
                                style={{ width: `${pct}%` }}
                                className={`h-full rounded-full transition-all ${ic.count > 0 ? 'bg-[#174b38]' : 'bg-slate-200'}`}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-bold text-slate-900">Mapas cargados por sector</h2>
                    <p className="mt-0.5 text-[11px] text-slate-500">Distribución por edificio y planta</p>
                    <div className="mt-4 space-y-3">
                      {resumenPorPlano.map((pl) => {
                        const pct = pl.count > 0 ? Math.max(10, Math.round((pl.count / maxPlanoCount) * 100)) : 3
                        return (
                          <div key={pl.id}>
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-slate-700">{pl.id}</span>
                              <span className="font-bold text-[#356b4f]">{pl.count}</span>
                            </div>
                            <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                              <div
                                style={{ width: `${pct}%` }}
                                className={`h-full rounded-full transition-all ${pl.count > 0 ? 'bg-[#56816a]' : 'bg-slate-200'}`}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                </div>
              </div>

              {/* Reflexiones de las 13 preguntas */}
              <section>
                <h2 className="mb-3 text-base font-semibold text-slate-900">Reflexiones colectivas de las 13 preguntas ({filteredAnalisis.length})</h2>
                {filteredAnalisis.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-xs text-slate-500">
                    Aún no hay respuestas cargadas en el cuestionario de 13 preguntas para esta selección.
                  </div>
                ) : (
                  <div className="space-y-5">
                    {filteredAnalisis.map((item, idx) => (
                      <article key={item.ID_ANALISIS || idx} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                          <div>
                            <span className="rounded-full bg-[#174b38] px-3 py-1 text-xs font-semibold text-white">{item.DIVISION} · Turno {item.TURNO}</span>
                            <span className="ml-2 text-xs text-slate-400">{item.FECHA_HORA ? new Date(item.FECHA_HORA).toLocaleString('es-AR') : ''}</span>
                          </div>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">{item.ESTADO}</span>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          {PREGUNTAS_LABELS.map((p) => {
                            const answer = item[p.key]
                            if (!answer) return null
                            return (
                              <div key={p.key} className="rounded-xl bg-[#fafaf8] p-3.5">
                                <p className="text-[11px] font-semibold text-[#174b38]">{p.label}</p>
                                <p className="mt-1 text-xs leading-5 text-slate-700">{answer}</p>
                              </div>
                            )
                          })}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* SECCIÓN 4: 3RA JORNADA DEL MAPA A LA ACCIÓN */}
          {active === '3ra Jornada: Del Mapa a la Acción' && (
            <>
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#56816a]">E.E.S.T. N.º 6 · Seguimiento y Cierre</p>
                  <h1 className="mt-2 text-[26px] font-semibold tracking-tight">3ra Jornada: Del Mapa a la Acción</h1>
                  <p className="mt-1.5 text-sm text-slate-500">Matriz institucional consolidada y cartelera de logros.</p>
                </div>
                <select value={divisionFilter} onChange={(e) => setDivisionFilter(e.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium">
                  <option value="TODAS">Todos los cursos</option>
                  {courses.map((c) => <option key={c.ID_CURSO} value={c.DIVISION}>{c.DIVISION} ({c.TURNO})</option>)}
                </select>
              </div>

              <section className="mt-6 rounded-2xl border border-[#dce9df] bg-[#f3f8f4] p-6">
                <div className="flex items-center gap-2 text-[#174b38]">
                  <MessageSquareQuote size={18} />
                  <h2 className="text-sm font-bold">Muro colectivo: &ldquo;En nuestra escuela logramos...&rdquo; ({muroList?.length ?? 0})</h2>
                </div>
                {!muroList || muroList.length === 0 ? (
                  <p className="mt-3 text-xs text-slate-600">Todavía ningún curso envió su frase de cierre.</p>
                ) : (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {muroList.map((m) => (
                      <div key={m.ID_FRASE} className="rounded-xl border border-[#dce9df] bg-white p-4">
                        <span className="rounded-full bg-[#174b38] px-2.5 py-0.5 text-[10px] font-semibold text-white">{m.DIVISION} · {m.TURNO}</span>
                        <p className="mt-2.5 text-xs font-medium leading-5 text-slate-800">&ldquo;{m.FRASE_LOGRAMOS}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-4">
                  <h2 className="text-sm font-semibold">Matriz consolidada por curso ({filteredRegistros.length} registros)</h2>
                </div>
                {filteredRegistros.length === 0 ? (
                  <p className="p-8 text-center text-xs text-slate-500">Aún no hay registros cargados en la matriz.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Curso</th>
                          <th className="px-4 py-3">Situación identificada</th>
                          <th className="px-4 py-3">Acciones realizadas</th>
                          <th className="px-4 py-3">Cambios observados</th>
                          <th className="px-4 py-3">Desafíos 2027</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredRegistros.map((r) => (
                          <tr key={r.ID_REGISTRO} className="align-top hover:bg-slate-50/70">
                            <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-[#174b38]">{r.DIVISION}<br /><span className="text-[10px] font-normal text-slate-400">{r.TURNO}</span></td>
                            <td className="px-4 py-3.5 text-slate-800">{r.SITUACION_IDENTIFICADA}</td>
                            <td className="px-4 py-3.5 text-slate-600">{r.ACCIONES_REALIZADAS}</td>
                            <td className="px-4 py-3.5 text-slate-600">{r.CAMBIOS_OBSERVADOS}</td>
                            <td className="px-4 py-3.5 font-medium text-slate-800">{r.DESAFIOS_PERSISTENTES}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}

          {/* SECCIÓN 5: AGENDA INSTITUCIONAL 2027 */}
          {active === 'Agenda institucional 2027' && (
            <>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#56816a]">Acuerdos Institucionales</p>
                <h1 className="mt-2 text-[26px] font-semibold tracking-tight">Agenda institucional 2027</h1>
                <p className="mt-1.5 text-sm text-slate-500">Registrá las líneas de acción y compromisos surgidos de la jornada para el próximo ciclo lectivo.</p>
              </div>

              <form onSubmit={handleCreatePropuesta} className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold">Nueva acción / compromiso 2027</h2>
                {propMsg && <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-[#edf4ef] px-3 py-2 text-xs font-medium text-[#174b38]"><CheckCircle2 size={15} /> {propMsg}</p>}
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
                    Título de la propuesta
                    <input required value={propTitulo} onChange={(e) => setPropTitulo(e.target.value)} placeholder="Ej. Acondicionamiento del patio y espacios de encuentro" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
                      Responsable
                      <input value={propResponsable} onChange={(e) => setPropResponsable(e.target.value)} placeholder="Ej. Equipo Directivo / EOE" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
                      Prioridad
                      <select value={propPrioridad} onChange={(e) => setPropPrioridad(e.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm">
                        <option value="ALTA">Alta</option>
                        <option value="MEDIA">Media</option>
                        <option value="BAJA">Baja</option>
                      </select>
                    </label>
                  </div>
                  <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
                    Situación a transformar
                    <textarea rows={2} value={propSituacion} onChange={(e) => setPropSituacion(e.target.value)} placeholder="Problemática detectada en los mapas y cuestionarios..." className="rounded-lg border border-slate-200 p-2.5 text-sm" />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
                    Acción concreta propuesta
                    <textarea rows={2} value={propAccion} onChange={(e) => setPropAccion(e.target.value)} placeholder="Qué se va a implementar en 2027..." className="rounded-lg border border-slate-200 p-2.5 text-sm" />
                  </label>
                </div>
                <div className="mt-4 flex justify-end">
                  <button disabled={savingProp} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#174b38] px-5 text-xs font-semibold text-white hover:bg-[#103b2c] disabled:opacity-50">
                    {savingProp ? <LoaderCircle className="animate-spin" size={15} /> : <Plus size={15} />} Guardar en Agenda 2027
                  </button>
                </div>
              </form>

              <div className="mt-6 space-y-3">
                {(agendaList ?? []).map((item) => (
                  <article key={item.ID_PROPUESTA} className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-[#edf4ef] px-2.5 py-0.5 text-[10px] font-bold text-[#174b38]">{item.PRIORIDAD}</span>
                        <h3 className="text-sm font-semibold text-slate-900">{item.TITULO}</h3>
                      </div>
                      {item.SITUACION_A_TRANSFORMAR && <p className="mt-1.5 text-xs text-slate-500"><strong>Situación:</strong> {item.SITUACION_A_TRANSFORMAR}</p>}
                      {item.ACCION_PROPUESTA && <p className="mt-1 text-xs text-slate-700"><strong>Acción:</strong> {item.ACCION_PROPUESTA}</p>}
                      {item.RESPONSABLE && <p className="mt-1 text-[11px] text-slate-400">Responsable: {item.RESPONSABLE}</p>}
                    </div>
                    <select
                      value={item.ESTADO}
                      onChange={(e) => handleToggleEstadoPropuesta(item.ID_PROPUESTA, e.target.value)}
                      className="h-9 self-start rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 sm:self-center"
                    >
                      <option value="PENDIENTE">PENDIENTE</option>
                      <option value="EN_CURSO">EN CURSO</option>
                      <option value="CUMPLIDA">CUMPLIDA</option>
                    </select>
                  </article>
                ))}
                {(!agendaList || agendaList.length === 0) && (
                  <p className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-xs text-slate-500">Todavía no hay propuestas cargadas en la Agenda 2027.</p>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {selectedImage && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4" onClick={() => setSelectedImage(null)}>
          <button className="absolute right-5 top-5 rounded-full bg-white/15 p-2 text-white hover:bg-white/25" aria-label="Cerrar"><X size={20} /></button>
          <div className="flex max-h-[85vh] max-w-5xl items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage} alt="Mapa ampliado" className="max-h-[85vh] max-w-full rounded-lg object-contain" />
          </div>
        </div>
      )}

      {showUpload && <UploadDialog onClose={() => setShowUpload(false)} courses={courses} onUploaded={onUploaded} />}
    </div>
  )
}

function UploadDialog({ onClose, courses, onUploaded }: { onClose: () => void; courses: PortalCourse[]; onUploaded: () => Promise<void> }) {
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [sectorPlano, setSectorPlano] = useState(PLANOS_ESCUELA[0].id)
  const [date, setDate] = useState(new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10))

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!file) { setError('Seleccioná una imagen PNG o JPG.'); return }
    const course = JSON.parse(selectedCourse || 'null')
    if (!course?.curso || !course?.division) { setError('Seleccioná un curso válido.'); return }
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
          payload: { ...course, sectorPlano, fechaMapeo: date, titulo: sectorPlano, base64Data, fileName: file.name, mimeType: file.type },
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'No se pudo guardar el mapa.')
      await onUploaded()
      onClose()
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'No se pudo guardar el mapa.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" onClick={onClose}>
      <section className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">Cargar mapa de convivencia</h2>
            <p className="mt-1 text-xs text-slate-500">Carga directa desde equipo directivo</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
        </div>
        {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</div>}
        <form onSubmit={submit} className="mt-4 space-y-4">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
            Curso y división
            <select required value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs">
              <option value="">Seleccionar curso</option>
              {courses.map((c) => (
                <option key={c.ID_CURSO} value={JSON.stringify({ curso: c.CURSO, division: c.DIVISION, turno: c.TURNO })}>
                  {c.DIVISION} · {c.TURNO}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
              Plano / Título
              <select value={sectorPlano} onChange={(e) => setSectorPlano(e.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs">
                {PLANOS_ESCUELA.map((s) => <option key={s.id} value={s.id}>{s.id}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
              Fecha del mapeo
              <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-xs" />
            </label>
          </div>
          <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center hover:bg-slate-100">
            <input type="file" accept="image/png,image/jpeg" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <FileImage size={21} className="text-slate-400" />
            <span className="mt-2 text-xs font-medium text-slate-700">{file?.name || 'Seleccionar una imagen PNG o JPG'}</span>
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-medium text-slate-600">Cancelar</button>
            <button type="submit" disabled={submitting} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#174b38] px-4 text-xs font-semibold text-white">
              {submitting ? 'Enviando…' : 'Guardar mapa'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
