/**
 * Firebase bootstrap.
 *
 * The app runs against Firebase when a config is present in app.json under
 * `expo.extra.firebase`, and falls back to the on-device pilot backend when it
 * is not. That keeps the project demonstrable before the backend exists and
 * makes the switch a config change rather than a code change (NFR #32 — keys
 * live in app configuration, never inline in a source file).
 */

import Constants from 'expo-constants';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth, initializeAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const REQUIRED_KEYS: (keyof FirebaseConfig)[] = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];

function readConfig(): FirebaseConfig | null {
  const raw = (Constants.expoConfig?.extra as Record<string, unknown> | undefined)?.firebase;
  if (!raw || typeof raw !== 'object') return null;

  const cfg = raw as Partial<FirebaseConfig>;
  const missing = REQUIRED_KEYS.filter((k) => !cfg[k] || String(cfg[k]).startsWith('PASTE_'));
  if (missing.length) return null;

  return cfg as FirebaseConfig;
}

const config = readConfig();

/** True when a complete config was found — the app wires itself accordingly. */
export const firebaseEnabled = config !== null;

let appRef: FirebaseApp | null = null;
let authRef: Auth | null = null;
let dbRef: Firestore | null = null;
let storageRef: FirebaseStorage | null = null;

function bootstrap(): void {
  if (!config || appRef) return;

  appRef = getApps().length ? getApp() : initializeApp(config);

  // On React Native the SDK needs an explicit persistence layer, otherwise the
  // session is lost on every cold start. getReactNativePersistence only exists
  // in the RN build, so it is resolved dynamically.
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const authModule = require('firebase/auth') as {
      getReactNativePersistence?: (storage: unknown) => unknown;
    };
    if (authModule.getReactNativePersistence) {
      authRef = initializeAuth(appRef, {
        persistence: authModule.getReactNativePersistence(AsyncStorage) as never,
      });
    } else {
      authRef = getAuth(appRef);
    }
  } catch {
    // initializeAuth throws if it already ran (fast refresh) — reuse that instance.
    authRef = getAuth(appRef);
  }

  dbRef = getFirestore(appRef);
  storageRef = getStorage(appRef);
}

bootstrap();

function required<T>(value: T | null, name: string): T {
  if (!value) {
    throw new Error(
      `${name} is unavailable because Firebase is not configured. ` +
        'Add expo.extra.firebase to app.json — see docs/FIREBASE_SETUP.md.',
    );
  }
  return value;
}

export const firebaseAuth = () => required(authRef, 'Firebase Auth');
export const firebaseDb = () => required(dbRef, 'Cloud Firestore');
export const firebaseStorage = () => required(storageRef, 'Firebase Storage');
export const firebaseProjectId = () => config?.projectId ?? null;
