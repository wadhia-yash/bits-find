import type { Category } from './domain';

export interface OverviewStats {
  reported: number;
  returned: number;
  /** 0 to 100, one decimal place. */
  recoveryRate: number;
  /** Items where a finder has responded and the owner has not confirmed yet. */
  pendingMatches: number;
  open: number;
  expired: number;
}

export interface ZoneStat {
  zone: string;
  reported: number;
  returned: number;
}

export interface CategoryStat {
  category: Category;
  count: number;
}

export interface HandoverStats {
  total: number;
  atDesk: number;
  collected: number;
  /** Average hours from drop-off to the owner collecting, or null if none collected. */
  avgTurnaroundHours: number | null;
}
