import { Client, Organization } from 'node-appwrite'

export const ENDPOINT = process.env.APPWRITE_ENDPOINT ?? 'https://fra.cloud.appwrite.io/v1'

/**
 * One credential for the whole platform. It reaches the organization and the
 * existence of its projects, and nothing inside any of them.
 */
export function organizationClient() {
  return new Client()
    .setEndpoint(ENDPOINT)
    .setOrganization(process.env.APPWRITE_ORGANIZATION_ID!)
    .setKey(process.env.APPWRITE_PARTNERS_KEY!)
}

export function organization() {
  return new Organization(organizationClient())
}

/** Client for work inside one customer's project, bound to a key that expires. */
export function projectClient(projectId: string, key: string) {
  return new Client().setEndpoint(ENDPOINT).setProject(projectId).setKey(key)
}
