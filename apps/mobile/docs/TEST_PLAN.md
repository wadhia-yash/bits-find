# BTS Find — test plan

Covers the seven demo-day success criteria from PRD §10, plus the rules tests from
NFR #30. Section A runs against the pilot build as it stands. Section B needs Firebase
wired up first (see [FIREBASE_MIGRATION.md](FIREBASE_MIGRATION.md)).

Set-up: two devices. Device 1 signs in as **Ishita Rao** (Pilani), device 2 as **Aarav
Mehta** (Pilani). Keep **Meera Nair** (Goa) ready for the campus-scoping check.

---

## A. Demo-day walkthrough

### A1 — Owner creates a Lost Item Request (criterion #33)

1. On device 1, tap **Report lost item**.
2. Title `Black umbrella`, category `Other`, description, zone `Library`, when `Earlier today`.
3. Publish.

**Expect:** the request appears at the top of the feed with an `Open` badge, and an
alert lands in the bell sheet. Time the whole thing — goal #5 is under 60 seconds.

### A2 — Second same-campus device receives the alert and responds (criterion #34)

1. On device 2, pull to refresh the feed. The new request is there.
2. Open it → **I found this item**.
3. Write a match detail of 12+ characters, choose **Direct to owner**, send.

**Expect:** the item's status flips to `Claim pending` on both devices; device 2 sees
*Awaiting owner* under **My activity → Items I found**.

### A3 — Different-campus user cannot read the post or image (criterion #35)

1. Sign out on device 2 and sign in as **Meera Nair** (Goa).
2. Search the feed for `umbrella`.

**Expect:** no result. The Goa feed shows only `Room keys with red keychain`. Section B2
proves the same thing at the rules layer, which is what actually enforces it.

### A4 — Finder chooses direct handover or BITS Admin (criterion #36)

Repeat A2 on `Steel water bottle with stickers`, this time picking **Submit to BITS
Admin Department**.

**Expect:** the drop-off desk for the campus is shown, and the owner's detail screen
offers **I collected it from Admin** before the return can be confirmed.

### A5 — Owner confirmation closes the loop (criterion #37)

1. On device 1, open the request → **This is mine** on the pending match.
2. For an Admin handover, tap **I collected it from Admin** first.
3. Tap **Confirm item returned**.

**Expect:** status becomes `Returned`; the request disappears from the default feed
(`All active`) but is still visible under the `Returned` filter and in **My activity**.

### A6 — Non-participants cannot see private match details (criterion #38)

1. Sign in on device 2 as a third Pilani account (`Kabir Sethi`).
2. Open a request that has a match from someone else.

**Expect:** the match text is not rendered at all — only the owner and the responding
finder get it. Section B3 is the authoritative version of this test.

### A7 — Full flow, no crashes (criterion #39)

Run A1 → A5 end to end on one Android and one iOS device. Also check:

- pull-to-refresh on the feed
- every filter chip, then **Clear all**
- reporting a sensitive item (`ID Card`) — the warning appears and no photo is required
- **Profile → Reset demo data** restores the seed state

### A8 — Expiry (rule 26)

Change `EXPIRY_DAYS` in `src/services/db.ts` to `0`, reload the app.

**Expect:** open requests move to `Expired` and leave the default feed. Set it back to
`14` afterwards.

### A9 — Accessibility (NFR #31)

Turn on TalkBack / VoiceOver and traverse the feed and the report form.

**Expect:** every card announces title, category, zone and status; every button and radio
announces its label and selected state; no tap target is under 44pt.

---

## B. Firebase rules tests (NFR #30)

Run with `@firebase/rules-unit-testing` against the emulator:

```bash
firebase emulators:exec --only firestore,storage "npm run test:rules"
```

### B1 — Unverified accounts are locked out

| Actor | Action | Expect |
|---|---|---|
| No auth | read `items/*` | denied |
| `email_verified: false` | read `items/*` | denied |
| `someone@gmail.com`, verified | read `items/*` | denied |

### B2 — Cross-campus access is denied

| Actor | Action | Expect |
|---|---|---|
| Goa student | read a Pilani `items/*` doc | denied |
| Goa student | read `items/pilani/{uid}/photo.jpg` in Storage | denied |
| Pilani student | read a Pilani `items/*` doc | allowed |
| Pilani student | create an item with `campusId: 'goa'` | denied |
| Pilani student | update their own profile's `campusId` | denied |

### B3 — Private match details

| Actor | Action | Expect |
|---|---|---|
| Item owner | read `items/{id}/matches/*` | allowed |
| Responding finder | read their own match | allowed |
| Uninvolved same-campus student | read that match | denied |
| Finder | create a match on their *own* lost request | denied |
| Finder | create a match with `matchText` under 12 chars | denied |
| Finder | change `status` to `ACCEPTED` on their own match | denied |
| Non-owner | update the item document | denied |
| Anyone | delete an item or a match | denied |

### B4 — Storage limits

| Actor | Action | Expect |
|---|---|---|
| Verified same-campus | upload a 1 MB JPEG to their own path | allowed |
| Verified same-campus | upload a 5 MB JPEG | denied |
| Verified same-campus | upload a PDF | denied |
| Verified same-campus | upload under *another* uid's path | denied |

---

## C. Non-functional checks

| NFR | Check | Target |
|---|---|---|
| #27 | Time from tapping the Feed tab to first card, on 4G | under 2 s |
| #28 | Time from **Publish** to the alert appearing on device 2 | under 30 s, 95% of 20 runs |
| #29 | Publish the same request twice in a row | exactly one alert per item |
| #32 | `grep -r "AIza" src/` | no match |
