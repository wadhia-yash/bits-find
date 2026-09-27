# BTS Find — three-phase delivery plan

BTS Find was designed as one finished product. This document splits that product
into three progressive deliverables, and the codebase implements the split: one
number in `app.json` decides which phase the build behaves as.

```bash
npm run phase          # what is configured right now
npm run phase -- 1     # Initial POC
npm run phase -- 2     # Advanced POC
npm run phase -- 3     # Capstone
npm start              # restart Metro after switching

npm run verify         # asserts all three phases still behave as specified
npm run typecheck
```

Nothing is rebuilt between phases. The screens, the domain model and the
repository interfaces are the same in all three; each phase switches on more of
[`src/config/phase.ts`](../src/config/phase.ts), which is the single place the
split is defined.

---

## Phase 1 — Initial POC

**Goal of the review:** prove the idea works end to end. A student reports what
they lost, another student says "I found this", and the owner closes the loop.

### 1. Features included

- Sign in by picking one of three seeded campus accounts (no passwords).
- Campus-scoped feed of open lost requests, with keyword search.
- Report a lost item: name, category, description, last-seen zone, when.
- Lost request detail with the full description.
- **I found this item** — a private match detail sent to the owner.
- Owner verifies the match (*This is mine* / *Not mine*) and confirms the return.
- My activity: my requests and my finds.
- Profile: identity, counts, sign out.

### 2. Frontend work

Everything ships, but deliberately plain: flat navy buttons instead of the brand
gradient, no filter sheet, no alert bell, no pull-to-refresh, no photo picker, no
contact-mode radio group. `features.polishedUi` is off, which is what strips the
gradients out of the sign-in hero and the feed's call to action.

### 3. Backend work

None. `features.cloudBackend` is `false`, so `src/services/backend.ts` pins the
local branch even though `app.json` already carries a Firebase config. No
network call is made by the app in this phase.

### 4. Database / infrastructure work

None. `src/services/db.ts` runs on its in-memory driver, seeded from
[`src/services/seed.ts`](../src/services/seed.ts) on every launch, so the demo
starts from the same known state each time and nothing is written to the device.

### 5. What to demonstrate at the review

1. Sign in as **Ishita Rao (Pilani)** — the feed already has open requests.
2. Report a lost item; it appears at the top of the feed immediately.
3. Sign out, sign in as **Aarav Mehta**, open that request, tap **I found this
   item**, and send a private match detail.
4. Back as Ishita: the match is waiting → **This is mine** → **Confirm item
   returned**. The request leaves the feed and stays in My activity as Returned.
5. Sign in as **Meera Nair (Goa)** — the Pilani requests are not visible. Campus
   scoping is real, not cosmetic.
6. Relaunch the app: the data resets. This phase is a demonstration, not storage.

---

## Phase 2 — Advanced POC

**Goal of the review:** it should now feel like a working prototype — real
accounts, a real database, and a UI you would hand to a student.

### 1. Features included

Everything in Phase 1, plus:

- **Real accounts** — create an account and sign in with an institutional email
  and password, with Firebase's own verification email.
- **Filters** — category, last-seen zone, date window and status, with an active
  filter count on the button.
- **Photos** — attach a picture to a lost request, compressed on device.
- **Campus alerts** — an in-app alert feed with an unread badge, composed by the
  one privacy-safe preview builder.
- **Contact modes** — in-app, phone or institutional email, with the number
  revealed only after the owner accepts a match.
- **BITS Admin handover** — the finder can drop the item at the campus admin desk
  instead of meeting the owner.
- **Cancel a request**, **contact consent** in Profile, **reset demo data**.
- Sensitive-item warning for ID and bank cards.
- Pull to refresh; the full polished visual language.

### 2. Frontend work

`features.polishedUi` on: brand gradients, trust pills, the elevated call to
action. The filter and alert bottom sheets appear on the feed, the photo picker
and contact-mode radio group appear on the report form, and the handover choice
appears on the finder screen. All of this is existing code being switched on, not
new code.

### 3. Backend work

Firebase is introduced. `features.cloudBackend` turns on, so when `app.json`
carries a config the app runs on Firebase Auth, Cloud Firestore and Firebase
Storage through [`src/services/firebase/`](../src/services/firebase/) — and falls
back to the local repository automatically when it does not, so the build is
always demonstrable.

- Auth: sign up, sign in, email verification, session restore across cold starts.
- Firestore: `items`, `items/{id}/matches`, `handover`, `users`, `alerts`.
- Storage: item photos, with an inline-thumbnail fallback when Storage is not on
  the project's plan.

Not yet in this phase: password reset, and campus selection for online/WILP
addresses whose sub-domain names no campus.

### 4. Database / infrastructure work

- The local repository moves to **AsyncStorage**, so a device-local build keeps
  its data across relaunches.
- Firestore schema and security rules deployed —
  [`firebase/firestore.rules`](../firebase/firestore.rules) enforces campus
  scoping and keeps private match details readable only by the owner and the
  responding finder; [`firebase/storage.rules`](../firebase/storage.rules) does
  the same for images.
- Composite indexes from
  [`firebase/firestore.indexes.json`](../firebase/firestore.indexes.json).
- Setup is six values in `app.json` plus a rules deploy — see
  [`docs/FIREBASE_SETUP.md`](FIREBASE_SETUP.md).

### 5. What to demonstrate at the review

1. Create an account with a real `@…bits-pilani.ac.in` address, verify by email,
   and sign in. The domain gate rejects a personal address before the account is
   ever created.
2. Report a lost item **with a photo**; it appears on a second device signed in as
   a different student — the data is genuinely shared, not local.
3. Use the filters: category, zone, "last 24 hours", status. Show the active
   filter count and *Clear all*.
4. Open the alert bell: the preview names the item and the zone and nothing else.
5. As the finder, respond and choose **Submit to BITS Admin Department**; show the
   drop-off point on both sides.
6. As the owner, accept the match — the contact detail unlocks only now, and only
   for these two students.
7. Show a foreign-campus account being unable to read the request, and point at
   the rules file that enforces it server-side.

---

## Phase 3 — Capstone / Final product

**Goal of the review:** the finished product — stable, complete, and safe to put
in front of a campus.

### 1. Features included

Everything in Phase 2, plus:

- **Push notifications** — one privacy-safe OS banner per new lost request on your
  campus, de-duplicated so an item can never alert twice.
- **Password reset** and **resend verification** from the sign-in screen.
- **Campus selection** for online and WILP addresses that name no campus; written
  once at sign-up and never editable afterwards.
- **14-day expiry** — an unresolved request closes itself, with the countdown shown
  on the request.
- **Admin collection tracking** — the owner marks the item collected from the admin
  desk, and the handover record moves `SUBMITTED → COLLECTED`.
- **Notification preferences** — campus alerts and match updates, per account.
- Full validation and friendly error handling on every form and every Firebase
  error code.

### 2. Frontend work

The expiry countdown on the request detail, the *I collected it from Admin* action
on both the request and My activity, the notification-preference toggles in
Profile, the campus picker and the password-reset flow on sign-in. Every failure
path shows an actionable message rather than a raw error.

### 3. Backend work

- Cloud Functions —
  [`firebase/functions.example.ts`](../firebase/functions.example.ts) holds the two
  server-side jobs: the campus alert fan-out to the `campus_{campusId}` FCM topic,
  and the scheduled 14-day expiry sweep. Alert rows become server-written; the
  client stops writing them.
- Password reset and verification resend wired to Firebase Auth.
- `email_verified` is what the security rules check, so an unverified account
  reads nothing even if it gets past the screen.

### 4. Database / infrastructure work

- Rules finalised and deployed for every collection, including the handover
  records and the server-written alert rows.
- Scheduled Function for expiry; on a device-local build the same sweep runs at
  app start so behaviour matches.
- Release APK built and signed — see the build notes in the
  [README](../README.md).

### 5. What to demonstrate at the review

1. The whole loop on two physical devices, on Firebase, with a real account each.
2. A lost request published on one device raises an **OS notification banner** on
   the other, and that banner contains no phone number, ID number or match proof.
3. The complete admin-handover path: finder drops at the desk → owner marks it
   collected → owner confirms returned → the request closes.
4. Password reset: request the link, change the password, sign in again.
5. Sign up with an `@online.bits-pilani.ac.in` address and pick a campus.
6. A request whose `expiresAt` has passed shows as **Expired** and is off the feed.
7. Validation and error handling: wrong password, non-institutional address,
   unverified account, no network — each gives a message a student can act on.
8. Run [`docs/TEST_PLAN.md`](TEST_PLAN.md) end to end.

---

## Where each phase lives in the code

| Concern | File | How the phase changes it |
|---|---|---|
| Phase number + feature set | [`src/config/phase.ts`](../src/config/phase.ts) | The single source of truth |
| Switching phases | [`scripts/set-phase.js`](../scripts/set-phase.js) | Rewrites `expo.extra.phase` |
| Verification | [`scripts/verify-phases.js`](../scripts/verify-phases.js) | Runs the closed loop under all three |
| Memory vs device storage | [`src/services/db.ts`](../src/services/db.ts) | `features.persistence` picks the driver |
| Local vs Firebase | [`src/services/backend.ts`](../src/services/backend.ts) | `features.cloudBackend` gates Firebase |
| Push notifications | [`src/services/notify.ts`](../src/services/notify.ts) | `features.pushNotifications` |
| Screen-level surface | `src/screens/*` | Each control is behind its own flag |

## Feature matrix

| | Phase 1 | Phase 2 | Phase 3 |
|---|:--:|:--:|:--:|
| Persistence | memory | device | device |
| Firebase backend | — | ✓ | ✓ |
| Accounts (sign up / sign in) | — | ✓ | ✓ |
| Demo accounts | ✓ | ✓ | ✓ |
| Password reset | — | — | ✓ |
| Campus picker (online / WILP) | — | — | ✓ |
| Search | ✓ | ✓ | ✓ |
| Category / zone / date filters | — | ✓ | ✓ |
| Status filters | — | ✓ | ✓ |
| Pull to refresh | — | ✓ | ✓ |
| Item photos | — | ✓ | ✓ |
| Contact modes | — | ✓ | ✓ |
| Contact unlock on accept | — | ✓ | ✓ |
| Sensitive-item warning | — | ✓ | ✓ |
| Match → accept → returned | ✓ | ✓ | ✓ |
| BITS Admin handover | — | ✓ | ✓ |
| Admin collection tracking | — | — | ✓ |
| Cancel a request | — | ✓ | ✓ |
| In-app campus alerts | — | ✓ | ✓ |
| Push notifications | — | — | ✓ |
| Contact consent | — | ✓ | ✓ |
| Notification preferences | — | — | ✓ |
| Reset demo data | — | ✓ | ✓ |
| 14-day expiry | — | — | ✓ |
| Polished visual language | — | ✓ | ✓ |

`npm run verify` asserts this table against `src/config/phase.ts`, so the
document and the build cannot drift apart silently.
