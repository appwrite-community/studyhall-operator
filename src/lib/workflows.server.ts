import { provisionTenant } from './provision'
import { recordTenant } from './control.server'

export async function addSchool(input: {
  name: string
  slug: string
  region: string
  accent: string
}) {
  try {
    const provisioned = await provisionTenant({
      ...input,
      release: process.env.CLASSROOM_RELEASE ?? 'v1.0.0',
    })

    const tenant = await recordTenant({
      name: input.name,
      slug: input.slug,
      projectId: provisioned.projectId,
      siteId: provisioned.siteId,
      ruleId: provisioned.ruleId,
      hostname: provisioned.hostname,
      region: input.region,
      accent: input.accent,
      release: process.env.CLASSROOM_RELEASE ?? 'v1.0.0',
      plan: 'Standard',
      status: 'active',
      seats: 0,
    })

    return { ok: true, tenantId: tenant.id }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Provisioning failed.' }
  }
}
