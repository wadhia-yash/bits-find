/**
 * Demo data for the proof of concept.
 *
 * Seeds two campuses on purpose: the Pilani rows are what a Pilani account
 * sees, and the single Goa row exists only to prove campus scoping during the
 * demo — a Goa account cannot see any of the Pilani posts, and vice versa.
 */

import { dbAdmin } from './db';
import { Item, Match, User } from '../types';

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
    },
    {
      uid: 'u_ishita',
      name: 'Ishita Rao',
      email: 'f20210456@pilani.bits-pilani.ac.in',
      campusId: 'pilani',
    },
    {
      uid: 'u_kabir',
      name: 'Kabir Sethi',
      email: 'f20230789@pilani.bits-pilani.ac.in',
      campusId: 'pilani',
    },
    {
      uid: 'u_meera',
      name: 'Meera Nair',
      email: 'f20220999@goa.bits-pilani.ac.in',
      campusId: 'goa',
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
      status: 'OPEN',
      createdAt: daysAgo(1),
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
      status: 'CLAIM_PENDING',
      createdAt: daysAgo(2),
    },
    {
      id: 'item_seed_3',
      campusId: 'pilani',
      ownerId: 'u_aarav',
      ownerName: 'Aarav Mehta',
      title: 'Campus ID card',
      description:
        'Institute ID card in a transparent holder with a black lanyard.',
      category: 'ID Card',
      lastSeenZone: 'ANC / Market',
      lostAt: daysAgo(6),
      status: 'RETURNED',
      createdAt: daysAgo(6),
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
      status: 'OPEN',
      createdAt: daysAgo(3),
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
      status: 'OPEN',
      createdAt: daysAgo(1),
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
      status: 'PENDING',
      createdAt: daysAgo(1),
    },
  ];

  await dbAdmin.seedUsers(users);
  await dbAdmin.seedItems(items);
  await dbAdmin.seedMatches(matches);
  await dbAdmin.markSeeded();
}
