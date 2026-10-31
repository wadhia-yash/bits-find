/**
 * Campus alert delivery.
 *
 * Stands in for the Cloud Function + FCM topic `campus_{campusId}` described in
 * PRD §7.3. The privacy rule lives here, not in the caller: buildAlertPreview()
 * is the only place an alert body is composed, so a push can never leak a phone
 * number, ID number or private match detail (PRD §4.1 rule 14 / §7.3 rule 23).
 *
 * expo-notifications is loaded lazily and never inside Expo Go: since SDK 53 the
 * module throws on import there ("Android Push notifications ... was removed
 * from Expo Go"). The in-app alert list is the source of truth for the demo, so
 * the OS banner is treated as a bonus that degrades silently.
 */

import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Item } from '../types';
import { features } from '../config/phase';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** Anything that must never reach a notification body. */
const PHONE_RE = /(\+?\d[\d\s-]{7,}\d)/g;
const LONG_NUMBER_RE = /\b\d{6,}\b/g;

function stripSensitive(text: string): string {
  return text.replace(PHONE_RE, '•••').replace(LONG_NUMBER_RE, '•••').trim();
}

export interface AlertPreview {
  title: string;
  body: string;
}

/**
 * Category / title + approximate last-seen zone only. Description, contact
 * details and match proof are deliberately excluded.
 */
export function buildAlertPreview(item: Item): AlertPreview {
  return {
    title: `Lost on campus: ${stripSensitive(item.title)}`,
    body: `${item.category} · last seen near ${item.lastSeenZone}. Tap if you have seen it.`,
  };
}

/** Guard used by the privacy checks in docs/TEST_PLAN.md. */
export function previewIsPrivacySafe(preview: AlertPreview): boolean {
  const joined = `${preview.title} ${preview.body}`;
  return !PHONE_RE.test(joined) && !LONG_NUMBER_RE.test(joined);
}

/** True when the OS can actually show a banner for us. */
export function osNotificationsAvailable(): boolean {
  if (!features.pushNotifications) return false;
  return !isExpoGo && loadNotifications() !== null;
}

type NotificationsModule = typeof import('expo-notifications');

let cached: NotificationsModule | null = null;
let loadAttempted = false;

function loadNotifications(): NotificationsModule | null {
  if (loadAttempted) return cached;
  loadAttempted = true;

  // Importing at all is what throws in Expo Go, so the guard has to come first.
  if (isExpoGo) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('expo-notifications') as NotificationsModule;
    mod.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    cached = mod;
  } catch {
    cached = null;
  }
  return cached;
}

export async function requestPermission(): Promise<boolean> {
  if (!features.pushNotifications) return false;
  const mod = loadNotifications();
  if (!mod) return false;
  try {
    const current = await mod.getPermissionsAsync();
    if (current.granted) return true;
    const asked = await mod.requestPermissionsAsync();
    return asked.granted;
  } catch {
    return false;
  }
}

/**
 * Publishes one alert for one item. De-duplication (NFR #29 — "no duplicate
 * push for one item") is enforced here via `sentItemIds`.
 *
 * Always returns the preview, whether or not a banner was shown, because the
 * caller writes it to the in-app alert list either way.
 */
const sentItemIds = new Set<string>();

export async function sendCampusAlert(item: Item): Promise<AlertPreview | null> {
  // OS banners are a Phase 3 deliverable; earlier phases keep the in-app list only.
  if (!features.pushNotifications) return null;
  if (sentItemIds.has(item.id)) return null;
  sentItemIds.add(item.id);

  const preview = buildAlertPreview(item);
  const mod = loadNotifications();
  if (!mod) return preview;

  try {
    const granted = await requestPermission();
    if (granted) {
      await mod.scheduleNotificationAsync({
        content: {
          title: preview.title,
          body: preview.body,
          data: { itemId: item.id, campusId: item.campusId },
        },
        trigger: null,
      });
    }
  } catch {
    // Best-effort: a failed banner must never block publishing the request.
  }
  return preview;
}
