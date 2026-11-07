import type { Area, Branch, OrganizationConfig } from '../types';

export function findBranch(org: OrganizationConfig, branchId: string): Branch | undefined {
  return org.branches.find((b) => b.id === branchId);
}

export function findArea(org: OrganizationConfig, branchId: string, areaId: string): Area | undefined {
  return findBranch(org, branchId)?.areas.find((a) => a.id === areaId);
}

/** "Mumbai · Andheri" for a branch id. Falls back to the id itself. */
export function branchName(org: OrganizationConfig, branchId: string): string {
  return findBranch(org, branchId)?.label ?? branchId;
}

/** "Screen 3 · IMAX" or "Lobby". */
export function areaName(org: OrganizationConfig, branchId: string, areaId: string): string {
  const area = findArea(org, branchId, areaId);
  if (!area) return areaId;
  return area.format ? `${area.label} · ${area.format}` : area.label;
}
