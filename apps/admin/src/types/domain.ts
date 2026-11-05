/**
 * Data shapes for the admin panel.
 *
 * These are a trimmed copy of apps/mobile/src/types.ts. Names and values are
 * kept identical on purpose, so that when the mock data is replaced by real
 * Firestore reads, nothing else in the admin panel has to change.
 *
 * Privacy rule (same as the mobile app): the admin panel only ever shows
 * counts, statuses, categories and places. It never carries phone numbers,
 * emails, owner names or private match text.
 */

export type CampusId = 'pilani' | 'goa' | 'hyderabad' | 'dubai';

export const CAMPUSES: { id: CampusId; label: string }[] = [
  { id: 'pilani', label: 'BITS Pilani' },
  { id: 'goa', label: 'BITS Goa' },
  { id: 'hyderabad', label: 'BITS Hyderabad' },
  { id: 'dubai', label: 'BITS Dubai' },
];

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

/** A lost item request, minus anything personal. */
export interface AdminItem {
  id: string;
  campusId: CampusId;
  title: string;
  category: Category;
  lastSeenZone: string;
  status: ItemStatus;
  /** ISO timestamp */
  createdAt: string;
}

export type HandoverStatus = 'PENDING' | 'SUBMITTED' | 'COLLECTED';

/** A BITS Admin Department drop-off. */
export interface AdminHandover {
  id: string;
  itemId: string;
  itemTitle: string;
  campusId: CampusId;
  status: HandoverStatus;
  submittedAt: string;
  collectedAt?: string;
}

export const STATUS_LABEL: Record<ItemStatus, string> = {
  OPEN: 'Open',
  CLAIM_PENDING: 'Claim pending',
  RETURNED: 'Returned',
  EXPIRED: 'Expired',
  HIDDEN: 'Hidden',
};

export const HANDOVER_LABEL: Record<HandoverStatus, string> = {
  PENDING: 'Pending',
  SUBMITTED: 'At admin desk',
  COLLECTED: 'Collected by owner',
};
