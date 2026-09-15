# BTS Find

Campus lost & found mobile app for BITSians — built from the *BITSFind Lost & Found PRD v1.2*.

An owner reports a lost item, the campus gets one privacy-safe alert, a finder responds
with a private match detail, and the item comes back either directly or through the BITS
Admin Department. The request closes only when the owner confirms.

**Stack:** React Native · Expo SDK 57 · TypeScript · React Navigation · AsyncStorage
(pilot persistence, swappable for Firebase — see [`docs/FIREBASE_MIGRATION.md`](docs/FIREBASE_MIGRATION.md))

---

## Run it

```bash
npm install
npm start
```

Then scan the QR code with **Expo Go** on your phone, or press `a` for an Android
emulator / `i` for an iOS simulator.

## Three phases, one codebase

The project is delivered in three progressive phases, and the build switches
between them with one number. Full breakdown — features, frontend work, backend
work, database work and what to show at each review — is in
[`docs/PHASE_PLAN.md`](docs/PHASE_PLAN.md).

| | What it is | Data | Backend |
|---|---|---|---|
| **Phase 1** | Initial POC — the core loop, plainly | in-memory mock data | none |
| **Phase 2** | Advanced POC — polished, real accounts | device / Firestore | Firebase |
| **Phase 3** | Capstone — the finished product | Firestore | Firebase + Functions |

```bash
npm run phase          # show the configured phase
npm run phase -- 1     # switch, then restart Metro
npm run verify         # run the closed loop under all three phases
npm run typecheck
```

Switching a phase edits `expo.extra.phase` in `app.json`; nothing else changes.
Every gate is derived in one file, [`src/config/phase.ts`](src/config/phase.ts).

## Signing in

Sign-in is restricted to `@*.bits-pilani.ac.in` addresses and your campus is derived from
the sub-domain. Email delivery is not wired up in the pilot build, so the 6-digit code is
shown on screen after you request it.

For the two-device demo there are three seeded accounts on the sign-in screen:

| Account | Campus | Useful because |
|---|---|---|
| Ishita Rao | Pilani | Owns two open lost requests |
| Aarav Mehta | Pilani | Has a pending match on Kabir's earphones |
| Meera Nair | Goa | Different campus — proves campus scoping |

## What's built

| PRD feature | Where |
|---|---|
| Verified sign-in + campus profile | [`src/screens/SignInScreen.tsx`](src/screens/SignInScreen.tsx), [`src/services/auth.ts`](src/services/auth.ts) |
| Lost requests feed | [`src/screens/HomeScreen.tsx`](src/screens/HomeScreen.tsx) |
| Create lost request (photo, zone, time, contact mode) | [`src/screens/ReportLostScreen.tsx`](src/screens/ReportLostScreen.tsx) |
| Campus alert (privacy-safe preview) | [`src/services/notify.ts`](src/services/notify.ts) |
| Search & filters (keyword, category, zone, date, status) | [`src/screens/HomeScreen.tsx`](src/screens/HomeScreen.tsx) |
| Lost request detail + *I Found This Item* | [`src/screens/ItemDetailScreen.tsx`](src/screens/ItemDetailScreen.tsx) |
| Finder match + handover choice | [`src/screens/IFoundThisScreen.tsx`](src/screens/IFoundThisScreen.tsx) |
| My activity + confirm Returned | [`src/screens/MyActivityScreen.tsx`](src/screens/MyActivityScreen.tsx) |
| BITS Admin handover tracking | [`src/store/AppContext.tsx`](src/store/AppContext.tsx), [`src/types.ts`](src/types.ts) |
| Profile, contact consent, notification prefs | [`src/screens/ProfileScreen.tsx`](src/screens/ProfileScreen.tsx) |

## Layout

```
src/
  types.ts               domain model — mirrors the PRD §7.2 Firestore paths
  theme.ts               colours, spacing, 44pt touch target
  config/phase.ts        which phase this build is, and what that turns on
  services/
    db.ts                the only module that touches persistence
    auth.ts              institutional email check + verification
    notify.ts            campus alert composition (privacy rule lives here)
    seed.ts              demo data for two campuses
  store/AppContext.tsx   every OPEN → CLAIM_PENDING → RETURNED transition
  components/            UI primitives + feed card
  screens/               the seven screens from PRD §6
  navigation/            tabs + stack
firebase/
  firestore.rules        campus scoping + private match details
  storage.rules          same-campus image reads only
  functions.example.ts   campus alert fan-out + 14-day expiry sweep
scripts/
  set-phase.js           npm run phase -- 1 | 2 | 3
  verify-phases.js       npm run verify — the closed loop, under all three
docs/
  PHASE_PLAN.md          the three deliverables, and what to demo at each
  FIREBASE_MIGRATION.md  how to move off AsyncStorage
  TEST_PLAN.md           the demo-day success criteria, as steps
```

## The privacy rules, and where they are enforced

1. **Campus-only** — [`itemsRepo.byCampus`](src/services/db.ts) is the only feed read, and
   `itemsRepo.byId` returns nothing for a foreign campus. Mirrored by
   [`firebase/firestore.rules`](firebase/firestore.rules).
2. **Privacy-safe pushes** — alert bodies are composed in exactly one place,
   `buildAlertPreview`, which strips phone-shaped and long numeric strings.
3. **Sensitive items** — ID cards and bank cards can be posted with no photo, and the
   report form warns about covering numbers and QR codes.
4. **Contact unlock** — an owner's phone number is shared only after they accept a match,
   and only with that finder.
5. **Closed loop** — `RETURNED` is reachable only via the owner's confirmation.

## Two backends, one app

From Phase 2 on, the app picks its backend at startup from `expo.extra.firebase`
in `app.json`:

| Phase | Config in app.json | Backend | What you get |
|---|---|---|---|
| 1 | anything | In-memory mock store | Demo accounts, reset on every launch |
| 2–3 | Real values | Firebase Auth + Firestore + Storage | Real accounts, shared data across devices |
| 2–3 | Still `PASTE_…` | On-device pilot store | Demo accounts, data local to each device |

Both go through [`src/services/backend.ts`](src/services/backend.ts), so no screen
knows which one is live. To switch on Firebase, follow
[`docs/FIREBASE_SETUP.md`](docs/FIREBASE_SETUP.md) — it is six values pasted into
`app.json` plus a rules deploy; no code changes.

**Sign-in is email and password, in-app.** No Google sign-in, no browser redirect.
The institutional-domain gate runs before the account is created, Firebase sends
its own verification email, and `email_verified` is what the security rules check —
so an unverified account reads nothing even if it gets past the screen.

Push notifications are a Phase 3 deliverable, and the one piece still outstanding
on Firebase: deploy
[`firebase/functions.example.ts`](firebase/functions.example.ts) for the campus
alert fan-out and the 14-day expiry sweep. Without it everything else works; you
just do not get an OS banner.

## Building an APK

```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`.

Two things that will bite you on Windows:

- **Build from a path with no spaces.** React Native's Gradle plugin fails on
  `C:\...\BTS Find\`. Copy the project to e.g. `C:\btsfind_build` and build there.
- **`android/local.properties` must use forward slashes** —
  `sdk.dir=C:/Users/<you>/AppData/Local/Android/Sdk`. Backslashes are escape
  characters in a `.properties` file and silently corrupt the path.

The release build is signed with the debug keystore, which is fine for sideloading
but not for the Play Store.
