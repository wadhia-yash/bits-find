# LnF – Admin Panel

A web dashboard for a venue operator (a cinema chain, a theme park, a campus…). It shows how well lost items are being recovered, which branches, screens and categories see the most reports, and the status of items handed in to staff.

It currently runs on **sample data**, for a made-up cinema chain called *Silverscreen Cinemas*. It is not connected to Firebase yet.

## Run it

```bash
npm install
npm run dev      # opens at http://localhost:5173
npm run build    # type-check + production build
```

## Pages

| Page | What it shows |
| --- | --- |
| **Overview** | Reported, returned, recovery rate, pending matches; a chart by branch (or by screen/area once one branch is picked); items by category; items by screen format; recent items |
| **Lost items** | Every request, filterable by status, searchable by item, category or place |
| **Handovers** | Items handed in to the venue's staff desk, how many are waiting, and the average time until the owner collects |

The branch dropdown at the top filters every page.

## How it adapts to different businesses

Everything that differs between businesses lives in one **organization config**: its name, its own words ("Branch", "Screen / area", "Guest services"), its branches, the screens/areas inside each branch (with an optional format such as 2D / 3D / IMAX / 4DX / Dolby Atmos), and its item categories.

To add a theme park, for example:

1. Copy `src/config/organizations/silverscreen.ts` to `themepark.ts` and change the names, branches, areas and categories (leave out `terms.format` and the area `format`s if there is no such idea).
2. Add it to the list in `src/config/organizations/index.ts`.

No screen needs to change. When two or more organizations exist, an organization switcher appears in the sidebar by itself.

## Folder guide

```
src/
  config/organizations/   One file per business + the list of all of them
  data/mock.ts            Sample data generated from each config (replace with Firebase later)
  types/                  Data shapes: domain, organization, stats, component props, navigation
  utils/                  Reusable helpers: formatHours, shortDate, branchName, areaName, makeRandom
  components/             StatCard, LocationChart, BarList, ItemsTable, StatusBadge, Sidebar
  pages/                  Overview, LostItems, Handovers
  routes.tsx              All navigation in one place
  stats.ts                The dashboard maths
  constants.ts            Product name, filter lists, limits
  App.tsx                 Layout, organization/branch state, route rendering
```

## Privacy

The admin panel shows only counts, statuses, categories and places. It never shows phone numbers, emails, guest names or private match text.

## Going live with real data (later)

1. Replace `src/data/mock.ts` with Firestore reads (same shapes as `src/types/domain.ts`).
2. Add admin-only access: give admin accounts a custom claim (for example `admin: true`) and update `firebase/firestore.rules` so only that organization's admins can read its data. This needs the Firebase owner (Yash).
3. Add a sign-in page.
