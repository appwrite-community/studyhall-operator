import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { getStaffFn, signInFn } from '../lib/api'
import { Field, inputClass } from '../components/shell'

export const Route = createFileRoute('/sign-in')({
  loader: async () => {
    const staff = await getStaffFn()
    if (staff) throw redirect({ to: '/' })
    return null
  },
  component: SignIn,
})

function SignIn() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-[340px]">
        <h1 className="text-[18px] font-bold tracking-[-0.02em]">Studyhall operations</h1>
        <p className="mt-2 text-[13px] text-muted">
          The console your team uses to run every school on the platform.
        </p>
        <form
          className="mt-7"
          onSubmit={async (event) => {
            event.preventDefault()
            setPending(true)
            setError(null)
            const form = new FormData(event.currentTarget)
            const result = await signInFn({
              data: {
                email: String(form.get('email') ?? ''),
                password: String(form.get('password') ?? ''),
              },
            })
            setPending(false)
            if (result.ok) router.navigate({ to: '/' })
            else setError(result.error ?? 'Sign in failed.')
          }}
        >
          <Field label="Email">
            <input name="email" type="email" required autoComplete="username" className={inputClass} />
          </Field>
          <div className="mt-4">
            <Field label="Password">
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className={inputClass}
              />
            </Field>
          </div>
          {error ? <p className="mt-4 text-[13px] text-alert">{error}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="mt-6 w-full cursor-pointer btn-primary px-3.5 py-2.5 text-[13px] font-medium disabled:opacity-60"
          >
            {pending ? 'Signing in' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
