# reloadux project intelligence agent

Internal app for the reloadux team to ask about past projects. See `SPEC.md` for the product and `CLAUDE.md` for engineering rules.

## Run it locally

Uses **pnpm** (not npm).

```bash
pnpm install
cp .env.example .env.local   # then fill in, see below
pnpm db:local                # Postgres with pgvector in Docker, port 5433 (data in a Docker volume)
pnpm db:migrate              # create or update the tables
pnpm db:seed                 # once: 8 fictional projects (safe to re-run)
pnpm dev                     # http://localhost:3000
```

For the local database, `.env.local` needs:

```
DATABASE_URL=postgres://reloadux:reloadux@127.0.0.1:5433/reloadux
```

To browse it in pgAdmin, register a server with host `127.0.0.1`, port `5433`, and `reloadux` as the database, user and password.

Every page needs Google sign-in, and new accounts wait for an admin to approve them in Settings (people listed in `INITIAL_ADMIN_EMAILS` are admins straight away). Until the Firebase settings in `.env.example` are filled in, the app shows "Sign-in isn't set up yet" and stays locked.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server on http://localhost:3000 |
| `pnpm check` | Lint, type check, unit and integration tests |
| `pnpm e2e` | Playwright tests against a production build and a throwaway database |
| `pnpm db:local` | Local Postgres (pgvector) in Docker for development |
| `pnpm db:migrate` | Apply pending migrations from `drizzle/` |
| `pnpm db:generate` | Write a migration after editing `src/server/db/schema.ts` |
| `pnpm db:seed [--dry-run]` | Seed fictional people and projects |
