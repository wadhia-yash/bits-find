/**
 * Session handling for the proof of concept.
 *
 * There are no real accounts yet: the demo signs in as one of the seeded
 * students so the whole lost-and-found loop can be walked on one device.
 * Verified institutional sign-in is the next step, and it replaces this file
 * without touching anything above it.
 */

import { User } from '../types';
import { sessionRepo, usersRepo } from './db';

/** Signs in one of the seeded demo students. */
export async function signInDemoUser(uid: string): Promise<User> {
  const user = await usersRepo.byId(uid);
  if (!user) throw new Error('Demo account not found.');
  await sessionRepo.set(user.uid);
  return user;
}

export async function restoreSession(): Promise<User | null> {
  const uid = await sessionRepo.get();
  if (!uid) return null;
  return (await usersRepo.byId(uid)) ?? null;
}

export async function signOut(): Promise<void> {
  await sessionRepo.clear();
}
