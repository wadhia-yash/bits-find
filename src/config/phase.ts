/**
 * Delivery phase configuration.
 *
 * The same codebase ships three times. Rather than three branches that drift
 * apart, the build reads one number and turns a feature set on or off, so the
 * Phase 1 POC, the Phase 2 prototype and the Phase 3 capstone are the same
 * screens with progressively more of the product switched on.
 *
 *   Phase 1 — Initial POC       core flow, mock data, no backend
 *   Phase 2 — Advanced POC      polished UI, real backend + database
 *   Phase 3 — Capstone          everything: auth, push, expiry, validations
 *
 * Set it with `npm run phase -- 1` (rewrites expo.extra.phase in app.json) or
 * with EXPO_PUBLIC_APP_PHASE=1 in the environment. See docs/PHASE_PLAN.md.
 */

import Constants from 'expo-constants';

export type Phase = 1 | 2 | 3;

/** A finished build defaults to the capstone. */
const DEFAULT_PHASE: Phase = 3;

function readPhase(): Phase {
  const fromEnv = process.env.EXPO_PUBLIC_APP_PHASE;
  const fromConfig = (Constants.expoConfig?.extra as Record<string, unknown> | undefined)?.phase;
  const raw = Number(fromEnv ?? fromConfig ?? DEFAULT_PHASE);
  return raw === 1 || raw === 2 ? raw : DEFAULT_PHASE;
}

export const PHASE: Phase = readPhase();

export const PHASE_META: Record<Phase, { label: string; name: string; tagline: string }> = {
  1: {
    label: 'Phase 1',
    name: 'Initial POC',
    tagline: 'Core lost-and-found loop on mock data. No backend.',
  },
  2: {
    label: 'Phase 2',
    name: 'Advanced POC',
    tagline: 'Polished UI, real accounts and a live database.',
  },
  3: {
    label: 'Phase 3',
    name: 'Capstone',
    tagline: 'Full product — auth, push, expiry, validations, handover.',
  },
};

export interface Features {
  /** Where the pilot repository keeps its rows. Memory resets on every launch. */
  persistence: 'memory' | 'device';
  /** Allow Firebase to take over when app.json carries a config. */
  cloudBackend: boolean;

  /* auth */
  accounts: boolean;
  passwordReset: boolean;
  /** Campus picker for online / WILP addresses that name no campus. */
  campusChoice: boolean;
  demoAccounts: boolean;

  /* feed */
  advancedFilters: boolean;
  statusFilters: boolean;
  pullToRefresh: boolean;

  /* report */
  photos: boolean;
  contactModes: boolean;
  sensitiveItemWarning: boolean;

  /* match + handover */
  adminHandover: boolean;
  adminCollectionTracking: boolean;
  contactUnlock: boolean;
  cancelRequest: boolean;

  /* alerts */
  campusAlerts: boolean;
  pushNotifications: boolean;

  /* profile */
  contactConsent: boolean;
  notificationPrefs: boolean;
  demoReset: boolean;

  /* housekeeping + chrome */
  expirySweep: boolean;
  polishedUi: boolean;
}

const PHASE_1: Features = {
  persistence: 'memory',
  cloudBackend: false,

  accounts: false,
  passwordReset: false,
  campusChoice: false,
  demoAccounts: true,

  advancedFilters: false,
  statusFilters: false,
  pullToRefresh: false,

  photos: false,
  contactModes: false,
  sensitiveItemWarning: false,

  adminHandover: false,
  adminCollectionTracking: false,
  contactUnlock: false,
  cancelRequest: false,

  campusAlerts: false,
  pushNotifications: false,

  contactConsent: false,
  notificationPrefs: false,
  demoReset: false,

  expirySweep: false,
  polishedUi: false,
};

const PHASE_2: Features = {
  ...PHASE_1,
  persistence: 'device',
  cloudBackend: true,

  accounts: true,

  advancedFilters: true,
  statusFilters: true,
  pullToRefresh: true,

  photos: true,
  contactModes: true,
  sensitiveItemWarning: true,

  adminHandover: true,
  contactUnlock: true,
  cancelRequest: true,

  campusAlerts: true,

  contactConsent: true,
  demoReset: true,

  polishedUi: true,
};

const PHASE_3: Features = {
  ...PHASE_2,
  passwordReset: true,
  campusChoice: true,
  adminCollectionTracking: true,
  pushNotifications: true,
  notificationPrefs: true,
  expirySweep: true,
};

const BY_PHASE: Record<Phase, Features> = { 1: PHASE_1, 2: PHASE_2, 3: PHASE_3 };

export const features: Features = BY_PHASE[PHASE];

/** Short line for the Profile screen and the sign-in footer. */
export function phaseCaption(): string {
  const meta = PHASE_META[PHASE];
  return `${meta.label} · ${meta.name}`;
}
