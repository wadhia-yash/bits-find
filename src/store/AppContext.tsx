/**
 * Application store.
 *
 * Screens never touch the repository directly — every state transition in the
 * closed loop (OPEN → CLAIM_PENDING → RETURNED) goes through one of the actions
 * below, which is what keeps the status rules enforceable in one place.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Item, Match, User } from '../types';
import { itemsRepo, matchesRepo } from '../services/db';
import { restoreSession, signOut as authSignOut } from '../services/auth';
import { seedIfEmpty } from '../services/seed';

interface AppState {
  ready: boolean;
  user: User | null;
  items: Item[];
  matches: Match[];
  loading: boolean;
}

interface AppActions {
  setUser: (user: User | null) => void;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;

  createLostRequest: (
    input: Omit<Item, 'id' | 'createdAt' | 'status' | 'campusId' | 'ownerId' | 'ownerName'>,
  ) => Promise<Item>;

  submitMatch: (input: { itemId: string; matchText: string }) => Promise<Match>;
  respondToMatch: (matchId: string, accept: boolean) => Promise<void>;
  confirmReturned: (itemId: string, matchId: string) => Promise<void>;

  /** Reads restricted to the owner and the responding finder. */
  matchesForItem: (item: Item) => Match[];
}

const AppContext = createContext<(AppState & AppActions) | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  /** Reloads everything the signed-in account is allowed to see. */
  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      setMatches([]);
      return;
    }
    setLoading(true);
    try {
      const campusItems = await itemsRepo.byCampus(user.campusId);

      // Only matches on requests the user can see, and only those they are a
      // party to — either as the owner or as the finder who submitted them.
      const all = await matchesRepo.all();
      const ownerByItem = new Map(campusItems.map((i) => [i.id, i.ownerId]));
      const visibleMatches = all.filter(
        (m) =>
          ownerByItem.has(m.itemId) &&
          (ownerByItem.get(m.itemId) === user.uid || m.finderId === user.uid),
      );

      setItems(campusItems);
      setMatches(visibleMatches);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Boot: seed the demo data, then restore any session.
  useEffect(() => {
    (async () => {
      await seedIfEmpty();
      setUser(await restoreSession());
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /* ------------------------------------------------------------- actions */

  const createLostRequest = useCallback<AppActions['createLostRequest']>(
    async (input) => {
      if (!user) throw new Error('You must be signed in.');

      const item = await itemsRepo.create({
        ...input,
        campusId: user.campusId,
        ownerId: user.uid,
        ownerName: user.name,
      });

      await refresh();
      return item;
    },
    [user, refresh],
  );

  const submitMatch = useCallback<AppActions['submitMatch']>(
    async ({ itemId, matchText }) => {
      if (!user) throw new Error('You must be signed in.');
      const item = await itemsRepo.byId(itemId, user.campusId);
      if (!item) throw new Error('This lost request is not available on your campus.');
      if (item.ownerId === user.uid) throw new Error('You cannot respond to your own request.');
      if (item.status !== 'OPEN' && item.status !== 'CLAIM_PENDING') {
        throw new Error('This request is no longer open.');
      }

      const match = await matchesRepo.create({
        itemId,
        finderId: user.uid,
        finderName: user.name,
        matchText,
      });

      await itemsRepo.update(itemId, item.ownerId, { status: 'CLAIM_PENDING' });
      await refresh();
      return match;
    },
    [user, refresh],
  );

  const respondToMatch = useCallback(
    async (matchId: string, accept: boolean) => {
      if (!user) return;
      const match = matches.find((m) => m.id === matchId);
      if (!match) throw new Error('Match not found.');
      const item = items.find((i) => i.id === match.itemId);
      if (!item || item.ownerId !== user.uid) {
        throw new Error('Only the owner can respond to a match.');
      }

      await matchesRepo.update(matchId, { status: accept ? 'ACCEPTED' : 'REJECTED' });

      if (!accept) {
        // No other live claim left → the request goes back on the feed.
        const others = matches.filter(
          (m) =>
            m.itemId === item.id &&
            m.id !== matchId &&
            (m.status === 'PENDING' || m.status === 'ACCEPTED'),
        );
        if (others.length === 0) {
          await itemsRepo.update(item.id, user.uid, { status: 'OPEN' });
        }
      }
      await refresh();
    },
    [user, matches, items, refresh],
  );

  /** The owner confirms the item is back — the only path to RETURNED. */
  const confirmReturned = useCallback(
    async (itemId: string, matchId: string) => {
      if (!user) return;
      const item = items.find((i) => i.id === itemId);
      if (!item || item.ownerId !== user.uid) {
        throw new Error('Only the owner can confirm the return.');
      }

      await matchesRepo.update(matchId, {
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
      });
      await itemsRepo.update(itemId, user.uid, { status: 'RETURNED' });
      await refresh();
    },
    [user, items, refresh],
  );

  const signOut = useCallback(async () => {
    await authSignOut();
    setUser(null);
  }, []);

  const matchesForItem = useCallback(
    (item: Item) => {
      if (!user) return [];
      return matches
        .filter((m) => m.itemId === item.id)
        .filter((m) => item.ownerId === user.uid || m.finderId === user.uid);
    },
    [matches, user],
  );

  const value = useMemo(
    () => ({
      ready,
      loading,
      user,
      items,
      matches,
      setUser,
      refresh,
      signOut,
      createLostRequest,
      submitMatch,
      respondToMatch,
      confirmReturned,
      matchesForItem,
    }),
    [
      ready,
      loading,
      user,
      items,
      matches,
      refresh,
      signOut,
      createLostRequest,
      submitMatch,
      respondToMatch,
      confirmReturned,
      matchesForItem,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>.');
  return ctx;
}
