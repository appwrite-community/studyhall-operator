import { controlAccount, staffAccount, staffSessionClient } from './control.server'
import { clearStaffCookie, readStaffCookie, setStaffCookie } from './session.server'

export async function currentStaff() {
  const session = readStaffCookie()
  if (!session) return null
  try {
    const user = await staffAccount(staffSessionClient(session)).get()
    return { name: user.name, email: user.email }
  } catch {
    clearStaffCookie()
    return null
  }
}

export async function signIn(email: string, password: string) {
  try {
    const session = await controlAccount().createEmailPasswordSession({ email, password })
    setStaffCookie(session.secret, session.expire)
    return { ok: true }
  } catch {
    return { ok: false, error: 'That email and password do not match a Studyhall account.' }
  }
}

export async function signOut() {
  const session = readStaffCookie()
  clearStaffCookie()
  if (!session) return
  try {
    await staffAccount(staffSessionClient(session)).deleteSession({ sessionId: 'current' })
  } catch {
    // Already gone.
  }
}
