# Studyhall Operator

The operations console for [Studyhall](https://github.com/appwrite-community/studyhall-classroom), a
white-label course platform. Studyhall sells to schools. Each school gets an Appwrite project of its
own, and nobody at that school ever learns Appwrite is involved.

This app opens a school, ships the classroom into their project, gives them an address, meters what
they use, and closes the account when they leave.

## What runs where

| | Credential | Reaches |
| --- | --- | --- |
| Studyhall's own project | A project API key | Staff accounts, and the table mapping schools to projects |
| Every school's project | A key borrowed for one job, expiring in five minutes | Only the scopes that job needs |
| The organization | The Partners key | Creating projects, and issuing those short-lived keys |

There is no long-lived credential for any customer project anywhere in this codebase. `src/lib/keys.ts`
asks Appwrite for a key when a job starts, and the key expires on its own.

## Reading the code

- `src/lib/provision.ts` opens a school: project, key, platform, schema, site, variables, deployment, address.
- `src/lib/schema.ts` is the shape every school gets. Note the questions table, which grants no read permission to signed-in users.
- `src/lib/tenants.server.ts` holds the day-to-day jobs: handouts, enrolment, releases, metering, closing an account.

## Running it

```bash
npm install
cp .env.example .env
npm run dev
```
