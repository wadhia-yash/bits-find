# LnF website

The complete LnF website lives in this workspace. It uses React, Vinext with Next-style app routes, Tailwind CSS and Cloudflare Worker APIs. The monorepo root owns the pnpm version, dependency lockfile and workspace policy.

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm --filter web db:migrate:local
pnpm web
```

Open `http://localhost:5173`. Migrations create the report and demo-request tables. D1 and R2 local state is stored under `apps/web/.wrangler/state`; the bindings are named `DB` and `BUCKET` in both the Vite configuration and `wrangler.local.jsonc`.

```sh
pnpm --filter web typecheck
pnpm --filter web lint
pnpm --filter web build
pnpm --filter web start
```

`start` serves the built Worker locally. The development server supplies a loopback-only mock sign-in so the private pilot flows can be exercised. Production sign-in expects a trusted Sites dispatch to supply the authenticated ChatGPT identity; deploying the Worker directly requires an authentication integration. `wrangler.local.jsonc` contains local placeholders, not provisioned cloud resources. The copied hosting manifest keeps logical bindings and does not reference the original deployed Site.

Marketing routes include `/`, `/platform`, `/solutions`, six `/solutions/:type` pages, `/how-it-works`, `/pricing`, `/security`, `/integrations`, `/about`, `/resources`, three resource guides, `/privacy` and `/terms`.

The website pilot includes `/report` (three-step report with an optional private photo), `/request-demo` (saved enquiry), `/my-reports` (the signed-in account's submissions) and `/sign-in`. Reads and writes of pilot data check the account identity; private photos require the same owner check. The API validates submissions and file signatures and applies per-account hourly limits. `/dashboard` contains labelled fictional data and supports search, filters and simulated workflow transitions.

The Expo app's Firebase backend, venue alerts, staff access, email delivery and calendar booking are separate from this website pilot. Images depict generated fictional venues; interface previews are concepts. The existing mobile workspace is preserved.

App routes are in `app/`, website components in `components/site/`, shared UI primitives in `components/ui/`, database definitions in `db/`, migrations in `drizzle/` and public assets in `public/`. Worker and authentication adapters are in `build/` and `app/chatgpt-auth.ts`. `pnpm --filter web db:generate` creates migrations from `db/schema.ts`.
