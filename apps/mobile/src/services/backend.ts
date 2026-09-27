/**
 * Backend facade.
 *
 * The store talks only to this module. From Phase 2 on, when app.json carries a
 * Firebase config, every call goes to Firestore/Auth/Storage; otherwise it goes
 * to the local pilot backend. Both branches return the same domain types, so no
 * screen ever learns which one is live.
 *
 * Phase 1 pins the local branch regardless of what app.json holds — the initial
 * POC is meant to run with no backend infrastructure at all.
 */

import { collectionGroup, getDocs, query, where } from 'firebase/firestore';

import { CampusAlert, CampusId, Handover, Item, Match, User } from '../types';
import { features } from '../config/phase';
import { firebaseEnabled, firebaseDb } from './firebase/config';
import { makeThumbnail } from './images';

import * as localAuth from './auth';
import {
  alertsRepo as localAlerts,
  dbAdmin as localDbAdmin,
  handoversRepo as localHandovers,
  itemsRepo as localItems,
  matchesRepo as localMatches,
  usersRepo as localUsers,
} from './db';
import { seedIfEmpty } from './seed';

import * as fbAuth from './firebase/auth';
import {
  alertsRepo as fbAlerts,
  handoversRepo as fbHandovers,
  itemsRepo as fbItems,
  matchesRepo as fbMatches,
  uploadItemImage,
  usersRepo as fbUsers,
} from './firebase/repo';

/** Firebase runs only from the phase that introduces the backend onwards. */
export const isFirebase = features.cloudBackend && firebaseEnabled;

/* ------------------------------------------------------------------- auth */

export const auth = {
  /** Only the Firebase backend can create real accounts. */
  supportsAccounts: isFirebase && features.accounts,

  /** Phase 3 adds the self-service recovery paths. */
  supportsPasswordReset: isFirebase && features.passwordReset,

  async signUp(input: {
    name: string;
    email: string;
    password: string;
    campusId?: CampusId;
  }): Promise<void> {
    if (!isFirebase) {
      throw new Error(
        'Account creation needs Firebase. This build is running the on-device pilot backend.',
      );
    }
    return fbAuth.signUp(input);
  },

  async signIn(email: string, password: string): Promise<User> {
    if (!isFirebase) {
      throw new Error('Password sign-in needs Firebase. Use a demo account instead.');
    }
    return fbAuth.signIn(email, password);
  },

  async refreshVerification(): Promise<User | null> {
    if (!isFirebase) return null;
    return fbAuth.refreshVerification();
  },

  async resendVerification(): Promise<void> {
    if (!isFirebase) return;
    return fbAuth.resendVerification();
  },

  async resetPassword(email: string): Promise<void> {
    if (!isFirebase) throw new Error('Password reset needs Firebase.');
    if (!features.passwordReset) {
      throw new Error('Password reset arrives in Phase 3 of this build.');
    }
    return fbAuth.resetPassword(email);
  },

  async signInDemo(uid: string): Promise<User> {
    if (isFirebase) throw new Error('Demo accounts exist only in the on-device pilot build.');
    return localAuth.signInSeededUser(uid);
  },

  async signOut(): Promise<void> {
    if (isFirebase) return fbAuth.signOut();
    return localAuth.signOut();
  },

  /**
   * Restores a session on cold start. Firebase pushes updates, so it returns an
   * unsubscribe; the local backend resolves once and returns a no-op.
   */
  observeSession(cb: (user: User | null) => void): () => void {
    if (isFirebase) return fbAuth.observeSession(cb);
    localAuth.restoreSession().then(cb);
    return () => {};
  },
};

/* ------------------------------------------------------------------- boot */

/** Pilot-only: seed demo data and run the expiry sweep the Function owns in prod. */
export async function prepare(): Promise<void> {
  if (isFirebase) return;
  await seedIfEmpty();
  // The 14-day sweep is a Phase 3 rule; before that a request never expires.
  if (features.expirySweep) await localItems.expireStale();
}

/* ------------------------------------------------------------------ items */

export const items = {
  byCampus(campusId: CampusId): Promise<Item[]> {
    return isFirebase ? fbItems.byCampus(campusId) : localItems.byCampus(campusId);
  },

  byId(id: string, campusId: CampusId): Promise<Item | undefined> {
    return isFirebase ? fbItems.byId(id, campusId) : localItems.byId(id, campusId);
  },

  async create(input: Omit<Item, 'id' | 'createdAt' | 'expiresAt' | 'status'>): Promise<Item> {
    return isFirebase ? fbItems.create(input) : localItems.create(input);
  },

  async update(id: string, actorId: string, patch: Partial<Item>): Promise<void> {
    if (isFirebase) await fbItems.update(id, actorId, patch);
    else await localItems.update(id, actorId, patch);
  },
};

/* ---------------------------------------------------------------- matches */

export const matches = {
  /**
   * Every match the signed-in user is entitled to see: the ones on their own
   * requests, plus the ones they submitted as a finder. On Firestore that is a
   * per-item read for owned requests and one collection-group query for the
   * rest — never a scan, which is also all the rules would allow.
   */
  async forUser(uid: string, visibleItems: Item[]): Promise<Match[]> {
    if (!isFirebase) {
      const all = await localMatches.all();
      const ownerByItem = new Map(visibleItems.map((i) => [i.id, i.ownerId]));
      return all.filter(
        (m) =>
          ownerByItem.has(m.itemId) &&
          (ownerByItem.get(m.itemId) === uid || m.finderId === uid),
      );
    }

    const owned = visibleItems.filter((i) => i.ownerId === uid);
    const ownedMatches = (await Promise.all(owned.map((i) => fbMatches.forItem(i.id)))).flat();

    let mine: Match[] = [];
    try {
      const snap = await getDocs(
        query(collectionGroup(firebaseDb(), 'matches'), where('finderId', '==', uid)),
      );
      mine = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          // matches live at items/{itemId}/matches/{matchId}
          itemId: d.ref.parent.parent!.id,
          finderId: data.finderId,
          finderName: data.finderName,
          matchText: data.matchText,
          handoverMode: data.handoverMode,
          adminDropoffStatus: data.adminDropoffStatus,
          status: data.status,
          createdAt: data.createdAt,
          completedAt: data.completedAt ?? undefined,
        } as Match;
      });
    } catch {
      // Missing composite index or denied read — owned matches still render.
      mine = [];
    }

    const byId = new Map<string, Match>();
    [...ownedMatches, ...mine].forEach((m) => byId.set(m.id, m));
    return [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async create(input: Omit<Match, 'id' | 'createdAt' | 'status'>): Promise<Match> {
    return isFirebase ? fbMatches.create(input) : localMatches.create(input);
  },

  async update(itemId: string, matchId: string, patch: Partial<Match>): Promise<void> {
    if (isFirebase) await fbMatches.update(itemId, matchId, patch);
    else await localMatches.update(matchId, patch);
  },
};

/* -------------------------------------------------------------- handovers */

export const handovers = {
  async forItems(visibleItems: Item[]): Promise<Handover[]> {
    if (!isFirebase) {
      const all = await localHandovers.all();
      const ids = new Set(visibleItems.map((i) => i.id));
      return all.filter((h) => ids.has(h.itemId));
    }
    const lists = await Promise.all(visibleItems.map((i) => fbHandovers.forItem(i.id)));
    return lists.flat();
  },

  async forItem(itemId: string): Promise<Handover[]> {
    return isFirebase ? fbHandovers.forItem(itemId) : localHandovers.forItem(itemId);
  },

  async create(input: Omit<Handover, 'id' | 'submittedAt'>): Promise<Handover> {
    return isFirebase ? fbHandovers.create(input) : localHandovers.create(input);
  },

  async update(id: string, patch: Partial<Handover>): Promise<void> {
    if (isFirebase) await fbHandovers.update(id, patch);
    else await localHandovers.update(id, patch);
  },
};

/* ----------------------------------------------------------------- alerts */

export const alerts = {
  async byCampus(campusId: CampusId): Promise<CampusAlert[]> {
    if (!features.campusAlerts) return [];
    return isFirebase ? fbAlerts.byCampus(campusId) : localAlerts.byCampus(campusId);
  },

  /** On Firebase the alert row is written by the Cloud Function, not the client. */
  async create(input: Omit<CampusAlert, 'id' | 'createdAt' | 'read'>): Promise<void> {
    if (isFirebase || !features.campusAlerts) return;
    await localAlerts.create(input);
  },

  async markAllRead(campusId: CampusId): Promise<void> {
    if (isFirebase || !features.campusAlerts) return;
    await localAlerts.markAllRead(campusId);
  },
};

/* ------------------------------------------------------------------ users */

export const users = {
  async update(uid: string, patch: Partial<User>, current: User): Promise<void> {
    if (isFirebase) await fbUsers.update(uid, patch);
    else await localUsers.upsert({ ...current, ...patch, uid });
  },
};

/* ---------------------------------------------------------------- storage */

/**
 * Returns something the app can persist and every device can render.
 *
 * Firebase Storage requires a paid plan on projects created after October 2024,
 * so it is treated as optional: the first failure is remembered and the photo
 * falls back to a compressed thumbnail stored inline on the item document. The
 * local file URI is never persisted on Firebase — it would resolve on the
 * author's phone and nowhere else.
 */
let storageUnavailable = false;

export async function uploadImage(
  localUri: string | undefined,
  campusId: CampusId,
  uid: string,
): Promise<string | undefined> {
  if (!localUri) return undefined;
  if (!isFirebase) return localUri;

  if (!storageUnavailable) {
    try {
      return await uploadItemImage(localUri, campusId, uid);
    } catch {
      storageUnavailable = true;
    }
  }

  const thumbnail = await makeThumbnail(localUri);
  return thumbnail?.dataUri;
}

export const demoData = {
  supported: !isFirebase && features.demoReset,

  /**
   * Clears the device store and puts the demo data straight back.
   *
   * The re-seed is not optional: reset() wipes the `seeded` flag along with
   * everything else, and prepare() only runs once at boot — without it the demo
   * accounts stay gone until the app is restarted, and signing back in fails
   * with "Demo account not found".
   */
  async reset(): Promise<void> {
    await localDbAdmin.reset();
    await seedIfEmpty();
  },
};
