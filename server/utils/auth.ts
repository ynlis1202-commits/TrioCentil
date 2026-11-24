import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import type { H3Event } from 'h3'
import { getCookie, setCookie, deleteCookie, createError } from 'h3'
import type { UserRole } from '@prisma/client'
import { prisma } from './prisma'

const SESSION_COOKIE_NAME = 'triocentil_session'
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 hari

export interface SessionPayload {
  userId: string
  role: UserRole
  exp: number
}

function getSecret(): string {
  const config = useRuntimeConfig()
  return config.sessionSecret || 'triocentil-dev-secret-change-in-production-min-32-chars'
}

function signData(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('base64url')
}

export function createSessionToken(payload: Omit<SessionPayload, 'exp'>): string {
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS
  }
  const encoded = Buffer.from(JSON.stringify(fullPayload), 'utf8').toString('base64url')
  const signature = signData(encoded, getSecret())
  return `${encoded}.${signature}`
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token || !token.includes('.')) return null
  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) return null

  const expectedSignature = signData(encoded, getSecret())
  const sigBuf = Buffer.from(signature)
  const expBuf = Buffer.from(expectedSignature)
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null
  }

  try {
    const decoded = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload
    if (!decoded.userId || !decoded.role || !decoded.exp) return null
    if (decoded.exp < Math.floor(Date.now() / 1000)) return null
    return decoded
  } catch {
    return null
  }
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

export function setAuthCookie(event: H3Event, userId: string, role: UserRole): void {
  const token = createSessionToken({ userId, role })
  setCookie(event, SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS
  })
}

export function clearAuthCookie(event: H3Event): void {
  deleteCookie(event, SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  })
}

export async function getSessionUser(event: H3Event) {
  const token = getCookie(event, SESSION_COOKIE_NAME)
  const payload = verifySessionToken(token)
  if (!payload) return null

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true
    }
  })

  if (!user || !user.isActive) return null
  return user
}

export async function requireAuth(event: H3Event, allowedRoles?: UserRole[]) {
  const user = await getSessionUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Silakan login terlebih dahulu untuk mengakses halaman ini.'
    })
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Anda tidak memiliki izin untuk mengakses fitur ini.'
    })
  }
  return user
}

export async function requireAdmin(event: H3Event) {
  return requireAuth(event, ['ADMIN', 'STAFF'])
}
