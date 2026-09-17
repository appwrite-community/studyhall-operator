import { ID, Project, Proxy, Sites } from 'node-appwrite'
import { organization, projectClient } from './clients'
import { SETUP_SCOPES, borrowKey } from './keys'
import { createSchema } from './schema'

export const APP_REPO = {
  owner: process.env.CLASSROOM_REPO_OWNER ?? 'appwrite-community',
  repository: process.env.CLASSROOM_REPO_NAME ?? 'studyhall-classroom',
  rootDirectory: './',
}

/** Scopes the classroom site's own server code is allowed to use. */
export const SITE_SCOPES = ['sessions.write', 'users.read', 'rows.read', 'rows.write', 'files.read']

export type NewTenant = {
  name: string
  slug: string
  region: string
  accent: string
  release: string
}

export type ProvisionedTenant = {
  projectId: string
  siteId: string
  ruleId: string
  hostname: string
  deploymentId: string
}

export async function provisionTenant(tenant: NewTenant): Promise<ProvisionedTenant> {
  const hostname = `${tenant.slug}.${process.env.STUDYHALL_DOMAIN ?? 'studyhall.app'}`

  // 1. A project of their own, in the region they picked.
  const project = await organization().createProject({
    projectId: ID.unique(),
    name: tenant.name,
    region: tenant.region,
  })

  // 2. A key that expires in five minutes, for the setup that follows.
  const key = await borrowKey(project.$id, SETUP_SCOPES, 300)
  const client = projectClient(project.$id, key)

  // 3. Their hostname, so their students' browsers may call their own project.
  await new Project(client).createWebPlatform({
    platformId: ID.unique(),
    name: tenant.name,
    hostname,
  })

  // 4. Courses, lessons, handouts, quizzes, results.
  await createSchema(client)

  // 5. The classroom itself, built by Appwrite from one repository.
  const sites = new Sites(client)
  const site = await sites.create({
    siteId: ID.unique(),
    name: 'Classroom',
    framework: 'tanstack-start',
    adapter: 'ssr',
    buildRuntime: 'node-22',
    installCommand: 'npm install',
    buildCommand: 'npm run build',
    outputDirectory: './dist',
    scopes: SITE_SCOPES,
  })

  // 6. The same build, wearing this school's name and colour.
  for (const [key, value] of Object.entries({
    CLASSROOM_SCHOOL_NAME: tenant.name,
    CLASSROOM_ACCENT: tenant.accent,
    CLASSROOM_TAGLINE: 'Course materials and assessments',
  })) {
    await sites.createVariable({ siteId: site.$id, variableId: ID.unique(), key, value })
  }

  const deployment = await sites.createTemplateDeployment({
    siteId: site.$id,
    owner: APP_REPO.owner,
    repository: APP_REPO.repository,
    rootDirectory: APP_REPO.rootDirectory,
    type: 'tag',
    reference: tenant.release,
    activate: true,
  })

  // 7. Their address.
  const rule = await new Proxy(client).createSiteRule({ domain: hostname, siteId: site.$id })

  return {
    projectId: project.$id,
    siteId: site.$id,
    ruleId: rule.$id,
    hostname,
    deploymentId: deployment.$id,
  }
}
