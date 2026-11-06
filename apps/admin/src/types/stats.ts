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

/** Reported vs returned for one place (a branch, or a screen/area). */
export interface GroupStat {
  label: string;
  reported: number;
  returned: number;
}

/** A plain count for one label (a category, a screen format). */
export interface CountStat {
  label: string;
  count: number;
}

export interface HandoverStats {
  total: number;
  atDesk: number;
  collected: number;
  /** Average hours from drop-off to the owner collecting, or null if none collected. */
  avgTurnaroundHours: number | null;
}
