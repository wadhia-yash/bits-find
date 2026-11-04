/**
 * All the maths for the dashboard lives here, in plain functions.
 * Each one takes the list of items (or handovers) and returns numbers.
 */

import { AdminHandover, AdminItem, CATEGORIES, Category } from './types';

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

export function overviewStats(items: AdminItem[]): OverviewStats {
  const reported = items.length;
  const returned = items.filter((i) => i.status === 'RETURNED').length;
  const pendingMatches = items.filter((i) => i.status === 'CLAIM_PENDING').length;
  const open = items.filter((i) => i.status === 'OPEN').length;
  const expired = items.filter((i) => i.status === 'EXPIRED').length;
  const recoveryRate = reported === 0 ? 0 : Math.round((returned / reported) * 1000) / 10;
  return { reported, returned, recoveryRate, pendingMatches, open, expired };
}

export interface ZoneStat {
  zone: string;
  reported: number;
  returned: number;
}

/** The busiest places, most reports first. */
export function itemsByZone(items: AdminItem[], limit = 6): ZoneStat[] {
  const map = new Map<string, ZoneStat>();
  for (const item of items) {
    const row = map.get(item.lastSeenZone) ?? { zone: item.lastSeenZone, reported: 0, returned: 0 };
    row.reported += 1;
    if (item.status === 'RETURNED') row.returned += 1;
    map.set(item.lastSeenZone, row);
  }
  return [...map.values()].sort((a, b) => b.reported - a.reported).slice(0, limit);
}

export interface CategoryStat {
  category: Category;
  count: number;
}

export function itemsByCategory(items: AdminItem[]): CategoryStat[] {
  return CATEGORIES.map((category) => ({
    category,
    count: items.filter((i) => i.category === category).length,
  }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count);
}

export interface HandoverStats {
  total: number;
  atDesk: number;
  collected: number;
  /** Average hours from drop-off to the owner collecting, or null if none collected. */
  avgTurnaroundHours: number | null;
}

export function handoverStats(handovers: AdminHandover[]): HandoverStats {
  const collected = handovers.filter((h) => h.status === 'COLLECTED' && h.collectedAt);
  const totalHours = collected.reduce(
    (sum, h) => sum + (new Date(h.collectedAt as string).getTime() - new Date(h.submittedAt).getTime()) / 3_600_000,
    0,
  );
  return {
    total: handovers.length,
    atDesk: handovers.filter((h) => h.status === 'SUBMITTED').length,
    collected: collected.length,
    avgTurnaroundHours: collected.length === 0 ? null : Math.round((totalHours / collected.length) * 10) / 10,
  };
}

/** "30 Sep" style date. */
export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}
