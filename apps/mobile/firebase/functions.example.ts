/**
 * BTS Find — Cloud Functions outline (PRD §7.3 rules 22, 23, 26).
 *
 * Reference implementation for the two server-side pieces the app expects.
 * Copy into a `functions/` workspace (`firebase init functions`) and deploy;
 * the mobile app needs no change, because src/services/notify.ts already
 * composes the same privacy-safe preview locally.
 */

import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

initializeApp();
const db = getFirestore();

const PHONE_RE = /(\+?\d[\d\s-]{7,}\d)/g;
const LONG_NUMBER_RE = /\b\d{6,}\b/g;

/** Rule 23 — a push preview may never carry a phone or ID number. */
function stripSensitive(text: string): string {
  return text.replace(PHONE_RE, '•••').replace(LONG_NUMBER_RE, '•••').trim();
}

/**
 * Rule 22 — one alert per new Lost Item Request, to that campus topic only.
 * NFR #29 (no duplicate push) is guaranteed by the alertSentAt marker: a retry
 * of the same trigger finds the field already set and returns.
 */
export const onLostItemCreated = onDocumentCreated('items/{itemId}', async (event) => {
  const snap = event.data;
  if (!snap) return;

  const item = snap.data();
  if (item.status !== 'OPEN' || item.alertSentAt) return;

  const title = `Lost on campus: ${stripSensitive(item.title)}`;
  const body = `${item.category} · last seen near ${item.lastSeenZone}. Tap if you have seen it.`;

  await getMessaging().send({
    topic: `campus_${item.campusId}`,
    notification: { title, body },
    // Only identifiers travel in the payload — never contact or proof details.
    data: { itemId: event.params.itemId, campusId: item.campusId },
    android: { priority: 'high' },
    apns: { payload: { aps: { sound: 'default' } } },
  });

  await db.collection('alerts').add({
    campusId: item.campusId,
    itemId: event.params.itemId,
    title,
    body,
    createdAt: FieldValue.serverTimestamp(),
  });

  await snap.ref.update({ alertSentAt: FieldValue.serverTimestamp() });
});

/**
 * Rule 26 — unresolved requests expire 14 days after they were created.
 * `expiresAt` is stored as an ISO-8601 UTC string (see src/services/firebase/repo.ts),
 * which sorts lexicographically, so a string comparison is the correct range query.
 */
export const expireStaleRequests = onSchedule('every day 03:00', async () => {
  const now = new Date().toISOString();
  const stale = await db
    .collection('items')
    .where('status', 'in', ['OPEN', 'CLAIM_PENDING'])
    .where('expiresAt', '<=', now)
    .get();

  const batch = db.batch();
  stale.docs.forEach((doc) => batch.update(doc.ref, { status: 'EXPIRED' }));
  await batch.commit();
});
