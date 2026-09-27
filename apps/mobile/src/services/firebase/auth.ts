/**
 * Firebase email + password authentication.
 *
 * Deliberately NOT Google sign-in: the flow stays inside the app, with the
 * institutional-domain gate enforced before the account is ever created
 * (PRD §4.2 step 17). Firebase then sends its own verification email, and
 * `emailVerified` is what unlocks the app — the same condition the security
 * rules check server-side, so a client that skips the screen still gets nothing.
 */

import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { firebaseAuth, firebaseDb } from './config';
import { checkInstitutionalEmail } from '../auth';
import { CampusId, User } from '../../types';

/** Firebase error codes mapped to something a student can act on. */
function friendlyError(e: unknown): Error {
  const code = (e as { code?: string })?.code ?? '';
  const map: Record<string, string> = {
    'auth/email-already-in-use':
      'An account already exists for this email. Try signing in instead.',
    'auth/invalid-email': 'That email address is not valid.',
    'auth/weak-password': 'Choose a password of at least 6 characters.',
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/wrong-password': 'Email or password is incorrect.',
    'auth/user-not-found': 'No account found for this email. Create one first.',
    'auth/too-many-requests': 'Too many attempts. Wait a minute and try again.',
    'auth/network-request-failed': 'No connection. Check your internet and try again.',
  };
  if (map[code]) return new Error(map[code]);
  return new Error((e as Error)?.message ?? 'Something went wrong. Try again.');
}

/** Profile document for a signed-in account, created on first sign-up. */
async function loadProfile(fbUser: FirebaseUser): Promise<User | null> {
  const snap = await getDoc(doc(firebaseDb(), 'users', fbUser.uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    uid: fbUser.uid,
    name: data.name ?? fbUser.displayName ?? fbUser.email!.split('@')[0],
    email: fbUser.email!,
    campusId: data.campusId,
    phoneOptional: data.phoneOptional ?? undefined,
    notificationPrefs: data.notificationPrefs ?? { campusAlerts: true, matchUpdates: true },
    emailVerified: fbUser.emailVerified,
  };
}

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
  /**
   * Required only when the address does not identify a campus on its own
   * (online and WILP students). Ignored otherwise — a residential sub-domain
   * always wins, so nobody can claim a campus their email contradicts.
   */
  campusId?: CampusId;
}

/**
 * Creates the account and its profile document, then sends the verification
 * email. The returned user is intentionally unverified — the caller shows the
 * "check your inbox" step rather than letting them straight in.
 */
export async function signUp({
  name,
  email,
  password,
  campusId: chosenCampusId,
}: SignUpInput): Promise<void> {
  const normalised = email.trim().toLowerCase();
  const check = checkInstitutionalEmail(normalised);
  if (!check.ok) throw new Error(check.error ?? 'Email not allowed.');

  const campusId = check.campusId ?? chosenCampusId;
  if (!campusId) throw new Error('Choose the campus you are based at.');

  if (name.trim().length < 2) throw new Error('Enter your name.');
  if (password.length < 6) throw new Error('Choose a password of at least 6 characters.');

  try {
    const cred = await createUserWithEmailAndPassword(firebaseAuth(), normalised, password);
    await updateProfile(cred.user, { displayName: name.trim() });

    // campusId is written once here and never editable by the client — the
    // rules reject any later change, which is what makes campus scoping hold.
    await setDoc(doc(firebaseDb(), 'users', cred.user.uid), {
      name: name.trim(),
      email: normalised,
      campusId,
      notificationPrefs: { campusAlerts: true, matchUpdates: true },
      createdAt: serverTimestamp(),
    });

    await sendEmailVerification(cred.user);
  } catch (e) {
    throw friendlyError(e);
  }
}

export async function signIn(email: string, password: string): Promise<User> {
  const normalised = email.trim().toLowerCase();
  const check = checkInstitutionalEmail(normalised);
  if (!check.ok) throw new Error(check.error ?? 'Email not allowed.');

  try {
    const cred = await signInWithEmailAndPassword(firebaseAuth(), normalised, password);

    if (!cred.user.emailVerified) {
      throw new Error('UNVERIFIED');
    }

    const profile = await loadProfile(cred.user);
    if (!profile) throw new Error('Your profile is missing. Contact the project team.');
    return profile;
  } catch (e) {
    if ((e as Error)?.message === 'UNVERIFIED') throw e;
    throw friendlyError(e);
  }
}

/**
 * Re-checks verification after the student clicks the link in their inbox.
 *
 * reload() only refreshes the local user object — the cached ID token still
 * carries `email_verified: false`, and that token is what the security rules
 * read. Without forcing a token refresh the app looks signed in but every write
 * comes back as "Missing or insufficient permissions".
 */
export async function refreshVerification(): Promise<User | null> {
  const current = firebaseAuth().currentUser;
  if (!current) return null;
  await current.reload();
  if (!current.emailVerified) return null;
  await current.getIdToken(true);
  return loadProfile(current);
}

export async function resendVerification(): Promise<void> {
  const current = firebaseAuth().currentUser;
  if (!current) throw new Error('Sign in first, then resend the verification email.');
  try {
    await sendEmailVerification(current);
  } catch (e) {
    throw friendlyError(e);
  }
}

export async function resetPassword(email: string): Promise<void> {
  const normalised = email.trim().toLowerCase();
  const check = checkInstitutionalEmail(normalised);
  if (!check.ok) throw new Error(check.error ?? 'Email not allowed.');
  try {
    await sendPasswordResetEmail(firebaseAuth(), normalised);
  } catch (e) {
    throw friendlyError(e);
  }
}

export async function signOut(): Promise<void> {
  await fbSignOut(firebaseAuth());
}

/** Restores a session on cold start; resolves null when nobody is signed in. */
export function observeSession(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(firebaseAuth(), async (fbUser) => {
    if (!fbUser) {
      cb(null);
      return;
    }
    try {
      if (!fbUser.emailVerified) {
        // The cached record lags behind a link opened in a browser or on another
        // device, so re-read it before deciding the account is unverified.
        await fbUser.reload();
        if (!fbUser.emailVerified) {
          cb(null);
          return;
        }
        await fbUser.getIdToken(true);
      }
      cb(await loadProfile(fbUser));
    } catch {
      cb(null);
    }
  });
}
