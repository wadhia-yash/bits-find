# LnF monorepo

The repository contains the Expo mobile app and the LnF website, managed with pnpm workspaces and Turborepo.

| Workspace | Purpose | Start command |
| --- | --- | --- |
| `apps/mobile` | Expo / React Native app | `pnpm mobile` |
| `apps/web` | React / Vinext website and Cloudflare Worker API | `pnpm web` |

Use Node.js 22.13 or newer and pnpm 10.34.6 (the version pinned in `package.json`). With Corepack available:

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm --filter web db:migrate:local
pnpm web
```

The website runs at `http://localhost:5173`. Its local database and photo bucket persist under `apps/web/.wrangler/state`. Use `pnpm mobile` for the Expo app; `pnpm --filter mobile web` remains the separate Expo web target.

Run the workspace checks from the repository root:

```sh
pnpm typecheck
pnpm --filter mobile verify
pnpm --filter web lint
pnpm build
```

See [the website README](apps/web/README.md) for routes, storage and authentication, and [the mobile README](apps/mobile/README.md) for the Expo application.
