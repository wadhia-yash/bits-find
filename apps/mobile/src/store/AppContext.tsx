/**
 * Application store.
 *
 * Screens never touch a backend directly — every state transition in the closed
 * loop (OPEN → CLAIM_PENDING → RETURNED) goes through one of the actions below,
 * which is what keeps the status rules in PRD §4.1 enforceable in one place.
 * Whether those actions land in Firestore or in the on-device pilot store is
 * decided once, in src/services/backend.ts.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  CampusAlert,
  Handover,
  HandoverMode,
  Item,
  Match,
  User,
} from '../types';
import * as backend from '../services/backend';
import { buildAlertPreview, sendCampusAlert } from '../services/notify';

interface AppState {
  ready: boolean;
  user: User | null;
  items: Item[];
  matches: Match[];
  handovers: Handover[];
  alerts: CampusAlert[];
  unreadAlerts: number;
  /** True when the app is wired to a real Firebase project. */
  online: boolean;
  loading: boolean;
}

interface AppActions {
  setUser: (user: User | null) => void;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<User>) => Promise<void>;

  createLostRequest: (
    input: Omit<
      Item,
      'id' | 'createdAt' | 'expiresAt' | 'status' | 'campusId' | 'ownerId' | 'ownerName'
    >,
  ) => Promise<Item>;
  cancelLostRequest: (itemId: string) => Promise<void>;

  submitMatch: (input: {
    itemId: string;
    matchText: string;
    handoverMode: HandoverMode;
    adminLocation?: string;
  }) => Promise<Match>;
  respondToMatch: (matchId: string, accept: boolean) => Promise<void>;
  markAdminCollected: (matchId: string) => Promise<void>;
  confirmReturned: (itemId: string, matchId: string) => Promise<void>;

  markAlertsRead: () => Promise<void>;

  /** Reads restricted to the owner + responding finder. */
  matchesForItem: (item: Item) => Match[];
}

const AppContext = createContext<(AppState & AppActions) | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [alerts, setAlerts] = useState<CampusAlert[]>([]);

  /** Reloads everything the signed-in account is allowed to see. */
  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      setMatches([]);
      setHandovers([]);
      setAlerts([]);
      return;
    }
    setLoading(true);
    try {
      const campusItems = await backend.items.byCampus(user.campusId);
      const [userMatches, itemHandovers, campusAlerts] = await Promise.all([
        backend.matches.forUser(user.uid, campusItems),
        backend.handovers.forItems(campusItems),
        backend.alerts.byCampus(user.campusId),
      ]);

      setItems(campusItems);
      setMatches(userMatches);
      setHandovers(itemHandovers);
      setAlerts(campusAlerts);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Boot: prepare the pilot backend, then follow the session.
  useEffect(() => {
    let unsubscribe = () => {};
    (async () => {
      await backend.prepare();
      unsubscribe = backend.auth.observeSession((restored) => {
        setUser(restored);
        setReady(true);
      });
    })();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /* ------------------------------------------------------------- actions */

  const updateProfile = useCallback(
    async (patch: Partial<User>) => {
      if (!user) return;
      await backend.users.update(user.uid, patch, user);
      setUser({ ...user, ...patch, uid: user.uid });
    },
    [user],
  );

  const createLostRequest = useCallback<AppActions['createLostRequest']>(
    async (input) => {
      if (!user) throw new Error('You must be signed in.');

      const imageUrlOptional = await backend.uploadImage(
        input.imageUrlOptional,
        user.campusId,
        user.uid,
      );

      const item = await backend.items.create({
        ...input,
        imageUrlOptional,
        campusId: user.campusId,
        ownerId: user.uid,
        ownerName: user.name,
      });

      // On Firebase the Cloud Function fans this out to the campus topic; on the
      // pilot backend the same preview is written locally so the demo still works.
      const preview = buildAlertPreview(item);
      await backend.alerts.create({
        campusId: item.campusId,
        itemId: item.id,
        title: preview.title,
        body: preview.body,
      });
      await sendCampusAlert(item);

      await refresh();
      return item;
    },
    [user, refresh],
  );

  const cancelLostRequest = useCallback(
    async (itemId: string) => {
      if (!user) return;
      await backend.items.update(itemId, user.uid, { status: 'HIDDEN' });
      await refresh();
    },
    [user, refresh],
  );

  const submitMatch = useCallback<AppActions['submitMatch']>(
    async ({ itemId, matchText, handoverMode, adminLocation }) => {
      if (!user) throw new Error('You must be signed in.');
      const item = await backend.items.byId(itemId, user.campusId);
      if (!item) throw new Error('This lost request is not available on your campus.');
      if (item.ownerId === user.uid) throw new Error('You cannot respond to your own request.');
      if (item.status !== 'OPEN' && item.status !== 'CLAIM_PENDING') {
        throw new Error('This request is no longer open.');
      }

      const match = await backend.matches.create({
        itemId,
        finderId: user.uid,
        finderName: user.name,
        matchText,
        handoverMode,
        adminDropoffStatus: handoverMode === 'ADMIN' ? 'SUBMITTED' : 'NOT_APPLICABLE',
      });

      await backend.handovers.create({
        itemId,
        matchId: match.id,
        finderId: user.uid,
        mode: handoverMode,
        adminLocationOptional: adminLocation,
        status: handoverMode === 'ADMIN' ? 'SUBMITTED' : 'PENDING',
      });

      await backend.items.update(itemId, item.ownerId, { status: 'CLAIM_PENDING' });
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

      await backend.matches.update(match.itemId, matchId, {
        status: accept ? 'ACCEPTED' : 'REJECTED',
      });

      if (!accept) {
        // No other live claim left → the request goes back on the feed.
        const others = matches.filter(
          (m) =>
            m.itemId === item.id &&
            m.id !== matchId &&
            (m.status === 'PENDING' || m.status === 'ACCEPTED'),
        );
        if (others.length === 0) {
          await backend.items.update(item.id, user.uid, { status: 'OPEN' });
        }
      }
      await refresh();
    },
    [user, matches, items, refresh],
  );

  const markAdminCollected = useCallback(
    async (matchId: string) => {
      if (!user) return;
      const match = matches.find((m) => m.id === matchId);
      if (!match) throw new Error('Match not found.');

      await backend.matches.update(match.itemId, matchId, { adminDropoffStatus: 'COLLECTED' });

      const [handover] = (await backend.handovers.forItem(match.itemId)).filter(
        (h) => h.matchId === matchId,
      );
      if (handover) {
        await backend.handovers.update(handover.id, {
          status: 'COLLECTED',
          collectedAt: new Date().toISOString(),
        });
      }
      await refresh();
    },
    [user, matches, refresh],
  );

  /** Owner confirms the item is back — the only path to RETURNED. */
  const confirmReturned = useCallback(
    async (itemId: string, matchId: string) => {
      if (!user) return;
      const item = items.find((i) => i.id === itemId);
      if (!item || item.ownerId !== user.uid) {
        throw new Error('Only the owner can confirm the return.');
      }

      const completedAt = new Date().toISOString();
      await backend.matches.update(itemId, matchId, { status: 'COMPLETED', completedAt });
      await backend.items.update(itemId, user.uid, { status: 'RETURNED' });

      const [handover] = (await backend.handovers.forItem(itemId)).filter(
        (h) => h.matchId === matchId,
      );
      if (handover) {
        await backend.handovers.update(handover.id, {
          status: 'COLLECTED',
          collectedAt: completedAt,
        });
      }
      await refresh();
    },
    [user, items, refresh],
  );

  const markAlertsRead = useCallback(async () => {
    if (!user) return;
    await backend.alerts.markAllRead(user.campusId);
    await refresh();
  }, [user, refresh]);

  const signOut = useCallback(async () => {
    await backend.auth.signOut();
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

  const unreadAlerts = useMemo(() => alerts.filter((a) => !a.read).length, [alerts]);

  const value = useMemo(
    () => ({
      ready,
      loading,
      online: backend.isFirebase,
      user,
      items,
      matches,
      handovers,
      alerts,
      unreadAlerts,
      setUser,
      refresh,
      signOut,
      updateProfile,
      createLostRequest,
      cancelLostRequest,
      submitMatch,
      respondToMatch,
      markAdminCollected,
      confirmReturned,
      markAlertsRead,
      matchesForItem,
    }),
    [
      ready,
      loading,
      user,
      items,
      matches,
      handovers,
      alerts,
      unreadAlerts,
      refresh,
      signOut,
      updateProfile,
      createLostRequest,
      cancelLostRequest,
      submitMatch,
      respondToMatch,
      markAdminCollected,
      confirmReturned,
      markAlertsRead,
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
