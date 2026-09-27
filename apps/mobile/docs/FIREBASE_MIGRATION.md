# Moving BTS Find onto Firebase

The pilot build stores everything on-device so the app can be demonstrated without a
backend. The code was written so that switching to Firebase touches three files and no
screen at all.

## 1. Create the project

```bash
npm install firebase
npx expo install expo-constants
firebase init firestore functions storage
```

Copy [`../firebase/firestore.rules`](../firebase/firestore.rules) and
[`../firebase/storage.rules`](../firebase/storage.rules) over the generated ones, and
[`../firebase/functions.example.ts`](../firebase/functions.example.ts) into
`functions/src/index.ts`.

Put the web config in `app.json` under `expo.extra.firebase` — never inline in a source
file, and never a service-account key (NFR #32).

```jsonc
// app.json
"extra": {
  "firebase": {
    "apiKey": "...",
    "authDomain": "bts-find.firebaseapp.com",
    "projectId": "bts-find",
    "storageBucket": "bts-find.appspot.com",
    "messagingSenderId": "...",
    "appId": "..."
  }
}
```

## 2. Replace `src/services/auth.ts`

Only two functions change shape:

| Pilot | Firebase |
|---|---|
| `sendVerificationCode(email)` returns the code | `sendSignInLinkToEmail(auth, email, actionCodeSettings)` returns `void` |
| `verifyCode(email, code)` | `signInWithEmailLink(auth, email, link)` |

`checkInstitutionalEmail()` stays exactly as it is — it is the domain gate, and it must
keep running client-side *and* in the rules (`isVerified()` repeats the same regex).

After the first sign-in, write the profile document:

```ts
await setDoc(doc(db, 'users', cred.user.uid), {
  name, email, campusId, notificationPrefs: { campusAlerts: true, matchUpdates: true },
});
await messaging().subscribeToTopic(`campus_${campusId}`);
```

`campusId` must be written once and never updated by the client — the rules reject a
change, otherwise a user could hop campuses and defeat the scoping rule.

## 3. Replace `src/services/db.ts`

Every repository function maps one-to-one:

| Pilot | Firestore |
|---|---|
| `itemsRepo.byCampus(campusId)` | `query(collection(db,'items'), where('campusId','==',campusId), orderBy('createdAt','desc'))` |
| `itemsRepo.byId(id, campusId)` | `getDoc(doc(db,'items',id))` — the rules already deny a foreign campus |
| `itemsRepo.create(input)` | `addDoc(collection(db,'items'), {...input, createdAt: serverTimestamp()})` |
| `itemsRepo.update(id, actorId, patch)` | `updateDoc(doc(db,'items',id), patch)` — the `actorId` check moves into the rules |
| `itemsRepo.expireStale()` | delete it; the scheduled Function owns this |
| `matchesRepo.forItem(itemId, ...)` | `collection(db,'items',itemId,'matches')` |
| `alertsRepo.create(...)` | delete it; `onLostItemCreated` writes the alert |

Two behaviours move server-side and should be **removed** from the client, not kept as a
fallback:

- the 14-day expiry sweep (`itemsRepo.expireStale`), and
- writing the alert document (`alertsRepo.create` inside `createLostRequest`).

Swap the `useState` collections in `AppContext` for `onSnapshot` subscriptions and the
feed becomes live; nothing else in the store changes, because every screen already reads
from the store rather than from the repository.

## 4. Images

`ReportLostScreen` already compresses to `quality: 0.5` before handing over a local URI.
Upload it and store the download URL:

```ts
const path = `items/${user.campusId}/${user.uid}/${Date.now()}.jpg`;
const blob = await (await fetch(localUri)).blob();
await uploadBytes(ref(storage, path), blob, { contentType: 'image/jpeg' });
const imageUrlOptional = await getDownloadURL(ref(storage, path));
```

The path carries the campus and the uploader, which is what lets the Storage rules deny a
cross-campus read without a document lookup.

## 5. Push

Replace the local scheduling in `src/services/notify.ts` with an FCM device token
registration; `buildAlertPreview()` stays where it is and stays the single place an alert
body is composed. The Function repeats the same stripping server-side — deliberately, so
the privacy guarantee does not depend on a client being honest.

## Checklist before the pilot

- [ ] Rules deployed (`firebase deploy --only firestore:rules,storage:rules`)
- [ ] `@firebase/rules-unit-testing` suite green — see [TEST_PLAN.md](TEST_PLAN.md) §B
- [ ] Functions deployed and the scheduler enabled
- [ ] Devices subscribed to `campus_{campusId}` on sign-in, unsubscribed on sign-out
- [ ] No API key or service-account file committed
