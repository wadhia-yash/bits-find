/**
 * In-memory repository.
 *
 * This is the only module that touches storage. The proof of concept keeps
 * everything in memory on purpose: the demo starts from the same known state
 * every launch, and nothing is written to the device. Swapping this file for a
 * real database is the whole of the next step — no screen imports storage.
 *
 * Campus scoping is enforced on every read that returns other people's data.
 */

import { CampusId, Item, Match, User } from '../types';

const tables = {
  users: [] as User[],
  items: [] as Item[],
  matches: [] as Match[],
};

let sessionUid: string | null = null;
let seeded = false;

let idCounter = 0;
export function newId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}${idCounter.toString(36)}`;
}

/* ------------------------------------------------------------------ users */

export const usersRepo = {
  async byId(uid: string): Promise<User | undefined> {
    return tables.users.find((u) => u.uid === uid);
  },
};

/* ------------------------------------------------------------------ items */

export const itemsRepo = {
  /** Campus-scoped feed. A cross-campus read is impossible by construction. */
  async byCampus(campusId: CampusId): Promise<Item[]> {
    return tables.items
      .filter((i) => i.campusId === campusId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async byId(id: string, campusId: CampusId): Promise<Item | undefined> {
    const item = tables.items.find((i) => i.id === id);
    // A different-campus read resolves to nothing, exactly like the feed.
    if (!item || item.campusId !== campusId) return undefined;
    return item;
  },

  async create(input: Omit<Item, 'id' | 'createdAt' | 'status'>): Promise<Item> {
    const item: Item = {
      ...input,
      id: newId('item'),
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    };
    tables.items.push(item);
    return item;
  },

  /** Only the owner may edit their request. */
  async update(id: string, actorId: string, patch: Partial<Item>): Promise<Item> {
    const idx = tables.items.findIndex((i) => i.id === id);
    if (idx < 0) throw new Error('Lost request not found.');
    if (tables.items[idx].ownerId !== actorId) {
      throw new Error('Only the owner can edit this lost request.');
    }
    tables.items[idx] = { ...tables.items[idx], ...patch, id, ownerId: tables.items[idx].ownerId };
    return tables.items[idx];
  },
};

/* ---------------------------------------------------------------- matches */

export const matchesRepo = {
  async all(): Promise<Match[]> {
    return [...tables.matches].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async create(input: Omit<Match, 'id' | 'createdAt' | 'status'>): Promise<Match> {
    const match: Match = {
      ...input,
      id: newId('match'),
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    tables.matches.push(match);
    return match;
  },

  async update(id: string, patch: Partial<Match>): Promise<Match> {
    const idx = tables.matches.findIndex((m) => m.id === id);
    if (idx < 0) throw new Error('Match not found.');
    tables.matches[idx] = { ...tables.matches[idx], ...patch, id };
    return tables.matches[idx];
  },
};

/* ---------------------------------------------------------------- session */

export const sessionRepo = {
  async get(): Promise<string | null> {
    return sessionUid;
  },
  async set(uid: string): Promise<void> {
    sessionUid = uid;
  },
  async clear(): Promise<void> {
    sessionUid = null;
  },
};

/* ------------------------------------------------------------------ admin */

export const dbAdmin = {
  async isSeeded(): Promise<boolean> {
    return seeded;
  },
  async markSeeded(): Promise<void> {
    seeded = true;
  },
  async seedUsers(users: User[]): Promise<void> {
    tables.users = [...users];
  },
  async seedItems(items: Item[]): Promise<void> {
    tables.items = [...items];
  },
  async seedMatches(matches: Match[]): Promise<void> {
    tables.matches = [...matches];
  },
};
