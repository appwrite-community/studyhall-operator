import { Link, useRouter } from '@tanstack/react-router'
import { signOutFn } from '../lib/api'

export function Shell({
  staff,
  children,
}: {
  staff: { name: string; email: string }
  children: React.ReactNode
}) {
  const router = useRouter()
  return (
    <div className="min-h-screen">
      <header className="border-b border-rule bg-card">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-baseline gap-2.5 no-underline">
            <span className="text-[15px] font-bold tracking-[-0.02em]">Studyhall</span>
            <span className="text-[12px] text-muted">operations</span>
          </Link>
          <div className="flex items-center gap-4 text-[13px]">
            <span className="text-muted">{staff.name}</span>
            <button
              type="button"
              className="cursor-pointer text-ink underline decoration-rule underline-offset-4 hover:decoration-ink"
              onClick={async () => {
                await signOutFn()
                router.navigate({ to: '/sign-in' })
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-9">{children}</main>
    </div>
  )
}

export function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="block text-[12px] font-medium text-muted">{label}</span>
      <span className="mt-1 block">{children}</span>
    </label>
  )
}

export const inputClass =
  'w-full border border-rule bg-card px-2.5 py-2 text-[13px] outline-none focus:border-ink'
