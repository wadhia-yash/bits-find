import type { ItemStatus } from './types';

/** Product name shown in the sidebar and the browser tab. */
export const PRODUCT_NAME = 'LnF';

/** Value of the branch dropdown that means "no filter". */
export const ALL = 'ALL';

/** Status buttons on the Lost items page. */
export const STATUS_FILTERS: (ItemStatus | typeof ALL)[] = [ALL, 'OPEN', 'CLAIM_PENDING', 'RETURNED', 'EXPIRED'];

/** How many rows the Overview "Recent items" table shows. */
export const RECENT_ITEMS_LIMIT = 8;

/** Label used when grouping every non-screen place together. */
export const COMMON_AREAS_LABEL = 'Common areas';
