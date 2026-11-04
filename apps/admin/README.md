# BITS Find – Admin Panel

A small web dashboard for the BITS Admin Department. It shows how well lost items are being recovered, which places and categories see the most reports, and the status of items dropped off at the admin desk.

**Status:** runs on **mock data** (fake records). It is not connected to Firebase yet.

## Run it

From this folder:

```bash
npm install     # first time only (or `pnpm install` from the repo root)
npm run dev     # opens at http://localhost:5173
```

Other commands: `npm run typecheck` (check the code for mistakes) and `npm run build` (make the production version in `dist/`).

## What's on each page

| Page | Shows |
| --- | --- |
| **Overview** | Items reported, returned, recovery rate, pending matches; bar charts by location and category; recent items |
| **Lost items** | Every request, filterable by status and searchable |
| **Handovers** | BITS Admin desk drop-offs, how many are waiting, and the average time until the owner collects |

The campus dropdown at the top filters every page.

## How it's organised

```
src/
  types.ts        Data shapes (copied from apps/mobile/src/types.ts, minus anything personal)
  mockData.ts     The fake records. Replace these to go live.
  stats.ts        All the maths (counts, recovery rate, averages)
  components/     Sidebar, stat cards, charts, tables, badges
  pages/          Overview, Lost items, Handovers
  App.tsx         Page switching and the campus filter
```

## Switching to real data later

1. Add Firebase to this app and read the `items` and `handover` collections.
2. Replace `mockItems` and `mockHandovers` in `src/mockData.ts` with those results (the shapes in `src/types.ts` already match).
3. Add admin-only access: give admin accounts a custom claim (for example `admin: true`) and update `firebase/firestore.rules` so only admins can read across campuses. This needs the Firebase owner (Yash).

## Privacy rule

The admin panel only shows counts, statuses, categories and places. It never shows phone numbers, emails, owner names or private match text. Keep it that way when connecting real data.
