import { createServerFn } from '@tanstack/react-start'
import type { Tenant } from './control.server'
import type { TenantDetail } from './tenants.server'

export const getStaffFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{ name: string; email: string } | null> => {
    const { currentStaff } = await import('./auth.server')
    return currentStaff()
  },
)

export const signInFn = createServerFn({ method: 'POST' })
  .validator((input: { email: string; password: string }) => input)
  .handler(async ({ data }) => {
    const { signIn } = await import('./auth.server')
    return signIn(data.email, data.password)
  })

export const signOutFn = createServerFn({ method: 'POST' }).handler(async () => {
  const { signOut } = await import('./auth.server')
  await signOut()
  return { ok: true }
})

export const listTenantsFn = createServerFn({ method: 'GET' }).handler(async (): Promise<Tenant[]> => {
  const { listTenants } = await import('./control.server')
  return listTenants()
})

export const tenantDetailFn = createServerFn({ method: 'GET' })
  .validator((tenantId: string) => tenantId)
  .handler(async ({ data }): Promise<TenantDetail | null> => {
    const { tenantDetail } = await import('./tenants.server')
    return tenantDetail(data)
  })

export const addSchoolFn = createServerFn({ method: 'POST' })
  .validator((input: { name: string; slug: string; region: string; accent: string }) => input)
  .handler(async ({ data }): Promise<{ ok: boolean; tenantId?: string; error?: string }> => {
    const { addSchool } = await import('./workflows.server')
    return addSchool(data)
  })

export const enrolLearnerFn = createServerFn({ method: 'POST' })
  .validator((input: { tenantId: string; name: string; email: string; password: string }) => input)
  .handler(async ({ data }) => {
    const { enrolLearner } = await import('./tenants.server')
    return enrolLearner(data.tenantId, data.name, data.email, data.password)
  })

export const releaseToFn = createServerFn({ method: 'POST' })
  .validator((input: { tenantId: string; tag: string }) => input)
  .handler(async ({ data }) => {
    const { releaseTo } = await import('./tenants.server')
    return releaseTo(data.tenantId, data.tag)
  })

export const removeTenantFn = createServerFn({ method: 'POST' })
  .validator((tenantId: string) => tenantId)
  .handler(async ({ data }) => {
    const { removeTenant } = await import('./tenants.server')
    return removeTenant(data)
  })
