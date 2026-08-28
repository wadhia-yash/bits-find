/**
 * Domain model for the BTS Find proof of concept.
 *
 * Deliberately small: the POC demonstrates one loop — someone reports a lost
 * item, someone else says they found it, the owner confirms it came back.
 */

export type CampusId = 'pilani' | 'goa' | 'hyderabad' | 'dubai';

export const CAMPUSES: { id: CampusId; label: string }[] = [
  { id: 'pilani', label: 'BITS Pilani' },
  { id: 'goa', label: 'BITS Goa' },
  { id: 'hyderabad', label: 'BITS Hyderabad' },
  { id: 'dubai', label: 'BITS Dubai' },
];

/** The closed loop: a request opens, gets claimed, and closes on the owner's word. */
export type ItemStatus = 'OPEN' | 'CLAIM_PENDING' | 'RETURNED';

export type Category =
  | 'ID Card'
  | 'Wallet / Cards'
  | 'Electronics'
  | 'Keys'
  | 'Books / Notes'
  | 'Bag'
  | 'Bottle'
  | 'Clothing'
  | 'Other';

export const CATEGORIES: Category[] = [
  'ID Card',
  'Wallet / Cards',
  'Electronics',
  'Keys',
  'Books / Notes',
  'Bag',
  'Bottle',
  'Clothing',
  'Other',
];

export type MatchStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';

export interface User {
  uid: string;
  name: string;
  email: string;
  campusId: CampusId;
}

/** A lost item request. */
export interface Item {
  id: string;
  campusId: CampusId;
  ownerId: string;
  ownerName: string;
  title: string;
  description: string;
  category: Category;
  lastSeenZone: string;
  /** ISO timestamp of when the item was last seen. */
  lostAt: string;
  status: ItemStatus;
  createdAt: string;
}

/** A finder's response to a request. Visible only to the owner and the finder. */
export interface Match {
  id: string;
  itemId: string;
  finderId: string;
  finderName: string;
  /** Private detail that proves the finder really has the item. */
  matchText: string;
  status: MatchStatus;
  createdAt: string;
  completedAt?: string;
}

export const CAMPUS_ZONES: Record<CampusId, string[]> = {
  pilani: [
    'FD-I', 'FD-II', 'FD-III', 'Library', 'LTC', 'Sports Complex',
    'Bhawan Area', 'ANC / Market', 'Clock Tower', 'Workshop', 'Medical Centre',
  ],
  goa: [
    'Library', 'D-Block', 'Mess-1', 'Mess-2', 'Sports Complex',
    'Auditorium', 'Beach Side Gate', 'Hostel Area', 'Food Court', 'Medical Centre',
  ],
  hyderabad: [
    'Library', 'Lecture Theatre Complex', 'Mess-1', 'Mess-2', 'Sports Complex',
    'Auditorium', 'Hostel Area', 'Food Court', 'Medical Centre', 'Main Gate',
  ],
  dubai: [
    'Library', 'Atrium', 'Cafeteria', 'Sports Area', 'Auditorium',
    'Hostel Area', 'Labs', 'Medical Room', 'Main Gate',
  ],
};
