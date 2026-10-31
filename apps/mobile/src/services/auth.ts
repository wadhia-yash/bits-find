/**
 * Verified institutional sign-in (PRD §4.2 step 17).
 *
 * The pilot build simulates the Firebase Auth email-link/OTP round trip locally
 * so the flow can be demonstrated without a backend: the domain check, the
 * campus derivation and the "verified email required" gate are all real, only
 * the delivery of the code is stubbed. Swapping in Firebase Auth means
 * replacing sendVerificationCode/verifyCode — nothing else changes.
 */

import { CAMPUSES, CampusId, User } from '../types';
import { newId, sessionRepo, usersRepo } from './db';

export const INSTITUTE_DOMAIN = 'bits-pilani.ac.in';

export interface EmailCheck {
  ok: boolean;
  campusId?: CampusId;
  /**
   * True for a valid institute address whose sub-domain is not one of the four
   * residential campuses — online/WILP students, for example. The account is
   * allowed; the student just has to say which campus they are at, because that
   * cannot be inferred from `@online.bits-pilani.ac.in`.
   */
  needsCampusChoice?: boolean;
  error?: string;
}

/**
 * Institutional email only. The campus is derived from the sub-domain when the
 * sub-domain identifies one, and asked for when it does not — a hard failure
 * there would lock out every online, WILP and future sub-domain.
 */
export function checkInstitutionalEmail(rawEmail: string): EmailCheck {
  const email = rawEmail.trim().toLowerCase();

  if (!email) return { ok: false, error: 'Enter your institutional email.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'That does not look like a valid email address.' };
  }
  if (!email.endsWith(INSTITUTE_DOMAIN)) {
    return {
      ok: false,
      error: `Only @${INSTITUTE_DOMAIN} accounts can use BTS Find.`,
    };
  }

  const campus = CAMPUSES.find((c) => email.endsWith(`@${c.emailDomain}`));
  if (!campus) return { ok: true, needsCampusChoice: true };
  return { ok: true, campusId: campus.id };
}

/** Derives a readable display name from the local part of the address. */
function nameFromEmail(email: string): string {
  const local = email.split('@')[0];
  if (/^[fh]\d{8}$/i.test(local)) return local.toUpperCase();
  return local
    .split(/[._-]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

const pendingCodes = new Map<string, string>();

/**
 * Stands in for Firebase Auth sending a verification email. The code is
 * returned so the pilot build can display it on screen; a production build
 * returns nothing and the user reads it from their inbox.
 */
export async function sendVerificationCode(email: string): Promise<string> {
  const normalised = email.trim().toLowerCase();
  const code = String(100000 + Math.floor(Math.random() * 900000));
  pendingCodes.set(normalised, code);
  return code;
}

export async function verifyCode(
  email: string,
  code: string,
  chosenCampusId?: CampusId,
): Promise<User> {
  const normalised = email.trim().toLowerCase();
  const expected = pendingCodes.get(normalised);

  if (!expected) throw new Error('No verification code was requested for this email.');
  if (code.trim() !== expected) throw new Error('That code is not correct. Try again.');

  const check = checkInstitutionalEmail(normalised);
  if (!check.ok) throw new Error(check.error ?? 'Email not allowed.');

  const campusId = check.campusId ?? chosenCampusId;
  if (!campusId) throw new Error('Choose your campus to continue.');

  pendingCodes.delete(normalised);

  const existing = await usersRepo.byEmail(normalised);
  const user: User = existing
    ? { ...existing, emailVerified: true }
    : {
        uid: newId('u'),
        name: nameFromEmail(normalised),
        email: normalised,
        campusId,
        notificationPrefs: { campusAlerts: true, matchUpdates: true },
        emailVerified: true,
      };

  await usersRepo.upsert(user);
  await sessionRepo.set(user.uid);
  return user;
}

/** Demo shortcut — signs in one of the seeded pilot accounts. */
export async function signInSeededUser(uid: string): Promise<User> {
  const user = await usersRepo.byId(uid);
  if (!user) throw new Error('Demo account not found.');
  await sessionRepo.set(user.uid);
  return user;
}

export async function restoreSession(): Promise<User | null> {
  const uid = await sessionRepo.get();
  if (!uid) return null;
  const user = await usersRepo.byId(uid);
  return user ?? null;
}

export async function signOut(): Promise<void> {
  await sessionRepo.clear();
}
