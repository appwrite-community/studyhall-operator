import { Organization } from 'node-appwrite'
import { organizationClient } from './clients'

/**
 * Scopes are requested per job rather than per tenant, so a key that uploads a
 * handout cannot read anyone's quiz results.
 */
export const SETUP_SCOPES = [
  'platforms.write',
  'databases.write',
  'tables.write',
  'buckets.write',
  'sites.read',
  'sites.write',
  'rules.write',
]

export const MATERIAL_SCOPES = ['rows.read', 'rows.write', 'files.read', 'files.write']
export const ENROLMENT_SCOPES = ['users.read', 'users.write']
export const USAGE_SCOPES = ['usage.read']

/**
 * Studyhall never stores a credential for a customer's project. Every job asks
 * Appwrite for a key that lives as long as the job does.
 */
export async function borrowKey(projectId: string, scopes: string[], seconds = 300) {
  const key = await new Organization(organizationClient()).createEphemeralProjectKey({
    projectId,
    scopes,
    duration: seconds,
  })
  return key.secret
}

export async function withKey<T>(
  projectId: string,
  scopes: string[],
  job: (key: string) => Promise<T>,
  seconds = 300,
): Promise<T> {
  return job(await borrowKey(projectId, scopes, seconds))
}
