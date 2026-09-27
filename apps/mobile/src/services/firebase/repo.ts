/**
 * Cloud Firestore implementation of the repositories.
 *
 * Deliberately the same shape as src/services/db.ts so the store can swap
 * backends without any screen knowing. Timestamps stay ISO-8601 UTC strings
 * rather than Firestore Timestamps: the domain types are shared with the local
 * backend, and ISO strings sort lexicographically, so range queries on
 * `expiresAt` and `createdAt` still work.
 */

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { firebaseDb, firebaseStorage } from './config';
import {
  CampusAlert,
  CampusId,
  Handover,
  Item,
  Match,
  User,
} from '../../types';

const EXPIRY_DAYS = 14;

function nowIso(): string {
  return new Date().toISOString();
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/* ------------------------------------------------------------------ users */

export const usersRepo = {
  async byId(uid: string): Promise<User | undefined> {
    const snap = await getDoc(doc(firebaseDb(), 'users', uid));
    if (!snap.exists()) return undefined;
    const d = snap.data();
    return {
      uid,
      name: d.name,
      email: d.email,
      campusId: d.campusId,
      phoneOptional: d.phoneOptional ?? undefined,
      notificationPrefs: d.notificationPrefs ?? { campusAlerts: true, matchUpdates: true },
      emailVerified: true,
    };
  },

  /** campusId and email are omitted on purpose — the rules reject changes to them. */
  async update(uid: string, patch: Partial<User>): Promise<void> {
    const writable: Record<string, unknown> = {};
    if (patch.name !== undefined) writable.name = patch.name;
    if (patch.notificationPrefs !== undefined) writable.notificationPrefs = patch.notificationPrefs;
    // Firestore rejects undefined, so an unset number is stored as null.
    if ('phoneOptional' in patch) writable.phoneOptional = patch.phoneOptional ?? null;
    if (Object.keys(writable).length === 0) return;
    await updateDoc(doc(firebaseDb(), 'users', uid), writable);
  },
};

/* ------------------------------------------------------------------ items */

function toItem(id: string, d: Record<string, any>): Item {
  return {
    id,
    campusId: d.campusId,
    ownerId: d.ownerId,
    ownerName: d.ownerName,
    title: d.title,
    description: d.description,
    category: d.category,
    imageUrlOptional: d.imageUrlOptional ?? undefined,
    lastSeenZone: d.lastSeenZone,
    lostAt: d.lostAt,
    contactMode: d.contactMode,
    status: d.status,
    createdAt: d.createdAt,
    expiresAt: d.expiresAt,
  };
}

export const itemsRepo = {
  /**
   * Campus-scoped feed. The where() clause matches the security rule, so a
   * query for another campus fails at the server rather than returning rows.
   */
  async byCampus(campusId: CampusId): Promise<Item[]> {
    const q = query(
      collection(firebaseDb(), 'items'),
      where('campusId', '==', campusId),
      orderBy('createdAt', 'desc'),
      limit(200),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => toItem(d.id, d.data()));
  },

  async byId(id: string, campusId: CampusId): Promise<Item | undefined> {
    const snap = await getDoc(doc(firebaseDb(), 'items', id));
    if (!snap.exists()) return undefined;
    const item = toItem(snap.id, snap.data());
    return item.campusId === campusId ? item : undefined;
  },

  async create(
    input: Omit<Item, 'id' | 'createdAt' | 'expiresAt' | 'status'>,
  ): Promise<Item> {
    const createdAt = nowIso();
    const payload = {
      ...input,
      imageUrlOptional: input.imageUrlOptional ?? null,
      status: 'OPEN' as const,
      createdAt,
      expiresAt: addDays(createdAt, EXPIRY_DAYS),
    };
    const written = await addDoc(collection(firebaseDb(), 'items'), payload);
    return { ...payload, id: written.id, imageUrlOptional: input.imageUrlOptional };
  },

  /** Ownership is enforced by the rules; the actorId argument keeps parity. */
  async update(id: string, _actorId: string, patch: Partial<Item>): Promise<void> {
    await updateDoc(doc(firebaseDb(), 'items', id), patch as Record<string, unknown>);
  },

  /** Owned by the scheduled Cloud Function server-side — a no-op on the client. */
  async expireStale(): Promise<number> {
    return 0;
  },
};

/* ---------------------------------------------------------------- matches */

function toMatch(id: string, itemId: string, d: Record<string, any>): Match {
  return {
    id,
    itemId,
    finderId: d.finderId,
    finderName: d.finderName,
    matchText: d.matchText,
    handoverMode: d.handoverMode,
    adminDropoffStatus: d.adminDropoffStatus,
    status: d.status,
    createdAt: d.createdAt,
    completedAt: d.completedAt ?? undefined,
  };
}

export const matchesRepo = {
  /**
   * Reads the sub-collection of one item. The rules already restrict this to
   * the owner and the responding finder, so an uninvolved student gets a
   * permission error rather than filtered rows.
   */
  async forItem(itemId: string): Promise<Match[]> {
    try {
      const snap = await getDocs(collection(firebaseDb(), 'items', itemId, 'matches'));
      return snap.docs
        .map((d) => toMatch(d.id, itemId, d.data()))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch {
      // Denied read == "no matches you are allowed to see".
      return [];
    }
  },

  async create(input: Omit<Match, 'id' | 'createdAt' | 'status'>): Promise<Match> {
    const createdAt = nowIso();
    const payload = {
      finderId: input.finderId,
      finderName: input.finderName,
      matchText: input.matchText,
      handoverMode: input.handoverMode,
      adminDropoffStatus: input.adminDropoffStatus,
      status: 'PENDING' as const,
      createdAt,
    };
    const written = await addDoc(
      collection(firebaseDb(), 'items', input.itemId, 'matches'),
      payload,
    );
    return { ...payload, id: written.id, itemId: input.itemId };
  },

  async update(itemId: string, matchId: string, patch: Partial<Match>): Promise<void> {
    const writable = { ...patch } as Record<string, unknown>;
    delete writable.id;
    delete writable.itemId;
    await updateDoc(doc(firebaseDb(), 'items', itemId, 'matches', matchId), writable);
  },
};

/* -------------------------------------------------------------- handovers */

export const handoversRepo = {
  async forItem(itemId: string): Promise<Handover[]> {
    try {
      const q = query(collection(firebaseDb(), 'handover'), where('itemId', '==', itemId));
      const snap = await getDocs(q);
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          itemId: data.itemId,
          matchId: data.matchId,
          finderId: data.finderId,
          mode: data.mode,
          adminLocationOptional: data.adminLocationOptional ?? undefined,
          submittedAt: data.submittedAt,
          collectedAt: data.collectedAt ?? undefined,
          status: data.status,
        } as Handover;
      });
    } catch {
      return [];
    }
  },

  async create(input: Omit<Handover, 'id' | 'submittedAt'>): Promise<Handover> {
    const submittedAt = nowIso();
    const payload = {
      ...input,
      adminLocationOptional: input.adminLocationOptional ?? null,
      collectedAt: null,
      submittedAt,
    };
    const written = await addDoc(collection(firebaseDb(), 'handover'), payload);
    return { ...input, id: written.id, submittedAt };
  },

  async update(id: string, patch: Partial<Handover>): Promise<void> {
    await updateDoc(doc(firebaseDb(), 'handover', id), patch as Record<string, unknown>);
  },
};

/* ----------------------------------------------------------------- alerts */

export const alertsRepo = {
  async byCampus(campusId: CampusId): Promise<CampusAlert[]> {
    try {
      const q = query(
        collection(firebaseDb(), 'alerts'),
        where('campusId', '==', campusId),
        orderBy('createdAt', 'desc'),
        limit(50),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          campusId: data.campusId,
          itemId: data.itemId,
          title: data.title,
          body: data.body,
          createdAt:
            typeof data.createdAt === 'string'
              ? data.createdAt
              : (data.createdAt?.toDate?.()?.toISOString() ?? nowIso()),
          read: false,
        } as CampusAlert;
      });
    } catch {
      return [];
    }
  },
};

/* ---------------------------------------------------------------- storage */

/**
 * Uploads a locally-picked image. The path encodes campus and uploader so the
 * Storage rules can deny a cross-campus read without a Firestore lookup.
 */
export async function uploadItemImage(
  localUri: string,
  campusId: CampusId,
  uid: string,
): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const path = `items/${campusId}/${uid}/${Date.now()}.jpg`;
  const storageRef = ref(firebaseStorage(), path);
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
  return getDownloadURL(storageRef);
}

/** Seeding is a local-pilot concern; on Firebase the data is real. */
export const dbAdmin = {
  async reset(): Promise<void> {
    throw new Error('Demo reset is only available in the on-device pilot build.');
  },
};

export { setDoc };
