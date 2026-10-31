/**
 * Local repository.
 *
 * Backed by an in-memory map in Phase 1 and by AsyncStorage from Phase 2 on —
 * see the storage driver below.
 *
 * This is the ONLY module that talks to persistence. Every function here has a
 * one-to-one Firestore equivalent (see docs/FIREBASE_MIGRATION.md), so moving
 * the project onto Cloud Firestore is a swap of this file — screens never
 * import storage directly.
 *
 * Campus scoping (PRD §4.1 rule 13) is enforced on every read that returns
 * other users' data, mirroring the security rules the Firestore version uses.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CampusAlert,
  CampusId,
  Handover,
  Item,
  Match,
  User,
} from '../types';
import { features } from '../config/phase';

const KEYS = {
  users: '@btsfind/users',
  items: '@btsfind/items',
  matches: '@btsfind/matches',
  handovers: '@btsfind/handovers',
  alerts: '@btsfind/alerts',
  session: '@btsfind/session',
  seeded: '@btsfind/seeded',
};

const EXPIRY_DAYS = 14;

/* --------------------------------------------------------------- storage */

/**
 * Phase 1 keeps everything in memory on purpose: the POC demonstrates the flow
 * on static mock data and starts from the same known state every launch. From
 * Phase 2 the identical repository is backed by AsyncStorage, so nothing above
 * this line changes when persistence arrives.
 */
interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  multiRemove(keys: string[]): Promise<void>;
}

const memoryCells = new Map<string, string>();

const memoryStore: KeyValueStore = {
  async getItem(key) {
    return memoryCells.has(key) ? memoryCells.get(key)! : null;
  },
  async setItem(key, value) {
    memoryCells.set(key, value);
  },
  async removeItem(key) {
    memoryCells.delete(key);
  },
  async multiRemove(keys) {
    keys.forEach((key) => memoryCells.delete(key));
  },
};

const store: KeyValueStore =
  features.persistence === 'memory' ? memoryStore : (AsyncStorage as KeyValueStore);

/* ------------------------------------------------------------------ utils */

async function readList<T>(key: string): Promise<T[]> {
  const raw = await store.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

async function writeList<T>(key: string, value: T[]): Promise<void> {
  await store.setItem(key, JSON.stringify(value));
}

let idCounter = 0;
export function newId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}${idCounter.toString(36)}`;
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/* ------------------------------------------------------------------ users */

export const usersRepo = {
  async all(): Promise<User[]> {
    return readList<User>(KEYS.users);
  },

  async byId(uid: string): Promise<User | undefined> {
    const users = await readList<User>(KEYS.users);
    return users.find((u) => u.uid === uid);
  },

  async byEmail(email: string): Promise<User | undefined> {
    const users = await readList<User>(KEYS.users);
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },

  async upsert(user: User): Promise<User> {
    const users = await readList<User>(KEYS.users);
    const idx = users.findIndex((u) => u.uid === user.uid);
    if (idx >= 0) users[idx] = user;
    else users.push(user);
    await writeList(KEYS.users, users);
    return user;
  },
};

/* ------------------------------------------------------------------ items */

export const itemsRepo = {
  async all(): Promise<Item[]> {
    return readList<Item>(KEYS.items);
  },

  /** Campus-scoped feed. Cross-campus reads are impossible by construction. */
  async byCampus(campusId: CampusId): Promise<Item[]> {
    const items = await readList<Item>(KEYS.items);
    return items
      .filter((i) => i.campusId === campusId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async byId(id: string, campusId: CampusId): Promise<Item | undefined> {
    const items = await readList<Item>(KEYS.items);
    const item = items.find((i) => i.id === id);
    // Mirrors the Firestore rule: a different-campus read resolves to nothing.
    if (!item || item.campusId !== campusId) return undefined;
    return item;
  },

  async byOwner(ownerId: string): Promise<Item[]> {
    const items = await readList<Item>(KEYS.items);
    return items
      .filter((i) => i.ownerId === ownerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async create(
    input: Omit<Item, 'id' | 'createdAt' | 'expiresAt' | 'status'>,
  ): Promise<Item> {
    const createdAt = new Date().toISOString();
    const item: Item = {
      ...input,
      id: newId('item'),
      status: 'OPEN',
      createdAt,
      expiresAt: addDays(createdAt, EXPIRY_DAYS),
    };
    const items = await readList<Item>(KEYS.items);
    items.push(item);
    await writeList(KEYS.items, items);
    return item;
  },

  /** Only the owner may edit — PRD §7.3 rule 25. */
  async update(id: string, actorId: string, patch: Partial<Item>): Promise<Item> {
    const items = await readList<Item>(KEYS.items);
    const idx = items.findIndex((i) => i.id === id);
    if (idx < 0) throw new Error('Lost request not found.');
    if (items[idx].ownerId !== actorId) {
      throw new Error('Only the owner can edit this lost request.');
    }
    items[idx] = { ...items[idx], ...patch, id, ownerId: items[idx].ownerId };
    await writeList(KEYS.items, items);
    return items[idx];
  },

  /**
   * Scheduled-Function equivalent of PRD §7.3 rule 26 — runs on app start.
   * Returns how many requests were expired.
   */
  async expireStale(): Promise<number> {
    const items = await readList<Item>(KEYS.items);
    const now = new Date().toISOString();
    let changed = 0;
    items.forEach((item, i) => {
      const stale = item.expiresAt <= now;
      const openish = item.status === 'OPEN' || item.status === 'CLAIM_PENDING';
      if (stale && openish) {
        items[i] = { ...item, status: 'EXPIRED' };
        changed += 1;
      }
    });
    if (changed) await writeList(KEYS.items, items);
    return changed;
  },
};

/* ---------------------------------------------------------------- matches */

export const matchesRepo = {
  async all(): Promise<Match[]> {
    return readList<Match>(KEYS.matches);
  },

  /**
   * Private match details are readable only by the item owner or the finder
   * who submitted them — PRD §7.3 rule 25.
   */
  async forItem(itemId: string, viewerId: string, ownerId: string): Promise<Match[]> {
    const matches = await readList<Match>(KEYS.matches);
    return matches
      .filter((m) => m.itemId === itemId)
      .filter((m) => viewerId === ownerId || m.finderId === viewerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async byFinder(finderId: string): Promise<Match[]> {
    const matches = await readList<Match>(KEYS.matches);
    return matches
      .filter((m) => m.finderId === finderId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async create(input: Omit<Match, 'id' | 'createdAt' | 'status'>): Promise<Match> {
    const match: Match = {
      ...input,
      id: newId('match'),
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    const matches = await readList<Match>(KEYS.matches);
    matches.push(match);
    await writeList(KEYS.matches, matches);
    return match;
  },

  async update(id: string, patch: Partial<Match>): Promise<Match> {
    const matches = await readList<Match>(KEYS.matches);
    const idx = matches.findIndex((m) => m.id === id);
    if (idx < 0) throw new Error('Match not found.');
    matches[idx] = { ...matches[idx], ...patch, id };
    await writeList(KEYS.matches, matches);
    return matches[idx];
  },
};

/* -------------------------------------------------------------- handovers */

export const handoversRepo = {
  async all(): Promise<Handover[]> {
    return readList<Handover>(KEYS.handovers);
  },

  async forItem(itemId: string): Promise<Handover[]> {
    const list = await readList<Handover>(KEYS.handovers);
    return list.filter((h) => h.itemId === itemId);
  },

  async create(input: Omit<Handover, 'id' | 'submittedAt'>): Promise<Handover> {
    const handover: Handover = {
      ...input,
      id: newId('ho'),
      submittedAt: new Date().toISOString(),
    };
    const list = await readList<Handover>(KEYS.handovers);
    list.push(handover);
    await writeList(KEYS.handovers, list);
    return handover;
  },

  async update(id: string, patch: Partial<Handover>): Promise<Handover> {
    const list = await readList<Handover>(KEYS.handovers);
    const idx = list.findIndex((h) => h.id === id);
    if (idx < 0) throw new Error('Handover record not found.');
    list[idx] = { ...list[idx], ...patch, id };
    await writeList(KEYS.handovers, list);
    return list[idx];
  },
};

/* ----------------------------------------------------------------- alerts */

export const alertsRepo = {
  async byCampus(campusId: CampusId): Promise<CampusAlert[]> {
    const list = await readList<CampusAlert>(KEYS.alerts);
    return list
      .filter((a) => a.campusId === campusId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async create(input: Omit<CampusAlert, 'id' | 'createdAt' | 'read'>): Promise<CampusAlert> {
    const alert: CampusAlert = {
      ...input,
      id: newId('alert'),
      createdAt: new Date().toISOString(),
      read: false,
    };
    const list = await readList<CampusAlert>(KEYS.alerts);
    list.push(alert);
    await writeList(KEYS.alerts, list);
    return alert;
  },

  async markAllRead(campusId: CampusId): Promise<void> {
    const list = await readList<CampusAlert>(KEYS.alerts);
    const next = list.map((a) => (a.campusId === campusId ? { ...a, read: true } : a));
    await writeList(KEYS.alerts, next);
  },
};

/* ---------------------------------------------------------------- session */

export const sessionRepo = {
  async get(): Promise<string | null> {
    return store.getItem(KEYS.session);
  },
  async set(uid: string): Promise<void> {
    await store.setItem(KEYS.session, uid);
  },
  async clear(): Promise<void> {
    await store.removeItem(KEYS.session);
  },
};

/* ------------------------------------------------------------------ admin */

export const dbAdmin = {
  async isSeeded(): Promise<boolean> {
    return (await store.getItem(KEYS.seeded)) === '1';
  },
  async markSeeded(): Promise<void> {
    await store.setItem(KEYS.seeded, '1');
  },
  async reset(): Promise<void> {
    await store.multiRemove(Object.values(KEYS));
  },
  async seedUsers(users: User[]): Promise<void> {
    await writeList(KEYS.users, users);
  },
  async seedItems(items: Item[]): Promise<void> {
    await writeList(KEYS.items, items);
  },
  async seedMatches(matches: Match[]): Promise<void> {
    await writeList(KEYS.matches, matches);
  },
  async seedAlerts(alerts: CampusAlert[]): Promise<void> {
    await writeList(KEYS.alerts, alerts);
  },
};
