# Connecting BTS Find to Firebase

The code is already written. The app checks `expo.extra.firebase` in `app.json` on
startup: when a real config is there it runs against Firebase Auth, Firestore and
Storage; when it still says `PASTE_…` it runs the on-device pilot backend instead.
So this whole document is about producing six strings and pasting them in.

Everything here needs a Google account, which is why it cannot be automated.

---

## 1. Create the project (about 3 minutes)

1. Go to <https://console.firebase.google.com> and sign in.
2. **Add project** → name it `BTS Find` → Continue.
3. Google Analytics: **turn it off**. Nothing in this app uses it.
4. Wait for "Your new project is ready" → Continue.

## 2. Register the Android app

1. On the project home page, click the **Android** icon.
2. **Android package name** — this must match exactly:
   ```
   in.acin.bitspilani.btsfind
   ```
3. Nickname: `BTS Find`. Leave the SHA-1 field empty — the app uses email and
   password, not Google sign-in, so no SHA-1 is needed.
4. **Register app** → then **skip** the `google-services.json` download and all the
   Gradle instructions. This project uses the Firebase JS SDK, not the native one,
   so that file is not used.

## 3. Copy the six config values

1. Gear icon (top-left) → **Project settings**.
2. Scroll to **Your apps** → under the app you just made, choose **Config**.
3. You will see a block like this:

   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy…",
     authDomain: "bts-find-xxxxx.firebaseapp.com",
     projectId: "bts-find-xxxxx",
     storageBucket: "bts-find-xxxxx.firebasestorage.app",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abc123def456"
   };
   ```

4. Paste those six values into `app.json`, replacing the `PASTE_…` placeholders:

   ```jsonc
   "extra": {
     "firebase": {
       "apiKey": "AIzaSy…",
       "authDomain": "bts-find-xxxxx.firebaseapp.com",
       "projectId": "bts-find-xxxxx",
       "storageBucket": "bts-find-xxxxx.firebasestorage.app",
       "messagingSenderId": "123456789012",
       "appId": "1:123456789012:web:abc123def456"
     }
   }
   ```

> These six values are not secrets — Firebase ships them inside every client app.
> What actually protects the data is the security rules in step 6. A service
> account key *is* a secret; never put one in this project.

## 4. Turn on Email/Password sign-in

1. Left sidebar → **Build → Authentication** → **Get started**.
2. **Sign-in method** tab → **Email/Password** → enable the first toggle
   (leave "Email link / passwordless" off) → **Save**.

That is the only provider the app uses. There is no Google sign-in and no
browser redirect anywhere in the flow.

## 5. Create Firestore and Storage

**Firestore:** Build → **Firestore Database** → Create database → choose a region
near you (`asia-south1` for India) → start in **production mode**. The rules from
step 6 replace the default ones.

**Storage:** Build → **Storage** → Get started → same region → production mode.

## 6. Deploy the rules and indexes

Without this step every read and write is denied, and the campus-scoping and
privacy guarantees are not actually enforced.

Easiest route, from a terminal in the project folder:

```bash
npm install -g firebase-tools
firebase login
firebase init firestore storage      # pick the project you just created
```

When it asks about rules and index files, point it at the ones already in this
repo (or overwrite the generated ones with them):

| Prompt | Answer |
|---|---|
| Firestore rules file | `firebase/firestore.rules` |
| Firestore indexes file | `firebase/firestore.indexes.json` |
| Storage rules file | `firebase/storage.rules` |

Then:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage:rules
```

If you would rather not install the CLI, you can paste the contents of
`firebase/firestore.rules` and `firebase/storage.rules` into the **Rules** tab of
each product in the console and publish. The indexes then get created on demand —
Firestore prints a one-click link in the app's error log the first time a query
needs one.

## 7. Restart and check

```bash
npx expo start --clear
```

`--clear` matters: `app.json` is read at bundle time, so a cached bundle keeps the
old config.

You will know it worked when the sign-in screen shows **Sign in / Create account**
with a password field instead of the demo-account buttons, and Profile shows
`v1.0 · Firebase` at the bottom.

## 8. First accounts

Create two accounts on the same campus, on two devices:

- `f20220123@pilani.bits-pilani.ac.in`
- `f20210456@pilani.bits-pilani.ac.in`

Each gets a verification email from Firebase. Open the link, return to the app and
tap **I have verified — continue**. Until that link is clicked the account can
read nothing: the rules require `email_verified`, not just a matching domain.

For the cross-campus check in the demo, make a third account on a different
campus, e.g. `f20220999@goa.bits-pilani.ac.in`.

---

## What is left after this

Push notifications still need Cloud Functions deployed —
`firebase/functions.example.ts` has the campus-alert fan-out and the 14-day expiry
sweep. Without them the app still writes and reads everything correctly; you just
do not get an OS banner, and requests do not auto-expire.

## Troubleshooting

| Symptom | Cause |
|---|---|
| Still shows demo accounts | A `PASTE_…` value is left in `app.json`, or the bundle was not restarted with `--clear` |
| `Missing or insufficient permissions` | Rules not deployed, or the account has not clicked its verification link |
| `The query requires an index` | Open the link in the error — it creates the index in one click |
| Feed is empty on a second device | The two accounts are on different campuses. That is the campus-scoping rule doing its job |
| Verification email never arrives | Check spam; Firebase's free tier sends from `noreply@<project>.firebaseapp.com` |
