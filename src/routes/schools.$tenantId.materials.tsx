import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/schools/$tenantId/materials')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { currentStaff } = await import('../lib/auth.server')
        if (!(await currentStaff())) {
          return new Response('Sign in first.', { status: 401 })
        }

        const form = await request.formData()
        const file = form.get('file')
        const courseId = String(form.get('courseId') ?? '')
        const title = String(form.get('title') ?? '')

        if (!(file instanceof File) || !courseId || !title) {
          return new Response('Pick a course, name the handout, and choose a file.', { status: 400 })
        }

        const { addMaterial } = await import('../lib/tenants.server')
        const result = await addMaterial(params.tenantId, courseId, title, file)
        if (!result.ok) return new Response(result.error ?? 'Upload failed.', { status: 400 })

        return new Response(null, {
          status: 303,
          headers: { location: `/schools/${params.tenantId}` },
        })
      },
    },
  },
})
