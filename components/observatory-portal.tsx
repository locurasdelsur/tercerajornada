'use client'

import { type FormEvent, useState } from 'react'
import Image from 'next/image'
import useSWR, { useSWRConfig } from 'swr'
import { AlertCircle, LoaderCircle, LogIn } from 'lucide-react'
import { ObservatoryApp } from '@/components/observatory-app'
import { StudentPortal } from '@/components/student-portal'

type PortalUser = { id: string; username: string; role: string; course: string; division: string; shift: string }
type Course = { ID_CURSO: string; CURSO: string; DIVISION: string; TURNO: string; ACTIVO?: string }
type MapRecord = { ID_MAPA: string; FECHA_CARGA: string; FECHA_MAPEO: string; CURSO: string; DIVISION: string; TURNO: string; TITULO: string; DESCRIPCION: string; ESTADO_REVISION: string; PUBLICADO: string; NOMBRE_ARCHIVO: string }
type Stats = { totalCursosActivos: number; totalMapas: number; totalPuntosCriticos: number; totalPropuestas2027: number; mapasPorEstado: Record<string, number> }
type Diagnostic = { spreadsheetConnected: boolean; driveReady: boolean; missingSheets: string[] }
type ApiResponse<T> = { data: T; error?: string }

async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store' })
  const body = await response.json() as ApiResponse<T>
  if (!response.ok) throw Object.assign(new Error(body.error || 'No se pudo completar la solicitud.'), { status: response.status })
  return body.data
}

export function ObservatoryPortal() {
  const { data: session, error: sessionError, isLoading, mutate: refreshSession } = useSWR<{ user: PortalUser }>('/api/observatory?action=session', fetcher, { shouldRetryOnError: false, revalidateOnFocus: false })
  const isDirector = session?.user.role === 'DIRECTIVO'
  const { data: stats, error: statsError } = useSWR<Stats>(isDirector ? '/api/observatory?action=stats' : null, fetcher)
  const { data: maps, error: mapsError } = useSWR<MapRecord[]>(isDirector ? '/api/observatory?action=maps' : null, fetcher)
  const { data: courses, error: coursesError } = useSWR<Course[]>('/api/observatory?action=courses', fetcher)
  const { data: diagnostic } = useSWR<Diagnostic>(isDirector ? '/api/observatory?action=diagnostic' : null, fetcher)
  const { mutate: mutateData } = useSWRConfig()
  const [submitting, setSubmitting] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [logoutError, setLogoutError] = useState('')
  const [showDirectorLogin, setShowDirectorLogin] = useState(false)

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setLoginError('')
    const form = new FormData(event.currentTarget)
    try {
      const response = await fetch('/api/observatory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', payload: { usuario: form.get('usuario'), password: form.get('password') } }),
      })
      const body = await response.json() as ApiResponse<{ user: PortalUser }>
      if (!response.ok) throw new Error(body.error || 'No se pudo iniciar sesión.')
      await refreshSession()
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'No se pudo iniciar sesión.')
    } finally {
      setSubmitting(false)
    }
  }

  async function studentSignIn(name: string, course: Course) {
    const response = await fetch('/api/observatory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'studentLogin', payload: { nombre: name, curso: course.CURSO, division: course.DIVISION, turno: course.TURNO } }),
    })
    const body = await response.json() as ApiResponse<{ user: PortalUser }>
    if (!response.ok) throw new Error(body.error || 'No se pudo iniciar el recorrido.')
    await refreshSession()
  }

  async function signOut() {
    setLogoutError('')
    try {
      const response = await fetch('/api/observatory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) })
      if (!response.ok) throw new Error('No se pudo cerrar la sesión.')
      await refreshSession()
    } catch {
      setLogoutError('No se pudo cerrar la sesión. Volvé a intentarlo.')
    }
  }

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-[#f7f8f6]"><div className="flex items-center gap-3 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={18} />Verificando sesión institucional…</div></div>

  if (session?.user?.role === 'ESTUDIANTE') return <StudentPortal courses={courses || []} student={{ username: session.user.username, course: session.user.course, division: session.user.division, shift: session.user.shift }} onEnter={studentSignIn} onLogout={signOut} />

  if (session?.user) return <><ObservatoryApp user={session.user} stats={stats} maps={maps} courses={courses} driveReady={diagnostic?.driveReady ?? false} dataError={statsError?.message || mapsError?.message} onUploaded={async () => { await Promise.all([mutateData('/api/observatory?action=maps'), mutateData('/api/observatory?action=stats')]) }} onLogout={signOut} />{logoutError && <p role="alert" className="fixed bottom-4 right-4 rounded-lg bg-red-50 px-4 py-3 text-xs text-red-800 shadow-lg">{logoutError}</p>}</>

  return <>
    <StudentPortal courses={courses || []} loading={!courses && !sessionError} error={coursesError?.message} onEnter={studentSignIn} onLogout={signOut} />
    <div className="fixed bottom-4 right-4">
      <button onClick={() => setShowDirectorLogin((visible) => !visible)} className="rounded-full border border-slate-200 bg-white/95 px-4 py-2 text-[11px] font-medium text-slate-500 shadow-sm backdrop-blur hover:text-slate-800">{showDirectorLogin ? 'Cerrar acceso directivo' : 'Acceso directivos'}</button>
    </div>
    {showDirectorLogin && <div role="dialog" aria-modal="true" aria-labelledby="director-login-title" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" onClick={() => setShowDirectorLogin(false)}><section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8" onClick={(event) => event.stopPropagation()}>
      <div className="flex flex-col items-center text-center"><Image src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-FSJVc7cMySTJm8LqhqvGTmua4KQhzg.png" alt="Escudo de la E.E.S.T. N.º 6 de Banfield" width={64} height={64} unoptimized className="size-16 object-contain" /><p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#56816a]">Acceso restringido</p><h2 id="director-login-title" className="mt-2 text-xl font-semibold tracking-tight text-slate-900">Equipo directivo</h2><p className="mt-2 text-sm text-slate-500">Ingresá con tu usuario institucional.</p></div>
      {sessionError && sessionError.status !== 401 && <div role="alert" className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900"><AlertCircle size={15} className="mb-1" />{sessionError.message} Si el error menciona el secreto, verificá que `GAS_SHARED_SECRET` coincida con `APP_SHARED_SECRET` en Apps Script.</div>}
      {loginError && <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-800">{loginError}</div>}
      <form onSubmit={signIn} className="mt-5 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">Usuario<input name="usuario" autoComplete="username" required maxLength={120} className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#56816a] focus:ring-2 focus:ring-[#56816a]/15" placeholder="Tu usuario" /></label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">Contraseña<input name="password" type="password" autoComplete="current-password" required maxLength={256} className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#56816a] focus:ring-2 focus:ring-[#56816a]/15" placeholder="Tu contraseña" /></label>
        <button disabled={submitting} className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#174b38] text-sm font-semibold text-white transition hover:bg-[#103b2c] disabled:cursor-wait disabled:opacity-70">{submitting ? <LoaderCircle className="animate-spin" size={16} /> : <LogIn size={16} />}{submitting ? 'Verificando…' : 'Ingresar'}</button>
      </form>
      {sessionError && <button onClick={() => refreshSession()} className="mt-4 w-full text-center text-xs font-medium text-[#356b4f] hover:underline">Volver a verificar la conexión</button>}
    </section></div>}
  </>
}
