import { createFileRoute, Link, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { addSchoolFn, getStaffFn, listTenantsFn } from '../lib/api'
import { Field, Shell, inputClass } from '../components/shell'

export const Route = createFileRoute('/')({
  loader: async () => {
    const staff = await getStaffFn()
    if (!staff) throw redirect({ to: '/sign-in' })
    return { staff, tenants: await listTenantsFn() }
  },
  component: Schools,
})

const REGIONS = [
  { value: 'fra', label: 'Frankfurt' },
  { value: 'nyc', label: 'New York' },
  { value: 'syd', label: 'Sydney' },
]

function Schools() {
  const { staff, tenants } = Route.useLoaderData()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <Shell staff={staff}>
      <div className="flex items-end justify-between gap-6">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.02em]">Schools</h1>
          <p className="mt-1 text-[13px] text-muted">
            Each one runs on its own Appwrite project, in the region it was opened in.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="cursor-pointer bg-ink px-3.5 py-2 text-[13px] font-medium text-white"
        >
          {open ? 'Cancel' : 'Add a school'}
        </button>
      </div>

      {open ? (
        <form
          className="mt-6 border border-rule bg-card p-5"
          onSubmit={async (event) => {
            event.preventDefault()
            setPending(true)
            setError(null)
            const form = new FormData(event.currentTarget)
            const result = await addSchoolFn({
              data: {
                name: String(form.get('name') ?? ''),
                slug: String(form.get('slug') ?? ''),
                region: String(form.get('region') ?? 'fra'),
                accent: String(form.get('accent') ?? '#2F6F4F'),
              },
            })
            setPending(false)
            if (result.ok && result.tenantId) {
              setOpen(false)
              router.navigate({ to: '/schools/$tenantId', params: { tenantId: result.tenantId } })
            } else {
              setError(result.error ?? 'Provisioning failed.')
            }
          }}
        >
          <div className="grid gap-4 md:grid-cols-4">
            <Field label="School name">
              <input name="name" required className={inputClass} placeholder="Northgate Academy" />
            </Field>
            <Field label="Address">
              <div className="flex items-center">
                <input
                  name="slug"
                  required
                  pattern="[a-z0-9-]+"
                  className={inputClass}
                  placeholder="northgate"
                />
                <span className="ml-2 shrink-0 text-[12px] text-muted">.studyhall.app</span>
              </div>
            </Field>
            <Field label="Region">
              <select name="region" className={inputClass} defaultValue="fra">
                {REGIONS.map((region) => (
                  <option key={region.value} value={region.value}>
                    {region.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Colour">
              <input name="accent" type="color" defaultValue="#2F6F4F" className="h-[34px] w-full border border-rule bg-card px-1" />
            </Field>
          </div>

          {error ? <p className="mt-4 text-[13px] text-alert">{error}</p> : null}

          <div className="mt-5 flex items-center gap-4 border-t border-rule pt-4">
            <button
              type="submit"
              disabled={pending}
              className="cursor-pointer bg-ink px-3.5 py-2 text-[13px] font-medium text-white disabled:opacity-60"
            >
              {pending ? 'Opening the school' : 'Open the school'}
            </button>
            <span className="text-[12px] text-muted">
              Creates the project, its classroom site, and its address. Takes about a minute.
            </span>
          </div>
        </form>
      ) : null}

      <table className="mt-8 w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-y border-rule text-left text-[12px] text-muted">
            <th className="py-2.5 font-medium">School</th>
            <th className="py-2.5 font-medium">Address</th>
            <th className="py-2.5 font-medium">Region</th>
            <th className="py-2.5 font-medium">Release</th>
            <th className="py-2.5 font-medium">Project</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((tenant) => (
            <tr key={tenant.id} className="border-b border-rule">
              <td className="py-3">
                <Link
                  to="/schools/$tenantId"
                  params={{ tenantId: tenant.id }}
                  className="flex items-center gap-2.5 font-medium no-underline hover:underline"
                >
                  <span
                    aria-hidden
                    className="inline-block size-2.5 rounded-[2px]"
                    style={{ background: tenant.accent }}
                  />
                  {tenant.name}
                </Link>
              </td>
              <td className="py-3 text-muted">{tenant.hostname}</td>
              <td className="py-3 text-muted uppercase">{tenant.region}</td>
              <td className="py-3 text-muted">{tenant.release}</td>
              <td className="py-3">
                <span className="id">{tenant.projectId}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {tenants.length === 0 ? (
        <p className="mt-6 text-[13px] text-muted">
          No schools yet. Add one and Studyhall will build it a backend of its own.
        </p>
      ) : null}
    </Shell>
  )
}
