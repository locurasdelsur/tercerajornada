'use client'

import { type FormEvent, useMemo, useState } from 'react'
import Image from 'next/image'
import {
  Activity, AlertCircle, Archive, ArrowDownToLine, ArrowRight, BookOpen,
  CalendarDays, ChevronDown, CircleHelp, ClipboardList, CloudUpload,
  FileImage, Filter, LayoutDashboard, Menu, MessageSquareText,
  MoreHorizontal, Plus, Search, LogOut, ShieldCheck, Users, X,
} from 'lucide-react'

type Section = 'Inicio' | 'Biblioteca de mapas' | 'Análisis institucional' | '3ra Jornada: Del Mapa a la Acción' | 'Agenda institucional 2027'

const navItems: { label: Section; icon: typeof LayoutDashboard }[] = [
  { label: 'Inicio', icon: LayoutDashboard },
  { label: 'Biblioteca de mapas', icon: BookOpen },
  { label: 'Análisis institucional', icon: Activity },
  { label: '3ra Jornada: Del Mapa a la Acción', icon: ClipboardList },
  { label: 'Agenda institucional 2027', icon: CalendarDays },
]

const references = [
  {
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-TpXfbgOxjasK1hu7JF1qlkXDA2DwAz.png',
    title: 'Mapa de convivencia · ejemplo 01',
    note: 'Plano escolar intervenido con símbolos de diálogo, cuidado y alerta.',
  },
  {
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-vjV3LiV3EPNVuqf94Ys20RkzksQvYz.png',
    title: 'Mapa de convivencia · ejemplo 02',
    note: 'Plano con marcas visuales para reconocer vínculos y espacios.',
  },
]

function Sidebar({ active, onChange, open, onClose }: { active: Section; onChange: (value: Section) => void; open: boolean; onClose: () => void }) {
  return (
    <>
      {open && <button aria-label="Cerrar menú" className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col border-r border-slate-200 bg-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[92px] items-center gap-3 border-b border-slate-100 px-5">
          <Image src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-FSJVc7cMySTJm8LqhqvGTmua4KQhzg.png" alt="Escudo de la E.E.S.T. N.º 6 Ing. J. V. P. de Banfield" width={58} height={58} unoptimized className="size-[58px] shrink-0 object-contain" />
          <div><p className="text-[13px] font-bold tracking-wide text-slate-900">OBSERVATORIO</p><p className="text-[11px] leading-4 text-slate-500">E.E.S.T. N.º 6 · Banfield<br />Lomas de Zamora</p></div>
          <button className="ml-auto rounded-md p-1 text-slate-400 lg:hidden" onClick={onClose} aria-label="Cerrar navegación"><X size={18} /></button>
        </div>
        <div className="px-4 pt-7"><p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Espacio institucional</p>
          <nav aria-label="Navegación principal" className="flex flex-col gap-1">
            {navItems.map(({ label, icon: Icon }) => <button key={label} onClick={() => { onChange(label); onClose() }} className={`flex min-h-10 items-center gap-3 rounded-lg px-3 text-left text-[13px] transition ${active === label ? 'bg-[#edf4ef] font-semibold text-[#174b38]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}><Icon size={17} strokeWidth={1.8} /><span className="leading-5">{label}</span>{active === label && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#397356]" />}</button>)}
          </nav>
        </div>
        <div className="mt-auto p-4">
          <div className="rounded-xl border border-[#e2eae4] bg-[#f6f9f6] p-4">
            <div className="flex items-center gap-2 text-[#174b38]"><ShieldCheck size={16} /><span className="text-xs font-semibold">Privacidad primero</span></div>
            <p className="mt-2 text-[11px] leading-5 text-slate-500">Los mapas se mantienen privados hasta su revisión y publicación.</p>
          </div>
          <button className="mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs text-slate-500 hover:bg-slate-50"><CircleHelp size={16} /> Ayuda y orientación</button>
        </div>
      </aside>
    </>
  )
}

function MetricCard({ label, value, detail, icon: Icon, tone }: { label: string; value: string; detail: string; icon: typeof Users; tone: string }) {
  return <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.03)]"><div className="flex items-start justify-between"><p className="text-[12px] font-medium text-slate-500">{label}</p><span className={`flex size-9 items-center justify-center rounded-lg ${tone}`}><Icon size={17} /></span></div><p className="mt-4 text-[28px] font-semibold tracking-tight text-slate-900">{value}</p><p className="mt-1 text-[11px] text-slate-400">{detail}</p></article>
}

function EmptyPanel({ title, children, icon: Icon = AlertCircle }: { title: string; children: string; icon?: typeof AlertCircle }) {
  return <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-8 text-center"><span className="flex size-10 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm"><Icon size={18} /></span><h3 className="mt-3 text-sm font-semibold text-slate-700">{title}</h3><p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">{children}</p></div>
}

type PortalUser = { id: string; username: string; role: string; course: string; division: string; shift: string }
type PortalStats = { totalCursosActivos: number; totalMapas: number; totalPuntosCriticos: number; totalPropuestas2027: number; mapasPorEstado: Record<string, number> }
type PortalMap = { ID_MAPA: string; FECHA_CARGA: string; FECHA_MAPEO: string; CURSO: string; DIVISION: string; TURNO: string; TITULO: string; DESCRIPCION: string; ESTADO_REVISION: string; PUBLICADO: string; NOMBRE_ARCHIVO: string }
type PortalCourse = { ID_CURSO: string; CURSO: string; DIVISION: string; TURNO: string }

export function ObservatoryApp({ user, stats, maps, courses = [], driveReady, dataError, onUploaded, onLogout }: { user: PortalUser; stats?: PortalStats; maps?: PortalMap[]; courses?: PortalCourse[]; driveReady: boolean; dataError?: string; onUploaded: () => Promise<void>; onLogout: () => void }) {
  const [active, setActive] = useState<Section>('Inicio')
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const visibleReferences = useMemo(() => references.filter((item) => `${item.title} ${item.note}`.toLowerCase().includes(query.toLowerCase())), [query])
  const visibleMaps = useMemo(() => (maps ?? []).filter((item) => `${item.TITULO} ${item.CURSO} ${item.DIVISION} ${item.ESTADO_REVISION}`.toLowerCase().includes(query.toLowerCase())), [maps, query])
  const ConnectionIcon = driveReady ? ShieldCheck : AlertCircle

  return <div className="min-h-screen bg-[#f7f8f6] text-slate-900 lg:flex">
    <Sidebar active={active} onChange={setActive} open={menuOpen} onClose={() => setMenuOpen(false)} />
    <main className="min-w-0 flex-1">
      <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur md:px-8">
        <div className="flex items-center gap-3"><button aria-label="Abrir menú" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setMenuOpen(true)}><Menu size={20} /></button><div className="hidden items-center gap-2 text-xs text-slate-400 sm:flex"><span>Observatorio</span><span>/</span><span className="font-medium text-slate-700">{active}</span></div><span className="text-sm font-semibold text-slate-800 sm:hidden">E.E.S.T. N.º 6</span></div>
        <div className="flex items-center gap-3"><span className="hidden text-xs text-slate-500 md:inline">{user.username}</span><button onClick={onLogout} aria-label="Cerrar sesión" title="Cerrar sesión" className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"><LogOut size={17} /></button><div aria-hidden="true" className="flex size-8 items-center justify-center rounded-full bg-[#e8efe9] text-xs font-semibold uppercase text-[#174b38]">{user.username.slice(0, 2)}</div></div>
      </header>
      <div className="mx-auto max-w-[1320px] px-4 py-7 md:px-8 md:py-9">
        {active === 'Inicio' ? <>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#56816a]">Ciclo 2026 · Segunda jornada</p><h1 className="mt-2 text-[26px] font-semibold tracking-tight text-slate-900 md:text-[30px]">Construir convivencia</h1><p className="mt-1.5 text-sm text-slate-500">Escuchar, reconocer y transformar.</p></div><button onClick={() => { setActive('Biblioteca de mapas'); setShowUpload(true) }} className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg bg-[#174b38] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#103b2c] sm:self-auto"><Plus size={16} /> Cargar mapa <ArrowRight size={14} /></button></div>
          {dataError ? <div role="alert" className="mt-7 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5"><AlertCircle className="mt-0.5 shrink-0 text-amber-700" size={17} /><div><p className="text-xs font-semibold text-amber-900">No se pudieron cargar algunos datos</p><p className="mt-1 text-xs leading-5 text-amber-800">{dataError}</p></div></div> : <div className={`mt-7 flex items-start gap-3 rounded-xl border px-4 py-3.5 ${driveReady ? 'border-[#dce9df] bg-[#f3f8f4]' : 'border-amber-200 bg-amber-50'}`}><ConnectionIcon className={`mt-0.5 shrink-0 ${driveReady ? 'text-[#356b4f]' : 'text-amber-700'}`} size={17} /><div><p className={`text-xs font-semibold ${driveReady ? 'text-[#174b38]' : 'text-amber-900'}`}>{driveReady ? 'Conectado a Google Sheets y Drive' : 'Google Sheets conectado; falta configurar Drive'}</p><p className="mt-1 text-xs leading-5 text-slate-600">{driveReady ? 'Los indicadores y mapas se consultan desde la base institucional con tu sesión.' : 'Las consultas de datos funcionan. Para habilitar la carga de imágenes, configura ROOT_FOLDER_ID en las propiedades de Apps Script.'}</p></div></div>}
          <section aria-label="Indicadores institucionales" className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Mapas cargados" value={stats ? String(stats.totalMapas) : '…'} detail="Registros de la base institucional" icon={FileImage} tone="bg-[#eef4ef] text-[#356b4f]" /><MetricCard label="Cursos activos" value={stats ? String(stats.totalCursosActivos) : '…'} detail="Cursos habilitados en el sistema" icon={Users} tone="bg-[#f5f1e6] text-[#9a7830]" /><MetricCard label="Registros de la jornada" value={stats ? String(stats.totalPuntosCriticos) : '…'} detail="Respuestas guardadas en Sheets" icon={MessageSquareText} tone="bg-[#eef2f7] text-[#526b8b]" /><MetricCard label="Acciones 2027" value={stats ? String(stats.totalPropuestas2027) : '…'} detail="Propuestas de la agenda institucional" icon={CalendarDays} tone="bg-[#f2eff6] text-[#735d8d]" /></section>
          <section className="mt-8 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
            <article className="rounded-xl border border-slate-200 bg-white p-5 md:p-6"><div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold">Estado de revisión de mapas</h2><p className="mt-1 text-xs text-slate-500">Resumen en tiempo real de los registros institucionales.</p></div><button onClick={() => setActive('Análisis institucional')} className="hidden items-center gap-1 text-xs font-medium text-[#356b4f] hover:underline sm:flex">Ver análisis <ArrowRight size={14} /></button></div>{stats ? <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{[['Pendientes', stats.mapasPorEstado.PENDIENTE], ['Aprobados', stats.mapasPorEstado.APROBADO], ['A corregir', stats.mapasPorEstado.REQUIERE_CORRECCION], ['Archivados', stats.mapasPorEstado.ARCHIVADO]].map(([label, value]) => <div key={String(label)} className="rounded-lg bg-slate-50 p-3"><p className="text-[11px] text-slate-500">{label}</p><p className="mt-1 text-xl font-semibold text-slate-800">{String(value ?? 0)}</p></div>)}</div> : <div className="mt-5"><EmptyPanel title="Cargando datos institucionales" icon={Activity}>Los indicadores se consultan de forma segura desde Google Sheets.</EmptyPanel></div>}</article>
            <article className="rounded-xl border border-slate-200 bg-white p-5 md:p-6"><div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold">Próxima etapa</h2><p className="mt-1 text-xs text-slate-500">Tercera Jornada Escolar de Convivencia</p></div><span className="rounded-full bg-[#f7f2e5] px-2.5 py-1 text-[10px] font-semibold text-[#91702b]">2026</span></div><div className="mt-5 rounded-xl bg-[#f5f8f5] p-4"><div className="flex items-center gap-2 text-[#356b4f]"><ClipboardList size={16} /><p className="text-xs font-semibold">Del mapa a la acción</p></div><p className="mt-2 text-xs leading-5 text-slate-600">Recuperar las situaciones identificadas, reconocer acciones realizadas y pensar los desafíos que siguen pendientes.</p><button onClick={() => setActive('3ra Jornada: Del Mapa a la Acción')} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#356b4f] hover:underline">Ir a la jornada <ArrowRight size={13} /></button></div><div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400"><Archive size={14} />Los registros se habilitarán con la conexión institucional.</div></article>
          </section>
          <section className="mt-8"><div className="mb-4 flex items-end justify-between"><div><h2 className="text-sm font-semibold">Así se ven los mapas de convivencia</h2><p className="mt-1 text-xs text-slate-500">Referencias visuales compartidas para orientar las futuras cargas.</p></div><button onClick={() => setActive('Biblioteca de mapas')} className="hidden text-xs font-medium text-[#356b4f] hover:underline sm:block">Abrir biblioteca</button></div><div className="grid gap-4 md:grid-cols-2">{references.map((item, i) => <button key={item.image} onClick={() => setSelected(item.image)} className="group overflow-hidden rounded-xl border border-slate-200 bg-white text-left transition hover:border-[#b8cbbd] hover:shadow-md"><div className="relative aspect-[2/1] overflow-hidden bg-slate-100"><Image src={item.image} alt={`Referencia visual ${i + 1}: ${item.note}`} fill unoptimized className="object-contain transition duration-300 group-hover:scale-[1.02]" sizes="(max-width: 768px) 100vw, 50vw" /><span className="absolute left-3 top-3 rounded-full border border-white/70 bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-slate-600">Referencia visual</span></div><div className="p-4"><div className="flex items-center justify-between"><h3 className="text-xs font-semibold">{item.title}</h3><MoreHorizontal size={16} className="text-slate-400" /></div><p className="mt-1.5 text-[11px] leading-5 text-slate-500">{item.note}</p></div></button>)}</div></section>
          <footer className="mt-8 border-t border-slate-200 pt-4 text-center text-[10px] text-slate-400">Observatorio de Convivencia · E.E.S.T. N.º 6 Ing. Juan V. Passalacqua</footer>
        </> : active === 'Biblioteca de mapas' ? <>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#56816a]">Imágenes de la comunidad</p><h1 className="mt-2 text-[26px] font-semibold tracking-tight">Biblioteca de mapas</h1><p className="mt-1.5 text-sm text-slate-500">Mapas enviados por estudiantes y revisados por el equipo directivo.</p></div><button onClick={() => setShowUpload(true)} className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg bg-[#174b38] px-4 text-xs font-semibold text-white hover:bg-[#103b2c] sm:self-auto"><CloudUpload size={16} /> Cargar mapa</button></div>
          <div className="mt-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row"><label className="relative flex flex-1 items-center"><Search size={16} className="absolute left-3 text-slate-400" /><input aria-label="Buscar en referencias" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar mapas..." className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-[#7da58a]" /></label><button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs text-slate-600"><Filter size={15} /> Filtros <ChevronDown size={14} /></button><button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs text-slate-600"><ArrowDownToLine size={15} /> Exportar</button></div>
          <div className="mt-5 flex items-center gap-2 rounded-lg border border-[#dce9df] bg-[#f3f8f4] px-4 py-3 text-xs text-[#174b38]"><ShieldCheck size={15} className="shrink-0" />Las entregas institucionales aparecen separadas de las referencias visuales compartidas.</div>
          {maps && maps.length > 0 && <section className="mt-6"><h2 className="mb-3 text-sm font-semibold">Entregas institucionales</h2><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visibleMaps.map((item) => { const imageSrc = `/api/observatory?action=mapImage&idMapa=${encodeURIComponent(item.ID_MAPA)}`; return <button key={item.ID_MAPA} onClick={() => setSelected(imageSrc)} className="overflow-hidden rounded-xl border border-slate-200 bg-white text-left transition hover:border-[#b8cbbd] hover:shadow-md"><div className="relative aspect-[1.7/1] bg-slate-100"><Image src={imageSrc} alt={`Mapa de convivencia: ${item.TITULO}`} fill unoptimized className="object-contain" sizes="(max-width: 768px) 100vw, 33vw" /></div><div className="p-4"><div className="flex items-start justify-between gap-2"><h3 className="text-xs font-semibold">{item.TITULO}</h3><span className="shrink-0 rounded-full bg-[#edf4ef] px-2 py-1 text-[9px] font-semibold text-[#356b4f]">{item.ESTADO_REVISION}</span></div><p className="mt-2 text-[11px] text-slate-500">{item.CURSO}° {item.DIVISION} · Turno {item.TURNO}</p><p className="mt-1 text-[10px] text-slate-400">Cargado {item.FECHA_CARGA ? new Date(item.FECHA_CARGA).toLocaleDateString('es-AR') : '—'}</p></div></button> })}</div></section>}
          {maps && maps.length === 0 && <div className="mt-5"><EmptyPanel title="Todavía no hay entregas institucionales" icon={FileImage}>Las imágenes de ejemplo que siguen son referencias visuales, no registros cargados en la hoja.</EmptyPanel></div>}
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visibleReferences.map((item, i) => <button key={item.image} onClick={() => setSelected(item.image)} className="overflow-hidden rounded-xl border border-slate-200 bg-white text-left hover:shadow-md"><div className="relative aspect-[1.7/1] bg-slate-100"><Image src={item.image} alt={`Referencia de mapa ${i + 1}`} fill unoptimized className="object-contain" sizes="(max-width: 768px) 100vw, 33vw" /></div><div className="p-4"><div className="flex items-center justify-between gap-2"><h2 className="text-xs font-semibold">{item.title}</h2><span className="whitespace-nowrap rounded-full bg-slate-100 px-2 py-1 text-[9px] font-medium text-slate-600">Ejemplo · no publicado</span></div><p className="mt-2 text-[11px] leading-5 text-slate-500">{item.note}</p></div></button>)}</div>
          {visibleReferences.length === 0 && visibleMaps.length === 0 && query && <EmptyPanel title="Sin coincidencias" icon={Search}>Prueba con otras palabras para buscar en las entregas y referencias visuales.</EmptyPanel>}
          {maps === undefined && <div className="mt-6"><EmptyPanel title="Cargando entregas institucionales" icon={FileImage}>Consultando los mapas con los permisos de tu sesión.</EmptyPanel></div>}
        </> : <SectionPlaceholder section={active} onBack={() => setActive('Inicio')} />}
      </div>
    </main>
    {selected && <div role="dialog" aria-modal="true" aria-label="Vista ampliada del mapa" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4" onClick={() => setSelected(null)}><button className="absolute right-5 top-5 rounded-full bg-white/15 p-2 text-white hover:bg-white/25" aria-label="Cerrar vista ampliada"><X size={20} /></button><div className="relative h-[80vh] w-full max-w-5xl" onClick={(event) => event.stopPropagation()}><Image src={selected} alt="Mapa de convivencia ampliado" fill unoptimized className="object-contain" sizes="100vw" /></div></div>}
    {showUpload && <UploadDialog onClose={() => setShowUpload(false)} user={user} courses={courses} driveReady={driveReady} onUploaded={onUploaded} />}
  </div>
}

function SectionPlaceholder({ section, onBack }: { section: Section; onBack: () => void }) {
  const content: Record<Exclude<Section, 'Inicio' | 'Biblioteca de mapas'>, { intro: string; action: string; icon: typeof ClipboardList }> = {
    'Análisis institucional': { intro: 'Comparar cursos y turnos a partir de los mapas y registros realmente cargados.', action: 'Los análisis se habilitarán al conectar los datos institucionales.', icon: Activity },
    '3ra Jornada: Del Mapa a la Acción': { intro: 'Situación identificada · Acciones realizadas · Cambios observados · Desafíos persistentes.', action: 'El formulario de envíos se habilitará con la validación de sesión y curso.', icon: ClipboardList },
    'Agenda institucional 2027': { intro: 'Organizar las propuestas institucionales surgidas del trabajo de convivencia.', action: 'La agenda se habilitará al conectar Google Sheets.', icon: CalendarDays },
  }
  const current = content[section as keyof typeof content]
  const Icon = current.icon
  return <><p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#56816a]">E.E.S.T. N.º 6</p><h1 className="mt-2 text-[26px] font-semibold tracking-tight">{section}</h1><p className="mt-1.5 text-sm text-slate-500">{current.intro}</p><div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5"><div className="flex items-center gap-2 text-amber-900"><AlertCircle size={17} /><h2 className="text-sm font-semibold">Pendiente de configuración</h2></div><p className="mt-2 text-xs leading-5 text-amber-900/80">{current.action}</p><p className="mt-2 text-xs text-amber-900/70">No se ha simulado ni guardado información. El backend debe validar los permisos antes de habilitar operaciones.</p></div><div className="mt-5"><EmptyPanel title="Sin datos para mostrar" icon={Icon}>Conecta el backend de Apps Script con Google Drive y Sheets para comenzar a trabajar con información institucional real.</EmptyPanel></div><button onClick={onBack} className="mt-5 text-xs font-semibold text-[#356b4f] hover:underline">Volver al inicio</button></>
}

function UploadDialog({ onClose, user, courses, driveReady, onUploaded }: { onClose: () => void; user: PortalUser; courses: PortalCourse[]; driveReady: boolean; onUploaded: () => Promise<void> }) {
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10))
  const isStudent = user.role === 'ESTUDIANTE'

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!driveReady) {
      setError('Falta configurar ROOT_FOLDER_ID en las propiedades de Apps Script.')
      return
    }
    if (!file) {
      setError('Seleccioná una imagen PNG o JPG.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('La imagen no puede superar los 10 MB.')
      return
    }
    const course = isStudent ? { curso: user.course, division: user.division, turno: user.shift } : JSON.parse(selectedCourse || 'null')
    if (!course?.curso || !course?.division || !course?.turno) {
      setError('Seleccioná un curso, división y turno válidos.')
      return
    }
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
        body: JSON.stringify({ action: 'subirMapa', payload: { ...course, fechaMapeo: date, titulo: title, base64Data, fileName: file.name, mimeType: file.type } }),
      })
      const result = await response.json() as { error?: string }
      if (!response.ok) throw new Error(result.error || 'No se pudo guardar el mapa.')
      await onUploaded()
      onClose()
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'No se pudo guardar el mapa.')
    } finally {
      setSubmitting(false)
    }
  }

  return <div role="dialog" aria-modal="true" aria-labelledby="upload-title" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" onClick={onClose}><section className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl md:p-7" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between"><div><span className="flex size-10 items-center justify-center rounded-xl bg-[#edf4ef] text-[#356b4f]"><CloudUpload size={20} /></span><h2 id="upload-title" className="mt-4 text-lg font-semibold">Cargar mapa de convivencia</h2><p className="mt-1 text-xs text-slate-500">Entrega del curso · segunda jornada 2026</p></div><button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button></div>
    {!driveReady && <div role="status" className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">Sheets está conectado, pero Drive todavía no tiene una carpeta raíz configurada. El envío se habilitará al completar `ROOT_FOLDER_ID` en Apps Script.</div>}
    {error && <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-800">{error}</div>}
    <form onSubmit={submit}><div className="mt-4 grid gap-4 sm:grid-cols-2">{!isStudent && <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700 sm:col-span-2">Curso, división y turno<select required value={selectedCourse} onChange={(event) => setSelectedCourse(event.target.value)} disabled={!driveReady || !courses.length} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs"><option value="">Seleccionar curso</option>{courses.map((course) => <option key={course.ID_CURSO} value={JSON.stringify({ curso: course.CURSO, division: course.DIVISION, turno: course.TURNO })}>{course.CURSO}° {course.DIVISION} · {course.TURNO}</option>)}</select></label>}
    {isStudent && <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 sm:col-span-2">Curso asignado a tu usuario: {user.course}° {user.division} · {user.shift}</p>}
    <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">Fecha del mapeo<input type="date" required value={date} onChange={(event) => setDate(event.target.value)} disabled={!driveReady} className="h-10 rounded-lg border border-slate-200 px-3 text-xs" /></label><label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">Título<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} placeholder="Ej. Mapa del aula" disabled={!driveReady} className="h-10 rounded-lg border border-slate-200 px-3 text-xs" /></label></div>
    <label className="mt-4 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center hover:bg-slate-100"><input type="file" accept="image/png,image/jpeg" className="sr-only" disabled={!driveReady} onChange={(event) => setFile(event.target.files?.[0] ?? null)} /><FileImage size={21} className="text-slate-400" /><span className="mt-2 text-xs font-medium text-slate-700">{file?.name || 'Seleccionar una imagen PNG o JPG'}</span><span className="mt-1 text-[10px] text-slate-400">Tamaño máximo: 10 MB</span></label>
    <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-medium text-slate-600 hover:bg-slate-50">Cancelar</button><button type="submit" disabled={!driveReady || submitting || (!isStudent && !courses.length)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#174b38] px-4 text-xs font-semibold text-white hover:bg-[#103b2c] disabled:cursor-not-allowed disabled:opacity-50">{submitting ? 'Enviando…' : 'Enviar mapa'}</button></div></form></section></div>
}
