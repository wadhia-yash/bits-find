/**
 * Everything that differs between businesses lives in an OrganizationConfig:
 * its name, its own words for things, its branches and the places inside them,
 * and the kinds of items that get lost there.
 *
 * To support a new kind of business, add one config (src/config/organizations/)
 * and register it in src/config/organizations/index.ts. No screen changes.
 */

/** A place inside a branch where an item can be lost. */
export interface Area {
  id: string;
  /** "Screen 3", "Lobby", "Ride 12"... */
  label: string;
  /** Optional sub-type shown next to the label, e.g. "IMAX" or "3D" for a cinema screen. */
  format?: string;
}

export interface Branch {
  id: string;
  /** "Mumbai · Andheri" */
  label: string;
  areas: Area[];
}

/** The organization's own words, so the UI never says "campus" to a cinema. */
export interface Terms {
  /** "Branch" */
  branch: string;
  /** "Branches" */
  branches: string;
  /** "Screen / area" */
  area: string;
  /** "Guest services" */
  desk: string;
  /** Name for Area.format, e.g. "Screen format". Leave out when the business has none. */
  format?: string;
}

/** Only used to generate believable sample data. */
export interface MockProfile {
  itemCount: number;
  /** Relative frequency of each category (same keys as OrganizationConfig.categories). */
  categoryWeights: Record<string, number>;
  /** Example item names per category. */
  titles: Record<string, string[]>;
  /** Relative number of items per branch id. */
  branchWeights: Record<string, number>;
}

export interface OrganizationConfig {
  id: string;
  name: string;
  terms: Terms;
  categories: string[];
  branches: Branch[];
  mock: MockProfile;
}
