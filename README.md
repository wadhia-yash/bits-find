# BTS Find

Campus lost & found for BITSians — an early proof of concept.

An owner reports a lost item, it appears on their campus feed, a finder responds
with a private detail only the real finder would know, and the request closes
only when the owner confirms the item came back.

**Stack:** React Native · Expo SDK 57 · TypeScript · React Navigation

---

## Run it

```bash
npm install
npm start
```

Then scan the QR code with **Expo Go** on your phone, or press `a` for an
Android emulator / `i` for an iOS simulator.

## Signing in

There are no accounts yet. The sign-in screen offers three seeded students, and
each one shows a different part of the flow:

| Account | Campus | Useful because |
|---|---|---|
| Ishita Rao | Pilani | Owns two open lost requests |
| Aarav Mehta | Pilani | Has a pending match on Kabir's earphones |
| Meera Nair | Goa | Different campus — proves campus scoping |

All data lives in memory, so every launch starts from the same known state and
nothing is written to the device.

## What's built

| Feature | Where |
|---|---|
| Pick a demo student | [`src/screens/SignInScreen.tsx`](src/screens/SignInScreen.tsx) |
| Campus feed + keyword search | [`src/screens/HomeScreen.tsx`](src/screens/HomeScreen.tsx) |
| Report a lost item | [`src/screens/ReportLostScreen.tsx`](src/screens/ReportLostScreen.tsx) |
| Request detail + *I found this item* | [`src/screens/ItemDetailScreen.tsx`](src/screens/ItemDetailScreen.tsx) |
| Private match detail | [`src/screens/IFoundThisScreen.tsx`](src/screens/IFoundThisScreen.tsx) |
| My activity + confirm Returned | [`src/screens/MyActivityScreen.tsx`](src/screens/MyActivityScreen.tsx) |
| Profile + sign out | [`src/screens/ProfileScreen.tsx`](src/screens/ProfileScreen.tsx) |

## Layout

```
src/
  types.ts               the domain model
  theme.ts               colours, spacing, 44pt touch target
  services/
    db.ts                the only module that touches storage (in memory)
    auth.ts              demo sign-in and session
    seed.ts              demo data for two campuses
  store/AppContext.tsx   every OPEN → CLAIM_PENDING → RETURNED transition
  components/            UI primitives + feed card
  screens/               the six screens
  navigation/            tabs + stack
docs/
  TEST_PLAN.md           the demo success criteria, as steps
```

## The two rules this POC does enforce

1. **Campus-only.** [`itemsRepo.byCampus`](src/services/db.ts) is the only feed
   read, and `itemsRepo.byId` returns nothing for a foreign campus. A Goa
   account cannot see a Pilani post even by deep link.
2. **Closed loop.** `RETURNED` is reachable only through the owner's own
   confirmation, and only the owner can edit their request.

## What is deliberately not here yet

Real accounts and verified institutional sign-in, a server and database, photos,
filters, campus alerts and push notifications, the BITS Admin handover route,
and the 14-day expiry sweep. This build is about proving the core loop.

## Building an APK

```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`.
