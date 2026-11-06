/**
 * All the maths for the dashboard lives here, in plain functions.
 * Each one takes the list of items (or handovers) and returns numbers.
 */

import { COMMON_AREAS_LABEL } from './constants';
import type { AdminHandover, AdminItem, CountStat, GroupStat, HandoverStats, OrganizationConfig, OverviewStats } from './types';
import { areaName, branchName, findArea } from './utils';

export function overviewStats(items: AdminItem[]): OverviewStats {
  const reported = items.length;
  const returned = items.filter((i) => i.status === 'RETURNED').length;
  const pendingMatches = items.filter((i) => i.status === 'CLAIM_PENDING').length;
  const open = items.filter((i) => i.status === 'OPEN').length;
  const expired = items.filter((i) => i.status === 'EXPIRED').length;
  const recoveryRate = reported === 0 ? 0 : Math.round((returned / reported) * 1000) / 10;
  return { reported, returned, recoveryRate, pendingMatches, open, expired };
}

/** Counts reported and returned per group, busiest first. */
function groupBy(items: AdminItem[], labelOf: (item: AdminItem) => string, limit: number): GroupStat[] {
  const map = new Map<string, GroupStat>();
  for (const item of items) {
    const label = labelOf(item);
    const row = map.get(label) ?? { label, reported: 0, returned: 0 };
    row.reported += 1;
    if (item.status === 'RETURNED') row.returned += 1;
    map.set(label, row);
  }
  return [...map.values()].sort((a, b) => b.reported - a.reported).slice(0, limit);
}

export function itemsByBranch(org: OrganizationConfig, items: AdminItem[]): GroupStat[] {
  return groupBy(items, (i) => branchName(org, i.branchId), org.branches.length);
}

/** The busiest screens/areas. Names include the format, e.g. "Screen 3 · IMAX". */
export function itemsByArea(org: OrganizationConfig, items: AdminItem[], limit = 6): GroupStat[] {
  return groupBy(items, (i) => areaName(org, i.branchId, i.areaId), limit);
}

export function itemsByCategory(org: OrganizationConfig, items: AdminItem[]): CountStat[] {
  return org.categories
    .map((label) => ({ label, count: items.filter((i) => i.category === label).length }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count);
}

/** Items per screen format (2D, 3D, IMAX...). Places without a format are grouped as "Common areas". */
export function itemsByFormat(org: OrganizationConfig, items: AdminItem[]): CountStat[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const label = findArea(org, item.branchId, item.areaId)?.format ?? COMMON_AREAS_LABEL;
    map.set(label, (map.get(label) ?? 0) + 1);
  }
  return [...map.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
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
