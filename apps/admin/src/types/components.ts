/**
 * Props for every component and page, in one place.
 * (A component's "props" are the values passed into it.)
 */

import type { AdminHandover, AdminItem, HandoverStatus, ItemStatus } from './domain';
import type { CategoryStat, ZoneStat } from './stats';

/** What every page receives from App (already filtered by the campus dropdown). */
export interface PageProps {
  items: AdminItem[];
  handovers: AdminHandover[];
  /** Show the Campus column? Only useful when "All campuses" is selected. */
  showCampus: boolean;
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

export interface ZoneChartProps {
  rows: ZoneStat[];
}

export interface CategoryBarsProps {
  rows: CategoryStat[];
}

export interface ItemsTableProps {
  items: AdminItem[];
  showCampus: boolean;
  caption: string;
}
