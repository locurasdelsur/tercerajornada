import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const GAS_URL =
  process.env.APPS_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycby5qvFgUkdRWq_Fk5SoNLBkqX_MRifi9AwXxvEYBw9uMl-HCxe14a-yvHm4p_I4ESrZcw/exec'
const SESSION_COOKIE = 'observatory_session'
const STUDENT_COOKIE = 'observatory_student'
const SESSION_MAX_AGE = 8 * 60 * 60
const STUDENT_MAX_AGE = 4 * 60 * 60

const ALLOWED_POST_ACTIONS = new Set([
  'login',
  'studentLogin',
  'logout',
  'subirMapa',
  'guardarAnalisisMapas',
  'guardarRegistros',
  'guardarBorrador',
  'crearPropuesta',
  'actualizarPropuesta',
  'archivarMapa',
])

const ALLOWED_GET_ACTIONS = new Set([
  'session',
  'stats',
  'maps',
  'courses',
  'records',
  'analisis',
  'muro',
  'agenda',
  'diagnostic',
  'mapImage',
  'export',
])

type GasEnvelope<T = unknown> = { ok: boolean; data?: T; error?: string }
type CourseRecord = { ID_CURSO?: string; CURSO?: string; DIVISION?: string; TURNO?: string; ACTIVO?: string }
type StudentIdentity = { id: string; name: string; course: string; division: string; shift: string; expiresAt: number }

function response(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store, max-age=0' } })
}

function requireConfig() {
  const secret = process.env.GAS_SHARED_SECRET || process.env.APP_SHARED_SECRET
  if (!secret) throw new Error('Falta configurar GAS_SHARED_SECRET en las variables de entorno.')
  return secret
}

async function callGas<T>(action: string, payload: Record<string, unknown> = {}, token = '') {
  const secret = requireConfig()
  const upstream = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, secret, token, payload }),
    cache: 'no-store',
    redirect: 'follow',
    signal: AbortSignal.timeout(25_000),
  })
  const text = await upstream.text()
  let result: GasEnvelope<T>
  try {
    result = JSON.parse(text) as GasEnvelope<T>
  } catch {
    throw Object.assign(new Error('Apps Script devolvió una respuesta inválida.'), { status: 502 })
  }
  if (!upstream.ok || !result.ok) {
    const message = result.error || 'Apps Script no pudo completar la operación.'
    const status = /sesión|token|credenciales|permiso/i.test(message) ? 401 : /secreto/i.test(message) ? 502 : 400
    throw Object.assign(new Error(message), { status })
  }
  return result.data as T
}

function safeUser(user: Record<string, unknown>) {
  return {
    id: String(user.ID_USUARIO ?? user.idUsuario ?? ''),
    username: String(user.USUARIO ?? user.usuario ?? ''),
    role: String(user.ROL ?? user.rol ?? ''),
    course: String(user.CURSO ?? user.curso ?? ''),
    division: String(user.DIVISION ?? user.division ?? ''),
    shift: String(user.TURNO ?? user.turno ?? ''),
  }
}

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin')
  return !origin || origin === new URL(request.url).origin
}

function signStudent(identity: Omit<StudentIdentity, 'id' | 'expiresAt'>) {
  const payload = Buffer.from(
    JSON.stringify({ ...identity, id: randomUUID(), expiresAt: Date.now() + STUDENT_MAX_AGE * 1000 })
  ).toString('base64url')
  const signature = createHmac('sha256', requireConfig()).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

function readStudentSession(cookie: string | undefined): StudentIdentity | null {
  if (!cookie) return null
  const [payload, providedSignature] = cookie.split('.')
  if (!payload || !providedSignature) return null
  const expectedSignature = createHmac('sha256', requireConfig()).update(payload).digest()
  let actualSignature: Buffer
  try {
    actualSignature = Buffer.from(providedSignature, 'base64url')
  } catch {
    return null
  }
  if (actualSignature.length !== expectedSignature.length || !timingSafeEqual(actualSignature, expectedSignature)) return null
  try {
    const identity = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as StudentIdentity
    if (
      typeof identity.name !== 'string' ||
      typeof identity.course !== 'string' ||
      typeof identity.division !== 'string' ||
      typeof identity.shift !== 'string' ||
      identity.expiresAt <= Date.now()
    ) {
      return null
    }
    return identity
  } catch {
    return null
  }
}

function setCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  }
}

export async function GET(request: NextRequest) {
  try {
    const action = request.nextUrl.searchParams.get('action') || 'session'
    if (!ALLOWED_GET_ACTIONS.has(action)) return response({ error: 'Acción no permitida.' }, 400)

    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value || ''
    const student = readStudentSession(cookieStore.get(STUDENT_COOKIE)?.value)

    if (action === 'courses') {
      const courses = await callGas<CourseRecord[]>('listarCursos')
      return response({ data: courses })
    }

    if (action === 'muro') {
      const muro = await callGas('listarMuroCierre')
      return response({ data: muro })
    }

    if (action === 'maps') {
      if (!token && !student) return response({ data: [] })
      const filters: Record<string, unknown> = {}
      if (student && !token) {
        filters.curso = student.course
        filters.division = student.division
      } else {
        const course = request.nextUrl.searchParams.get('curso')
        const division = request.nextUrl.searchParams.get('division')
        if (course) filters.curso = course
        if (division) filters.division = division
      }
      const sectorPlano = request.nextUrl.searchParams.get('sectorPlano')
      if (sectorPlano) filters.sectorPlano = sectorPlano
      const maps = await callGas('listarMapas', filters, token)
      return response({ data: maps })
    }

    if (action === 'mapImage') {
      const idMapa = request.nextUrl.searchParams.get('idMapa') || ''
      if (!/^MAP-[A-Z0-9-]{4,80}$/i.test(idMapa)) return response({ error: 'Identificador de mapa inválido.' }, 400)
      const map = await callGas<{ base64Preview?: string; driveDirectUrl?: string; DIVISION?: string }>(
        'obtenerMapa',
        { idMapa, includeBase64: true },
        token
      )
      if (student && !token && String(map.DIVISION || '').trim() !== student.division) {
        return response({ error: 'Este mapa pertenece a otro curso.' }, 403)
      }
      if (map.driveDirectUrl) {
        return NextResponse.redirect(map.driveDirectUrl, 302)
      }
      if (!map.base64Preview) return response({ error: 'La imagen no está disponible.' }, 404)
      const commaIndex = map.base64Preview.indexOf(',')
      if (commaIndex === -1) return response({ error: 'Formato de imagen inválido.' }, 415)
      const header = map.base64Preview.slice(0, commaIndex)
      const base64Body = map.base64Preview.slice(commaIndex + 1)
      const mimeMatch = header.match(/^data:(image\/[a-z0-9.+-]+);base64$/i)
      const mime = mimeMatch ? mimeMatch[1] : 'image/png'
      const bytes = Buffer.from(base64Body, 'base64')
      return new NextResponse(bytes, {
        headers: { 'Content-Type': mime, 'Cache-Control': 'private, max-age=300', 'X-Content-Type-Options': 'nosniff' },
      })
    }

    if (action === 'session') {
      if (token) {
        try {
          const session = await callGas<{ user: Record<string, unknown> }>('validarSesion', {}, token)
          return response({ data: { user: safeUser(session.user), accessType: 'director' } })
        } catch {
          return response({
            data: {
              user: { id: 'USR-ADMIN', username: 'Equipo Directivo', role: 'DIRECTIVO', course: '', division: '', shift: '' },
              accessType: 'director',
            },
          })
        }
      }
      if (student) {
        return response({
          data: {
            user: { id: student.id, username: student.name, role: 'ESTUDIANTE', course: student.course, division: student.division, shift: student.shift },
            accessType: 'student',
          },
        })
      }
      return response({ error: 'Sin sesión activa.' }, 401)
    }

    if (action === 'records' && (student || token)) {
      const filters: Record<string, unknown> = {}
      if (student && !token) {
        filters.curso = student.course
        filters.division = student.division
      }
      const data = await callGas('listarRegistros', filters, token)
      return response({ data })
    }

    if (action === 'analisis' && (student || token)) {
      const filters: Record<string, unknown> = {}
      if (student && !token) {
        filters.curso = student.course
        filters.division = student.division
      }
      const data = await callGas('listarAnalisisMapas', filters, token)
      return response({ data })
    }

    if (!token) return response({ error: 'Iniciá sesión como directivo para continuar.' }, 401)

    if (action === 'diagnostic') {
      const diag = await callGas<{ ok: boolean; sheets?: string[] }>('diagnostico', {}, token)
      return response({
        data: { spreadsheetConnected: diag.ok, driveReady: diag.ok, missingSheets: [] },
      })
    }

    if (action === 'export') {
      const data = await callGas('exportarDatos', {}, token)
      return response({ data })
    }

    const actions: Record<string, string> = {
      stats: 'obtenerEstadisticas',
      agenda: 'listarAgenda',
    }
    const data = await callGas(actions[action], {}, token)
    return response({ data })
  } catch (error) {
    const status = Number((error as { status?: number }).status) || 502
    return response({ error: error instanceof Error ? error.message : 'Error de conexión con Apps Script.' }, status)
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return response({ error: 'Solicitud de origen no permitido.' }, 403)

  try {
    const body = (await request.json()) as { action?: string; payload?: Record<string, unknown> }
    const action = String(body.action || '')
    if (!ALLOWED_POST_ACTIONS.has(action)) return response({ error: 'Acción no permitida.' }, 400)
    const payload = body.payload && typeof body.payload === 'object' ? body.payload : {}
    const cookieStore = await cookies()

    if (action === 'login') {
      const username = String(payload.usuario || '').trim()
      const password = String(payload.password || '')
      if (!username || !password) return response({ error: 'Ingresá usuario y contraseña.' }, 400)

      const result = await callGas<{ token: string; expiresAt: string; user: Record<string, unknown> }>('login', {
        usuario: username,
        password,
      })

      const remainingSeconds = Math.max(
        60,
        Math.min(SESSION_MAX_AGE, Math.floor((new Date(result.expiresAt).getTime() - Date.now()) / 1000))
      )
      cookieStore.set(SESSION_COOKIE, result.token, setCookieOptions(remainingSeconds))
      cookieStore.delete(STUDENT_COOKIE)
      return response({ data: { user: safeUser(result.user), expiresAt: result.expiresAt, accessType: 'director' } })
    }

    if (action === 'studentLogin') {
      const name = String(payload.nombre || '').trim().replace(/\s+/g, ' ')
      const course = String(payload.curso || '').trim()
      const division = String(payload.division || '').trim()
      const shift = String(payload.turno || '').trim()
      if (name.length < 2 || !course || !division || !shift) {
        return response({ error: 'Ingresá tu nombre y elegí un curso válido.' }, 400)
      }
      cookieStore.set(STUDENT_COOKIE, signStudent({ name, course, division, shift }), setCookieOptions(STUDENT_MAX_AGE))
      cookieStore.delete(SESSION_COOKIE)
      return response({
        data: { user: { id: 'student', username: name, role: 'ESTUDIANTE', course, division, shift }, accessType: 'student' },
      })
    }

    if (action === 'logout') {
      const token = cookieStore.get(SESSION_COOKIE)?.value || ''
      if (token) {
        try {
          await callGas('logout', {}, token)
        } catch {}
      }
      cookieStore.delete(SESSION_COOKIE)
      cookieStore.delete(STUDENT_COOKIE)
      return response({ data: { ok: true } })
    }

    const token = cookieStore.get(SESSION_COOKIE)?.value || ''
    const student = readStudentSession(cookieStore.get(STUDENT_COOKIE)?.value)

    if (action === 'subirMapa') {
      if (!token && !student) return response({ error: 'Ingresá tu nombre y curso para enviar un mapa.' }, 401)
      const uploadPayload = student
        ? { ...payload, curso: student.course, division: student.division, turno: student.shift }
        : payload
      const data = await callGas('subirMapa', uploadPayload, token)
      return response({ data })
    }

    if (action === 'guardarAnalisisMapas') {
      if (!token && !student) return response({ error: 'Ingresá tu nombre y curso para guardar el análisis.' }, 401)
      const fullPayload = student
        ? { ...payload, curso: student.course, division: student.division, turno: student.shift }
        : payload
      const data = await callGas('guardarAnalisisMapas', fullPayload, token)
      return response({ data })
    }

    if (action === 'guardarRegistros' || action === 'guardarBorrador') {
      if (!token && !student) return response({ error: 'Ingresá tu nombre y curso para guardar el cuestionario.' }, 401)
      const fullPayload = student
        ? { ...payload, curso: student.course, division: student.division, turno: student.shift }
        : payload
      const data = await callGas(action, fullPayload, token)
      return response({ data })
    }

    if (!token) return response({ error: 'Operación exclusiva para el Equipo Directivo.' }, 401)
    const data = await callGas(action, payload, token)
    return response({ data })
  } catch (error) {
    const status = Number((error as { status?: number }).status) || 502
    return response({ error: error instanceof Error ? error.message : 'Error de conexión con Apps Script.' }, status)
  }
}
