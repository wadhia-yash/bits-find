/**
 * Sample data, generated from each organization's config.
 * Same seed gives the same data every time, so the demo never changes.
 * This file is the only thing to replace when real data (Firebase) is connected.
 */

import { ORGANIZATIONS } from '../config/organizations';
import type { AdminHandover, AdminItem, HandoverStatus, ItemStatus, OrganizationConfig } from '../types';
import { makeRandom } from '../utils';

/** "Today" for the sample data, so numbers and dates stay stable. */
const MOCK_NOW = new Date('2026-11-06T12:00:00Z').getTime();
const DAY = 86_400_000;
const HOUR = 3_600_000;

type Random = () => number;

function pickWeighted(rand: Random, weights: Record<string, number>): string {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = rand() * total;
  for (const [key, w] of entries) {
    roll -= w;
    if (roll <= 0) return key;
  }
  return entries[entries.length - 1][0];
}

function pick<T>(rand: Random, list: T[]): T {
  return list[Math.floor(rand() * list.length)];
}

function seedFrom(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Older items are more likely to be finished (returned or expired). */
function pickStatus(rand: Random, ageDays: number): ItemStatus {
  const r = rand();
  if (ageDays < 3) return r < 0.7 ? 'OPEN' : r < 0.9 ? 'CLAIM_PENDING' : 'RETURNED';
  if (ageDays < 14) return r < 0.35 ? 'OPEN' : r < 0.5 ? 'CLAIM_PENDING' : r < 0.92 ? 'RETURNED' : 'HIDDEN';
  return r < 0.1 ? 'OPEN' : r < 0.72 ? 'RETURNED' : r < 0.97 ? 'EXPIRED' : 'HIDDEN';
}

/** Screens are busier than corridors, so they get more reports. */
function pickArea(rand: Random, org: OrganizationConfig, branchId: string): string {
  const branch = org.branches.find((b) => b.id === branchId);
  if (!branch) return '';
  const weights: Record<string, number> = {};
  for (const area of branch.areas) weights[area.id] = area.format ? 6 : 2;
  return pickWeighted(rand, weights);
}

function buildItems(org: OrganizationConfig): AdminItem[] {
  const rand = makeRandom(seedFrom(org.id));
  const items: AdminItem[] = [];
  for (let i = 0; i < org.mock.itemCount; i += 1) {
    const branchId = pickWeighted(rand, org.mock.branchWeights);
    const category = pickWeighted(rand, org.mock.categoryWeights);
    const ageDays = Math.floor(rand() * rand() * 45);
    const createdAt = new Date(MOCK_NOW - ageDays * DAY - Math.floor(rand() * 20) * HOUR).toISOString();
    items.push({
      id: `${org.id}-item-${i + 1}`,
      orgId: org.id,
      branchId,
      areaId: pickArea(rand, org, branchId),
      title: pick(rand, org.mock.titles[category] ?? [category]),
      category,
      status: pickStatus(rand, ageDays),
      createdAt,
    });
  }
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function buildHandovers(org: OrganizationConfig, items: AdminItem[]): AdminHandover[] {
  const rand = makeRandom(seedFrom(`${org.id}-handovers`));
  const handovers: AdminHandover[] = [];
  for (const item of items) {
    if (rand() > 0.4) continue;
    const submittedAt = new Date(item.createdAt).getTime() + Math.floor(rand() * 6) * HOUR;
    const collected = item.status === 'RETURNED' && rand() < 0.8;
    const status: HandoverStatus = collected ? 'COLLECTED' : item.status === 'OPEN' ? 'SUBMITTED' : 'PENDING';
    handovers.push({
      id: `${org.id}-handover-${handovers.length + 1}`,
      orgId: org.id,
      itemId: item.id,
      itemTitle: item.title,
      branchId: item.branchId,
      status,
      submittedAt: new Date(submittedAt).toISOString(),
      collectedAt: collected ? new Date(submittedAt + (4 + Math.floor(rand() * 60)) * HOUR).toISOString() : undefined,
    });
  }
  return handovers;
}

export const mockItems: AdminItem[] = ORGANIZATIONS.flatMap(buildItems);
export const mockHandovers: AdminHandover[] = ORGANIZATIONS.flatMap((org) =>
  buildHandovers(
    org,
    mockItems.filter((i) => i.orgId === org.id),
  ),
);
