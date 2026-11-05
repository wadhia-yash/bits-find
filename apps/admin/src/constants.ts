import type { ItemStatus } from './types';

/** Status buttons on the Lost items page. */
export const STATUS_FILTERS: (ItemStatus | 'ALL')[] = ['ALL', 'OPEN', 'CLAIM_PENDING', 'RETURNED', 'EXPIRED'];

/** How many rows the Overview "Recent items" table shows. */
export const RECENT_ITEMS_LIMIT = 8;
