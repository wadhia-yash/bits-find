# BTS Find — test plan

The demo walkthrough for the proof of concept. Everything here runs on a single
device against the in-memory mock data; there is no server to set up.

Set-up: one device. You will sign in and out as different seeded students as you
go. Because the store is in memory, **relaunching the app resets everything** —
so run the whole walkthrough in one sitting.

---

## 1 — Owner creates a lost request

1. Sign in as **Ishita Rao** (Pilani).
2. Tap **Report lost item**.
3. Title `Black umbrella`, category `Other`, description of 10+ characters,
   zone `Library`, when `Earlier today`.
4. Publish.

**Expect:** the request appears at the top of the feed with an `Open` badge and a
`You` tag. Time the whole thing — filing a request should take under a minute.

## 2 — A finder responds

1. Go to **Profile → Sign out**, then sign in as **Aarav Mehta** (Pilani).
2. The umbrella is on the feed, with no `You` tag this time. Open it.
3. Tap **I found this item**, write a detail of 12+ characters, send.

**Expect:** the status flips to `Claim pending`. Under **My activity → Items I
found**, the response shows as *Awaiting owner*.

## 3 — A different campus cannot see the post

1. Sign out and sign in as **Meera Nair** (Goa).
2. Search the feed for `umbrella`.

**Expect:** no result. The Goa feed shows only `Room keys with red keychain`.
This is enforced in `itemsRepo.byCampus`, not in the screen.

## 4 — The owner verifies the match

1. Sign out and sign back in as **Ishita Rao**.
2. **My activity** shows *1 match waiting for your verification*.
3. Open the request. The finder's private detail is there, with **Not mine** and
   **This is mine**.
4. Tap **This is mine**.

**Expect:** the match badge turns `Accepted` and **Confirm item returned**
appears.

## 5 — The loop closes

1. Tap **Confirm item returned** → **Yes, returned**.

**Expect:** the request badge turns `Returned`, a green *Closed* notice appears,
and the request is gone from the feed but still listed in **My activity**.

## 6 — Rejecting a match reopens the request

1. As **Aarav Mehta**, respond to `Steel water bottle with stickers`.
2. As **Ishita Rao**, open it and tap **Not mine** → **Reject**.

**Expect:** the match reads `Rejected`, and because no other live claim is left,
the request goes back to `Open` on the feed.

## 7 — Nobody can respond to their own request

1. As **Ishita Rao**, open one of your own open requests.

**Expect:** no **I found this item** button — only the match-responses section.

## 8 — A cold start resets the demo

1. Fully close the app and reopen it.

**Expect:** you are signed out and the seed data is back to its original state.
That is intentional: this build stores nothing on the device.
