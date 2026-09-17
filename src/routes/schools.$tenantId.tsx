import { createFileRoute, Link, notFound, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { enrolLearnerFn, getStaffFn, releaseToFn, removeTenantFn, tenantDetailFn } from '../lib/api'
import { Field, Shell, inputClass } from '../components/shell'

export const Route = createFileRoute('/schools/$tenantId')({
  loader: async ({ params }) => {
    const staff = await getStaffFn()
    if (!staff) throw redirect({ to: '/sign-in' })
    const detail = await tenantDetailFn({ data: params.tenantId })
    if (!detail) throw notFound()
    return { staff, ...detail }
  },
  component: School,
})

const money = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)

const held = (bytes: number) =>
  bytes >= 1_000_000_000
    ? `${(bytes / 1_000_000_000).toFixed(2)} GB`
    : `${Math.round(bytes / 1_000_000)} MB`

function StatusWord({ value }: { value: string }) {
  const tone =
    value === 'ready' || value === 'verified'
      ? 'text-live'
      : value === 'failed'
        ? 'text-alert'
        : 'text-muted'
  return <span className={`text-[13px] font-medium ${tone}`}>{value}</span>
}

function School() {
  const { staff, tenant, site, domain, courses, usage, invoice } = Route.useLoaderData()
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)

  return (
    <Shell staff={staff}>
      <Link to="/" className="text-[12px] text-muted no-underline hover:text-ink">
        Schools
      </Link>

      <div className="mt-3 flex items-start justify-between gap-8">
        <div>
          <h1 className="flex items-center gap-3 text-[22px] font-bold tracking-[-0.02em]">
            <span
              aria-hidden
              className="inline-block size-3 rounded-[2px]"
              style={{ background: tenant.accent }}
            />
            {tenant.name}
          </h1>
          <p className="mt-1.5 text-[13px] text-muted">
            {tenant.hostname} · {tenant.region.toUpperCase()} · release {tenant.release}
          </p>
          <p className="mt-1">
            <span className="id">{tenant.projectId}</span>
          </p>
        </div>

        <div className="text-right">
          <div className="text-[12px] text-muted">This month</div>
          <div className="mt-1 text-[30px] leading-none font-bold">
            <span className="marked">{money(invoice.amountCents)}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_300px]">
        <div>
          <section>
            <h2 className="text-[13px] font-semibold">Courses</h2>
            <table className="mt-3 w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-y border-rule text-left text-[12px] text-muted">
                  <th className="py-2 font-medium">Title</th>
                  <th className="py-2 font-medium">Handouts</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id} className="border-b border-rule">
                    <td className="py-2.5">{course.title}</td>
                    <td className="py-2.5 text-muted">{course.materials}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {courses.length === 0 ? (
              <p className="mt-3 text-[13px] text-muted">
                This school has no courses yet. Its teachers add them from the classroom.
              </p>
            ) : null}
          </section>

          <section className="mt-9">
            <h2 className="text-[13px] font-semibold">Add a handout</h2>
            <p className="mt-1.5 max-w-[60ch] text-[12px] text-muted">
              The file goes into this school's own storage and appears beside the course in their
              classroom.
            </p>
            <form
              method="post"
              action={`/schools/${tenant.id}/materials`}
              encType="multipart/form-data"
              className="mt-3 grid items-end gap-3 md:grid-cols-[1fr_1fr_1fr_auto]"
            >
              <Field label="Course">
                <select name="courseId" required className={inputClass}>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Title">
                <input name="title" required className={inputClass} placeholder="Temperature log" />
              </Field>
              <Field label="File">
                <input name="file" type="file" required className="w-full text-[12px]" />
              </Field>
              <button
                type="submit"
                className="h-[34px] cursor-pointer btn-primary px-3.5 text-[13px] font-medium"
              >
                Upload
              </button>
            </form>
          </section>

          <section className="mt-9">
            <h2 className="text-[13px] font-semibold">Enrol a learner</h2>
            <p className="mt-1.5 max-w-[60ch] text-[12px] text-muted">
              The account is created in this school's project. No other school can see it.
            </p>
            <form
              className="mt-3 grid items-end gap-3 md:grid-cols-[1fr_1fr_1fr_auto]"
              onSubmit={async (event) => {
                event.preventDefault()
                const form = new FormData(event.currentTarget)
                setBusy('enrol')
                await enrolLearnerFn({
                  data: {
                    tenantId: tenant.id,
                    name: String(form.get('name') ?? ''),
                    email: String(form.get('email') ?? ''),
                    password: String(form.get('password') ?? ''),
                  },
                })
                setBusy(null)
                event.currentTarget.reset()
                router.invalidate()
              }}
            >
              <Field label="Name">
                <input name="name" required className={inputClass} />
              </Field>
              <Field label="Email">
                <input name="email" type="email" required className={inputClass} />
              </Field>
              <Field label="Temporary password">
                <input name="password" required minLength={8} className={inputClass} />
              </Field>
              <button
                type="submit"
                disabled={busy === 'enrol'}
                className="h-[34px] cursor-pointer btn-primary px-3.5 text-[13px] font-medium disabled:opacity-60"
              >
                {busy === 'enrol' ? 'Enrolling' : 'Enrol'}
              </button>
            </form>
          </section>
        </div>

        <aside>
          <section className="border border-rule bg-card p-4">
            <h2 className="text-[13px] font-semibold">Classroom</h2>
            <dl className="mt-3 text-[13px]">
              <div className="flex items-baseline justify-between gap-4 border-b border-rule py-2">
                <dt className="text-muted">Build</dt>
                <dd>{site ? <StatusWord value={site.status} /> : <span className="text-muted">none</span>}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-b border-rule py-2">
                <dt className="text-muted">Address</dt>
                <dd>
                  {domain ? <StatusWord value={domain.status} /> : <span className="text-muted">none</span>}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-2">
                <dt className="text-muted">Release</dt>
                <dd className="text-[13px]">{tenant.release}</dd>
              </div>
            </dl>
            <button
              type="button"
              disabled={busy === 'release'}
              onClick={async () => {
                setBusy('release')
                await releaseToFn({ data: { tenantId: tenant.id, tag: tenant.release } })
                setBusy(null)
                router.invalidate()
              }}
              className="mt-3 w-full cursor-pointer border border-rule bg-paper px-3 py-2 text-[13px] font-medium disabled:opacity-60"
            >
              {busy === 'release' ? 'Deploying' : 'Deploy this release again'}
            </button>
          </section>

          <section className="mt-5 border border-rule bg-card p-4">
            <h2 className="text-[13px] font-semibold">Metered this month</h2>
            <dl className="mt-3 text-[13px]">
              <div className="flex items-baseline justify-between gap-4 border-b border-rule py-2">
                <dt className="text-muted">Active learners</dt>
                <dd className="font-medium">{usage.learners}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-2">
                <dt className="text-muted">Material held</dt>
                <dd className="font-medium">{held(usage.storageBytes)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-[12px] leading-relaxed text-muted">
              Read from this school's project at the close of the month, then kept in Studyhall's own
              records.
            </p>
          </section>

          <section className="mt-5">
            <button
              type="button"
              disabled={busy === 'remove'}
              onClick={async () => {
                setBusy('remove')
                await removeTenantFn({ data: tenant.id })
                router.navigate({ to: '/' })
              }}
              className="w-full cursor-pointer border border-rule px-3 py-2 text-[13px] font-medium text-alert disabled:opacity-60"
            >
              {busy === 'remove' ? 'Closing' : 'Close this school'}
            </button>
            <p className="mt-2 text-[12px] leading-relaxed text-muted">
              Deletes the project and everything in it: learners, courses, files, and the site.
            </p>
          </section>
        </aside>
      </div>
    </Shell>
  )
}
