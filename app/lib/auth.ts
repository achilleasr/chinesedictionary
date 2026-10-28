import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'

const secret = process.env.AUTH_SECRET

const sign = (v: string) => createHmac('sha256', secret!).update(v).digest()

const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
}

export async function loginTeacher(password: string) {
  if (!secret || !process.env.TEACHER_PASSWORD) {
    throw new Error('AUTH_SECRET and TEACHER_PASSWORD must be set in .env.local')
  }
  const ok = timingSafeEqual(sign(password), sign(process.env.TEACHER_PASSWORD))
  if (!ok) return false
  ;(await cookies()).set('auth', sign('teacher').toString('hex'), cookieOpts)
  return true
}

export async function logoutTeacher() {
  const store = await cookies()
  store.delete('auth')
  store.delete('editmode')
}

export async function isTeacher() {
  if (!secret) return false // no secret configured: nobody is a teacher
  const c = (await cookies()).get('auth')?.value
  return c === sign('teacher').toString('hex')
}

export async function setEditMode(on: boolean) {
  const store = await cookies()
  if (on && (await isTeacher())) store.set('editmode', '1', cookieOpts)
  else store.delete('editmode')
}

export async function isEditing() {
  return (await isTeacher()) && (await cookies()).get('editmode')?.value === '1'
}
