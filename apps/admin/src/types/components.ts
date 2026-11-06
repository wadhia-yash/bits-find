/**
 * Props for every component and page, in one place.
 * (A component's "props" are the values passed into it.)
 */

import type { AdminHandover, AdminItem, HandoverStatus, ItemStatus } from './domain';
import type { OrganizationConfig } from './organization';
import type { CountStat, GroupStat } from './stats';

/** Value of the branch dropdown when no single branch is picked. */
export type BranchFilter = string | 'ALL';

/** What every page receives from App (already filtered by the branch dropdown). */
export interface PageProps {
  org: OrganizationConfig;
  branchId: BranchFilter;
  items: AdminItem[];
  handovers: AdminHandover[];
  /** Show the Branch column? Only useful when all branches are shown together. */
  showBranch: boolean;
}

export interface SidebarProps {
  org: OrganizationConfig;
  /** Every organization available. The switcher only appears when there are two or more. */
  orgs: OrganizationConfig[];
  onOrgChange: (orgId: string) => void;
}

export interface StatCardProps {
  label: string;
  value: string;
  note: string;
  highlight?: boolean;
}

export interface StatusBadgeProps {
  status: ItemStatus;
}

export interface HandoverBadgeProps {
  status: HandoverStatus;
}

export interface LocationChartProps {
  title: string;
  rows: GroupStat[];
}

export interface BarListProps {
  title: string;
  rows: CountStat[];
}

export interface ItemsTableProps {
  org: OrganizationConfig;
  items: AdminItem[];
  showBranch: boolean;
  caption: string;
}
