# reloadux project intelligence agent

Internal app for the reloadux team to ask about past projects. See `SPEC.md` for the product and `CLAUDE.md` for engineering rules.

## Run it locally

Uses **pnpm** (not npm).

```bash
pnpm install
cp .env.example .env.local   # then fill in, see below
pnpm db:local                # terminal 1: local MongoDB on port 27018, data kept in .data/
pnpm db:seed                 # once: 8 fictional projects (safe to re-run)
pnpm dev                     # terminal 2: http://localhost:3000
```

For the local database, `.env.local` needs:

```
MONGODB_URI=mongodb://127.0.0.1:27018
MONGODB_DB=reloadux_dev
```

Every page needs Google sign-in with a reloadux.com account. Until the Firebase settings in `.env.example` are filled in, the app shows "Sign-in isn't set up yet" and stays locked.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server on http://localhost:3000 |
| `pnpm check` | Lint, type check, unit and integration tests |
| `pnpm e2e` | Playwright tests against a production build and a throwaway database |
| `pnpm db:local` | Local MongoDB for development |
| `pnpm db:seed [--dry-run]` | Seed fictional people and projects |
| `pnpm db:indexes [--dry-run]` | Create missing database indexes |
