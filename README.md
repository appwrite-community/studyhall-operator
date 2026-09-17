# Studyhall Operator

The console the Studyhall team uses to run a white-label course platform where every school gets its
own Appwrite project. Its student-facing half is
[studyhall-classroom](https://github.com/appwrite-community/studyhall-classroom).

It is a [TanStack Start](https://tanstack.com/start) app rendered on the server.

## What it does

Opens a school: creates the project, registers the school's hostname, creates the tables and the
bucket, deploys the classroom from a release tag, and points the school's address at it. After that
it uploads course handouts and video, enrols learners, reads what each school used this month, and
closes accounts.

## The credentials

One long-lived secret: a Partners key for the organization the school projects live in. It creates
and deletes projects and cannot read or write anything inside one.

Everything else runs on ephemeral project keys, requested per job with the scopes that job needs and
expiring on their own. No credential for a customer's project is ever stored.

## Running it locally

```bash
npm install
cp .env.example .env   # fill in the organization, the Partners key, and the control project
npm run dev
```

## Layout

| Path | What lives there |
| ---- | ---------------- |
| `src/lib/clients.ts` | The organization client and the per-project client |
| `src/lib/keys.ts` | Borrowing an ephemeral key, and the scope set for each job |
| `src/lib/provision.ts` | Opening a school, start to finish |
| `src/lib/schema.ts` | The tables, permissions, and bucket every school gets |
| `src/lib/tenants.server.ts` | Handouts, enrolment, releases, usage, and closing an account |
