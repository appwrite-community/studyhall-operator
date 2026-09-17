import { ID, Organization, Proxy, Query, Sites, Storage, TablesDB, Usage } from 'node-appwrite'
import { organization, organizationClient, projectClient } from './clients'
import { ENROLMENT_SCOPES, MATERIAL_SCOPES, USAGE_SCOPES, borrowKey } from './keys'
import { DATABASE_ID, BUCKET_ID } from './schema'
import { getTenant, forgetTenant, type Tenant } from './control.server'

/** What Studyhall charges a school for, and what it charges. */
export const PRICE = {
  perLearner: 180, // cents, per active learner per month
  perStorageGb: 40, // cents, per GB held at the end of the month
}

export type TenantDetail = {
  tenant: Tenant
  site: { status: string; deploymentId: string; updatedAt: string } | null
  domain: { status: string; domain: string } | null
  courses: Array<{ id: string; title: string; materials: number }>
  usage: { learners: number; storageBytes: number }
  invoice: { learners: number; storageGb: number; amountCents: number }
}

export async function tenantDetail(tenantId: string): Promise<TenantDetail | null> {
  const tenant = await getTenant(tenantId)
  if (!tenant) return null

  const key = await borrowKey(
    tenant.projectId,
    ['sites.read', 'rules.read', 'rows.read', 'usage.read'],
    300,
  )
  const client = projectClient(tenant.projectId, key)

  const [site, rules, courses, materials, usage] = await Promise.all([
    new Sites(client)
      .get({ siteId: tenant.siteId })
      .catch(() => null),
    new Proxy(client).listRules().catch(() => ({ rules: [] as any[] })),
    new TablesDB(client)
      .listRows({ databaseId: DATABASE_ID, tableId: 'courses', queries: [Query.orderAsc('position')] })
      .catch(() => ({ rows: [] as any[] })),
    new TablesDB(client)
      .listRows({ databaseId: DATABASE_ID, tableId: 'materials', queries: [Query.limit(200)] })
      .catch(() => ({ rows: [] as any[] })),
    readUsage(client),
  ])

  const rule = (rules.rules as any[]).find((r) => r.domain === tenant.hostname) ?? null

  const storageGb = usage.storageBytes / 1_000_000_000
  return {
    tenant,
    site: site
      ? { status: site.latestDeploymentStatus ?? 'unknown', deploymentId: site.deploymentId ?? '', updatedAt: site.$updatedAt }
      : null,
    domain: rule ? { status: rule.status, domain: rule.domain } : null,
    courses: (courses.rows as any[]).map((course) => ({
      id: course.$id,
      title: course.title,
      materials: (materials.rows as any[]).filter((m) => m.courseId === course.$id).length,
    })),
    usage,
    invoice: {
      learners: usage.learners,
      storageGb,
      amountCents: Math.round(usage.learners * PRICE.perLearner + storageGb * PRICE.perStorageGb),
    },
  }
}

/**
 * Two numbers decide a school's invoice: how many learners signed in this month,
 * and how much of their own material they are holding.
 */
async function readUsage(client: ReturnType<typeof projectClient>) {
  try {
    const gauges = await new Usage(client).listGauges({ metrics: ['users.mau', 'files.storage'] })
    const value = (metric: string) => {
      const entry = (gauges.metrics as any[]).find((g) => g.metric === metric)
      const points = entry?.points ?? []
      return points.length ? Number(points[points.length - 1].value ?? 0) : 0
    }
    return { learners: value('users.mau'), storageBytes: value('files.storage') }
  } catch {
    return { learners: 0, storageBytes: 0 }
  }
}

export async function addMaterial(
  tenantId: string,
  courseId: string,
  title: string,
  file: File,
): Promise<{ ok: boolean; error?: string }> {
  const tenant = await getTenant(tenantId)
  if (!tenant) return { ok: false, error: 'That school is no longer on the platform.' }

  // A key for this upload and nothing else, gone in five minutes.
  const key = await borrowKey(tenant.projectId, MATERIAL_SCOPES, 300)
  const client = projectClient(tenant.projectId, key)

  const { InputFile } = await import('node-appwrite/file')
  const buffer = Buffer.from(await file.arrayBuffer())
  const uploaded = await new Storage(client).createFile({
    bucketId: BUCKET_ID,
    fileId: ID.unique(),
    file: InputFile.fromBuffer(buffer, file.name),
  })

  await new TablesDB(client).createRow({
    databaseId: DATABASE_ID,
    tableId: 'materials',
    rowId: ID.unique(),
    data: {
      courseId,
      title,
      fileId: uploaded.$id,
      filename: file.name,
      mimeType: uploaded.mimeType,
      sizeBytes: uploaded.sizeOriginal,
    },
  })

  return { ok: true }
}

export async function enrolLearner(tenantId: string, name: string, email: string, password: string) {
  const tenant = await getTenant(tenantId)
  if (!tenant) return { ok: false, error: 'That school is no longer on the platform.' }

  const key = await borrowKey(tenant.projectId, ENROLMENT_SCOPES, 300)
  const { Users } = await import('node-appwrite')
  try {
    await new Users(projectClient(tenant.projectId, key)).create({
      userId: ID.unique(),
      email,
      password,
      name,
    })
    return { ok: true }
  } catch (error) {
    return { ok: false, error: 'That email is already enrolled here.' }
  }
}

/** Rolling every school onto a release, or holding one back, is a loop. */
export async function releaseTo(tenantId: string, tag: string) {
  const tenant = await getTenant(tenantId)
  if (!tenant) return { ok: false, error: 'That school is no longer on the platform.' }

  const key = await borrowKey(tenant.projectId, ['sites.read', 'sites.write'], 600)
  const deployment = await new Sites(projectClient(tenant.projectId, key)).createTemplateDeployment({
    siteId: tenant.siteId,
    owner: process.env.CLASSROOM_REPO_OWNER!,
    repository: process.env.CLASSROOM_REPO_NAME!,
    rootDirectory: './',
    type: 'tag',
    reference: tag,
    activate: true,
  })
  return { ok: true, deploymentId: deployment.$id }
}

/** Closing an account is one call, and it takes everything with it. */
export async function removeTenant(tenantId: string) {
  const tenant = await getTenant(tenantId)
  if (!tenant) return { ok: true }
  await new Organization(organizationClient()).deleteProject({ projectId: tenant.projectId })
  await forgetTenant(tenantId)
  return { ok: true }
}

export { organization }
