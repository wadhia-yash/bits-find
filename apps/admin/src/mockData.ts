/**
 * MOCK DATA — fake records so the dashboard works without Firebase.
 *
 * To go live later, replace `mockItems` and `mockHandovers` with reads from
 * Firestore (collections `items` and `handover`). Everything else in the admin
 * panel only depends on the shapes in ./types/.
 *
 * The data is generated from a fixed seed, so the numbers are identical on
 * every reload. That keeps demos predictable.
 */

import {
  AdminHandover,
  AdminItem,
  CampusId,
  Category,
  HandoverStatus,
  ItemStatus,
} from './types';
import { makeRandom } from './utils';

/** "Today" for the mock data. Fixed so the demo never changes. */
export const MOCK_NOW = new Date('2026-11-04T10:00:00Z');

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

const rand = makeRandom(20261104);
const pick = <T,>(list: T[]): T => list[Math.floor(rand() * list.length)];

const ZONES: Record<CampusId, string[]> = {
  pilani: ['Library', 'FD-I', 'FD-II', 'LTC', 'Sports Complex', 'Clock Tower', 'ANC / Market'],
  goa: ['Library', 'D-Block', 'Mess-1', 'Sports Complex', 'Food Court', 'Auditorium'],
  hyderabad: ['Library', 'Lecture Theatre Complex', 'Mess-1', 'Food Court', 'Main Gate'],
  dubai: ['Library', 'Atrium', 'Cafeteria', 'Labs', 'Main Gate'],
};

const TITLES: Record<Category, string[]> = {
  'ID Card': ['BITS ID card', 'Student ID card'],
  'Wallet / Cards': ['Black leather wallet', 'Brown wallet with cards', 'Card holder'],
  Electronics: ['Wireless earbuds', 'Wireless headphones', 'Power bank', 'Scientific calculator', 'Phone charger'],
  Keys: ['House keys', 'Hostel room key', 'Bike key'],
  'Books / Notes': ['Calculus notebook', 'Physics textbook', 'Lab record book'],
  Bag: ['Grey backpack', 'Black laptop bag', 'Tote bag'],
  Bottle: ['Steel water bottle', 'Blue flask'],
  Clothing: ['Navy hoodie', 'Denim jacket', 'Scarf'],
  Other: ['Umbrella', 'Spectacles case', 'Sports shoes'],
};

/** Roughly how common each category is. Electronics and wallets lead. */
const CATEGORY_WEIGHTS: [Category, number][] = [
  ['Electronics', 6],
  ['Wallet / Cards', 5],
  ['ID Card', 4],
  ['Keys', 4],
  ['Bag', 3],
  ['Books / Notes', 3],
  ['Bottle', 2],
  ['Clothing', 2],
  ['Other', 2],
];

function pickCategory(): Category {
  const total = CATEGORY_WEIGHTS.reduce((sum, [, w]) => sum + w, 0);
  let roll = rand() * total;
  for (const [category, weight] of CATEGORY_WEIGHTS) {
    roll -= weight;
    if (roll <= 0) return category;
  }
  return 'Other';
}

const CAMPUS_WEIGHTS: CampusId[] = [
  'pilani', 'pilani', 'pilani', 'pilani',
  'goa', 'goa', 'goa',
  'hyderabad', 'hyderabad', 'hyderabad',
  'dubai',
];

function buildItems(): AdminItem[] {
  const items: AdminItem[] = [];
  for (let i = 0; i < 64; i += 1) {
    const campusId = pick(CAMPUS_WEIGHTS);
    const category = pickCategory();
    const ageDays = rand() * 30;
    const createdAt = new Date(MOCK_NOW.getTime() - ageDays * DAY - rand() * 6 * HOUR);

    // Choose a status. Open items older than 14 days expire (PRD rule: 14-day expiry).
    const roll = rand();
    let status: ItemStatus;
    if (roll < 0.42) status = 'RETURNED';
    else if (roll < 0.57) status = 'CLAIM_PENDING';
    else status = 'OPEN';
    if (status === 'OPEN' && ageDays > 14) status = 'EXPIRED';

    items.push({
      id: `item-${String(i + 1).padStart(3, '0')}`,
      campusId,
      title: pick(TITLES[category]),
      category,
      lastSeenZone: pick(ZONES[campusId]),
      status,
      createdAt: createdAt.toISOString(),
    });
  }
  // Newest first.
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function buildHandovers(items: AdminItem[]): AdminHandover[] {
  const handovers: AdminHandover[] = [];
  // About a third of returned / pending items went through the BITS Admin desk.
  for (const item of items) {
    if (item.status !== 'RETURNED' && item.status !== 'CLAIM_PENDING') continue;
    if (rand() > 0.4) continue;

    const submitted = new Date(new Date(item.createdAt).getTime() + (4 + rand() * 40) * HOUR);
    if (submitted > MOCK_NOW) continue;

    let status: HandoverStatus;
    let collectedAt: string | undefined;
    if (item.status === 'RETURNED') {
      status = 'COLLECTED';
      const collected = new Date(submitted.getTime() + (6 + rand() * 60) * HOUR);
      collectedAt = (collected > MOCK_NOW ? MOCK_NOW : collected).toISOString();
    } else {
      status = rand() < 0.3 ? 'PENDING' : 'SUBMITTED';
    }

    handovers.push({
      id: `handover-${String(handovers.length + 1).padStart(3, '0')}`,
      itemId: item.id,
      itemTitle: item.title,
      campusId: item.campusId,
      status,
      submittedAt: submitted.toISOString(),
      collectedAt,
    });
  }
  return handovers.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export const mockItems: AdminItem[] = buildItems();
export const mockHandovers: AdminHandover[] = buildHandovers(mockItems);
