import { deleteCookie, getCookie, setCookie } from '@tanstack/react-start/server'

const COOKIE = 'studyhall_staff'

export function setStaffCookie(secret: string, expiresAt: string) {
  setCookie(COOKIE, secret, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(expiresAt),
  })
}

export function readStaffCookie() {
  return getCookie(COOKIE)
}

export function clearStaffCookie() {
  deleteCookie(COOKIE, { path: '/' })
}
