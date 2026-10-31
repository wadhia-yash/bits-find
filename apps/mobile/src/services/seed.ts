/**
 * Demo data for the pilot build (PRD §9, Week 6 — "demo data").
 *
 * Seeds two campuses on purpose: the Pilani rows are what a Pilani account
 * sees, and the Goa rows exist only to prove the campus-scoping rule during the
 * demo (success criterion #35 — a different-campus user cannot read the post).
 */

import { addDays, dbAdmin, newId } from './db';
import { CampusAlert, Item, Match, User } from '../types';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export async function seedIfEmpty(): Promise<void> {
  if (await dbAdmin.isSeeded()) return;

  const users: User[] = [
    {
      uid: 'u_aarav',
      name: 'Aarav Mehta',
      email: 'f20220123@pilani.bits-pilani.ac.in',
      campusId: 'pilani',
      phoneOptional: '+91 78370 41122',
      notificationPrefs: { campusAlerts: true, matchUpdates: true },
      emailVerified: true,
    },
    {
      uid: 'u_ishita',
      name: 'Ishita Rao',
      email: 'f20210456@pilani.bits-pilani.ac.in',
      campusId: 'pilani',
      notificationPrefs: { campusAlerts: true, matchUpdates: true },
      emailVerified: true,
    },
    {
      uid: 'u_kabir',
      name: 'Kabir Sethi',
      email: 'f20230789@pilani.bits-pilani.ac.in',
      campusId: 'pilani',
      notificationPrefs: { campusAlerts: true, matchUpdates: true },
      emailVerified: true,
    },
    {
      uid: 'u_meera',
      name: 'Meera Nair',
      email: 'f20220999@goa.bits-pilani.ac.in',
      campusId: 'goa',
      notificationPrefs: { campusAlerts: true, matchUpdates: true },
      emailVerified: true,
    },
  ];

  const items: Item[] = [
    {
      id: 'item_seed_1',
      campusId: 'pilani',
      ownerId: 'u_ishita',
      ownerName: 'Ishita Rao',
      title: 'Blue spiral notebook (EEE F111)',
      description:
        'Dark blue spiral notebook, roughly 200 pages, name written on the inside cover. Has printed tutorial sheets tucked in the back.',
      category: 'Books / Notes',
      lastSeenZone: 'FD-II',
      lostAt: daysAgo(1),
      contactMode: 'IN_APP',
      status: 'OPEN',
      createdAt: daysAgo(1),
      expiresAt: addDays(daysAgo(1), 14),
    },
    {
      id: 'item_seed_2',
      campusId: 'pilani',
      ownerId: 'u_kabir',
      ownerName: 'Kabir Sethi',
      title: 'Black wired earphones in grey pouch',
      description:
        'Wired earphones with a small grey fabric pouch. One ear tip is missing. Left them on a table while studying.',
      category: 'Electronics',
      lastSeenZone: 'Library',
      lostAt: daysAgo(2),
      contactMode: 'PHONE',
      status: 'CLAIM_PENDING',
      createdAt: daysAgo(2),
      expiresAt: addDays(daysAgo(2), 14),
    },
    {
      id: 'item_seed_3',
      campusId: 'pilani',
      ownerId: 'u_aarav',
      ownerName: 'Aarav Mehta',
      title: 'Campus ID card',
      description:
        'Institute ID card in a transparent holder with a black lanyard. Photo not uploaded — sensitive item.',
      category: 'ID Card',
      lastSeenZone: 'ANC / Market',
      lostAt: daysAgo(6),
      contactMode: 'IN_APP',
      status: 'RETURNED',
      createdAt: daysAgo(6),
      expiresAt: addDays(daysAgo(6), 14),
    },
    {
      id: 'item_seed_4',
      campusId: 'pilani',
      ownerId: 'u_ishita',
      ownerName: 'Ishita Rao',
      title: 'Steel water bottle with stickers',
      description:
        'Matte black steel bottle, covered in band and club stickers. Small dent near the base.',
      category: 'Bottle',
      lastSeenZone: 'Sports Complex',
      lostAt: daysAgo(3),
      contactMode: 'IN_APP',
      status: 'OPEN',
      createdAt: daysAgo(3),
      expiresAt: addDays(daysAgo(3), 14),
    },
    {
      // Different campus — must never appear for a Pilani account.
      id: 'item_seed_5',
      campusId: 'goa',
      ownerId: 'u_meera',
      ownerName: 'Meera Nair',
      title: 'Room keys with red keychain',
      description: 'Two keys on a red plastic keychain, dropped somewhere near the mess.',
      category: 'Keys',
      lastSeenZone: 'Mess-1',
      lostAt: daysAgo(1),
      contactMode: 'IN_APP',
      status: 'OPEN',
      createdAt: daysAgo(1),
      expiresAt: addDays(daysAgo(1), 14),
    },
  ];

  const matches: Match[] = [
    {
      id: 'match_seed_1',
      itemId: 'item_seed_2',
      finderId: 'u_aarav',
      finderName: 'Aarav Mehta',
      matchText:
        'Found grey pouch with earphones on the second-floor reading table. One ear tip is indeed missing.',
      handoverMode: 'ADMIN',
      adminDropoffStatus: 'SUBMITTED',
      status: 'PENDING',
      createdAt: daysAgo(1),
    },
  ];

  const alerts: CampusAlert[] = items
    .filter((i) => i.status !== 'HIDDEN')
    .map((i) => ({
      id: newId('alert'),
      campusId: i.campusId,
      itemId: i.id,
      title: `Lost on campus: ${i.title}`,
      body: `${i.category} · last seen near ${i.lastSeenZone}. Tap if you have seen it.`,
      createdAt: i.createdAt,
      read: true,
    }));

  await dbAdmin.seedUsers(users);
  await dbAdmin.seedItems(items);
  await dbAdmin.seedMatches(matches);
  await dbAdmin.seedAlerts(alerts);
  await dbAdmin.markSeeded();
}
