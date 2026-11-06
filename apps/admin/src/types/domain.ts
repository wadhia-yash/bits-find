/**
 * Data shapes for the admin panel.
 *
 * Nothing here is specific to one kind of business. Places, categories and
 * wording come from an organization's config (see ./organization.ts), so the
 * same dashboard works for a cinema chain, a theme park or a college.
 *
 * Privacy rule: the admin panel only ever shows counts, statuses, categories
 * and places. It never carries phone numbers, emails, guest names or private
 * match text.
 */

export type ItemStatus = 'OPEN' | 'CLAIM_PENDING' | 'RETURNED' | 'EXPIRED' | 'HIDDEN';

/** A lost item request, minus anything personal. */
export interface AdminItem {
  id: string;
  orgId: string;
  /** Which branch of the organization (see OrganizationConfig.branches). */
  branchId: string;
  /** Which screen or area inside that branch (see Branch.areas). */
  areaId: string;
  title: string;
  /** One of the organization's categories. */
  category: string;
  status: ItemStatus;
  /** ISO timestamp */
  createdAt: string;
}

export type HandoverStatus = 'PENDING' | 'SUBMITTED' | 'COLLECTED';

/** An item handed in to the venue's staff for safekeeping. */
export interface AdminHandover {
  id: string;
  orgId: string;
  itemId: string;
  itemTitle: string;
  branchId: string;
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
  SUBMITTED: 'At desk',
  COLLECTED: 'Collected by owner',
};
