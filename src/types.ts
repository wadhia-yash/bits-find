/**
 * Domain model — mirrors PRD §7.2 (Firestore data model) one-for-one so the
 * local repository can later be swapped for Firestore without touching the UI.
 */

export type CampusId = 'pilani' | 'goa' | 'hyderabad' | 'dubai';

export const CAMPUSES: { id: CampusId; label: string; emailDomain: string }[] = [
  { id: 'pilani', label: 'BITS Pilani', emailDomain: 'pilani.bits-pilani.ac.in' },
  { id: 'goa', label: 'BITS Goa', emailDomain: 'goa.bits-pilani.ac.in' },
  { id: 'hyderabad', label: 'BITS Hyderabad', emailDomain: 'hyderabad.bits-pilani.ac.in' },
  { id: 'dubai', label: 'BITS Dubai', emailDomain: 'dubai.bits-pilani.ac.in' },
];

/** PRD §4.1 rule 16 — closed loop. */
export type ItemStatus = 'OPEN' | 'CLAIM_PENDING' | 'RETURNED' | 'EXPIRED' | 'HIDDEN';

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

/**
 * PRD §4.1 rule 15 — IDs and bank cards may be reported without a photo and the
 * user is warned to cover numbers / QR codes.
 */
export const SENSITIVE_CATEGORIES: Category[] = ['ID Card', 'Wallet / Cards'];

export type ContactMode = 'IN_APP' | 'PHONE' | 'EMAIL';

export const CONTACT_MODES: { id: ContactMode; label: string; hint: string }[] = [
  { id: 'IN_APP', label: 'In-app only', hint: 'Finder sees no personal contact detail' },
  { id: 'PHONE', label: 'Phone', hint: 'Shared only after you accept a match' },
  { id: 'EMAIL', label: 'Institutional email', hint: 'Shared only after you accept a match' },
];

/** PRD §4.2 / §5 — finder chooses direct handover or BITS Admin drop-off. */
export type HandoverMode = 'DIRECT' | 'ADMIN';

export type AdminDropoffStatus = 'NOT_APPLICABLE' | 'SUBMITTED' | 'COLLECTED';

export type MatchStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';

export interface User {
  uid: string;
  name: string;
  email: string;
  campusId: CampusId;
  /** Optional — never shown in push previews (PRD §4.1 rule 14). */
  phoneOptional?: string;
  notificationPrefs: {
    campusAlerts: boolean;
    matchUpdates: boolean;
  };
  emailVerified: boolean;
}

/** A Lost Item Request. Collection path: items/{itemId} */
export interface Item {
  id: string;
  campusId: CampusId;
  ownerId: string;
  ownerName: string;
  title: string;
  description: string;
  category: Category;
  imageUrlOptional?: string;
  lastSeenZone: string;
  /** ISO timestamp of when the item was last seen. */
  lostAt: string;
  contactMode: ContactMode;
  status: ItemStatus;
  createdAt: string;
  /** createdAt + 14 days — PRD §7.3 rule 26. */
  expiresAt: string;
}

/** Collection path: items/{itemId}/matches/{matchId} */
export interface Match {
  id: string;
  itemId: string;
  finderId: string;
  finderName: string;
  /** Private proof/match detail — visible only to owner + responding finder. */
  matchText: string;
  handoverMode: HandoverMode;
  adminDropoffStatus: AdminDropoffStatus;
  status: MatchStatus;
  createdAt: string;
  completedAt?: string;
}

/** Collection path: handover/{handoverId} */
export interface Handover {
  id: string;
  itemId: string;
  matchId: string;
  finderId: string;
  mode: HandoverMode;
  adminLocationOptional?: string;
  submittedAt: string;
  collectedAt?: string;
  status: 'PENDING' | 'SUBMITTED' | 'COLLECTED';
}

/** Privacy-safe campus alert — PRD §7.3 rule 23. */
export interface CampusAlert {
  id: string;
  campusId: CampusId;
  itemId: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

export const ADMIN_DESKS: Record<CampusId, string> = {
  pilani: 'Student Welfare Desk, Admin Building (Ground Floor)',
  goa: 'Admin Department Counter, Academic Block A',
  hyderabad: 'Admin Office Reception, Block D',
  dubai: 'Student Services Desk, Main Building',
};

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
