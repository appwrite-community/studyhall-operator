import { Account, Client, ID, Query, TablesDB, Users } from 'node-appwrite'
import { ENDPOINT } from './clients'

export const CONTROL_DB = 'studyhall'

export type Tenant = {
  id: string
  name: string
  slug: string
  projectId: string
  siteId: string
  ruleId: string
  hostname: string
  region: string
  accent: string
  release: string
  plan: string
  status: string
  seats: number
  createdAt: string
}

function controlClient() {
  return new Client()
    .setEndpoint(ENDPOINT)
    .setProject(process.env.CONTROL_PROJECT_ID!)
    .setKey(process.env.CONTROL_API_KEY!)
}

export function controlTables() {
  return new TablesDB(controlClient())
}

export function controlUsers() {
  return new Users(controlClient())
}

export function staffSessionClient(session: string) {
  return new Client()
    .setEndpoint(ENDPOINT)
    .setProject(process.env.CONTROL_PROJECT_ID!)
    .setSession(session)
}

export function staffAccount(client: Client) {
  return new Account(client)
}

export function controlAccount() {
  return new Account(controlClient())
}

const toTenant = (row: any): Tenant => ({
  id: row.$id,
  name: row.name,
  slug: row.slug,
  projectId: row.projectId,
  siteId: row.siteId,
  ruleId: row.ruleId,
  hostname: row.hostname,
  region: row.region,
  accent: row.accent,
  release: row.release,
  plan: row.plan,
  status: row.status,
  seats: row.seats ?? 0,
  createdAt: row.$createdAt,
})

export async function listTenants(): Promise<Tenant[]> {
  const rows = await controlTables().listRows({
    databaseId: CONTROL_DB,
    tableId: 'tenants',
    queries: [Query.orderAsc('name'), Query.limit(100)],
  })
  return (rows.rows as any[]).map(toTenant)
}

export async function getTenant(id: string): Promise<Tenant | null> {
  try {
    const row = await controlTables().getRow({ databaseId: CONTROL_DB, tableId: 'tenants', rowId: id })
    return toTenant(row)
  } catch {
    return null
  }
}

export async function recordTenant(tenant: Omit<Tenant, 'id' | 'createdAt'>): Promise<Tenant> {
  const row = await controlTables().createRow({
    databaseId: CONTROL_DB,
    tableId: 'tenants',
    rowId: ID.unique(),
    data: tenant,
  })
  return toTenant(row)
}

export async function forgetTenant(id: string) {
  await controlTables().deleteRow({ databaseId: CONTROL_DB, tableId: 'tenants', rowId: id })
}
