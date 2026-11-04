# LnF website

The web workspace uses React, Vinext, Tailwind CSS, and Cloudflare Workers. It shares the repository's pnpm lockfile and Turbo tasks.

## Local development

Use Node.js 22.13 or newer and the pnpm version pinned in the root `package.json`.

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm --filter web db:migrate:local
pnpm web
```

Open `http://localhost:5173`. Local reports, demo enquiries, and photos persist in `apps/web/.wrangler/state`. D1 uses the `DB` binding; R2 uses `BUCKET`.

If native file watching is unavailable, start the server with `CHOKIDAR_USEPOLLING=true pnpm web`.

## Checks and production build

```sh
pnpm --filter web typecheck
pnpm --filter web lint
pnpm --filter web build
pnpm --filter web start
```

`start` serves the built Worker locally. Provision D1 and R2 and configure authentication before deploying it independently. `wrangler.local.jsonc` contains local resource names; `.openai/hosting.json` declares the bindings used by the hosted deployment.

## Accounts and reports

The development server provides a local test account on loopback connections only. The hosted deployment uses ChatGPT sign-in through a trusted gateway. The authentication adapter in `app/chatgpt-auth.ts` reads the identity supplied by that gateway; standalone deployments need their own trusted authentication integration.

Reports, demo enquiries, and private photos are scoped to the account that created them. API routes validate inputs and photo signatures and enforce per-account hourly limits.

The reporting service is separate from the mobile app's Firebase backend. Venue alerts, staff access, email delivery, and calendar booking are not connected. The dashboard uses sample records and simulated status changes. Venue images are illustrative and do not represent customers.

## Project structure

- `app/`: pages and API routes
- `components/site/`: website components
- `components/ui/`: shared UI primitives
- `lib/`: content and reporting helpers
- `db/` and `drizzle/`: schema and migrations
- `build/`: Worker entry point and local sign-in adapter
- `public/`: images and static assets

Marketing pages cover the platform, solutions, pricing, security, integrations, resources, and legal notices. Reporting flows live at `/report`, `/request-demo`, `/my-reports`, and `/sign-in`; `/dashboard` is the interactive product preview.

Run `pnpm --filter web db:generate` after changing `db/schema.ts` to create a migration.
