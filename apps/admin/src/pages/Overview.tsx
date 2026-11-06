import { BarList } from '../components/BarList';
import { ItemsTable } from '../components/ItemsTable';
import { LocationChart } from '../components/LocationChart';
import { StatCard } from '../components/StatCard';
import { ALL, RECENT_ITEMS_LIMIT } from '../constants';
import { itemsByArea, itemsByBranch, itemsByCategory, itemsByFormat, overviewStats } from '../stats';
import type { PageProps } from '../types';
import { branchName } from '../utils';

export function Overview({ org, branchId, items, showBranch }: PageProps) {
  const stats = overviewStats(items);

  // All branches: compare branches. One branch: zoom in on its screens/areas.
  const chart =
    branchId === ALL
      ? { title: `Items by ${org.terms.branch.toLowerCase()}`, rows: itemsByBranch(org, items) }
      : { title: `Busiest places at ${branchName(org, branchId)}`, rows: itemsByArea(org, items) };

  return (
    <>
      <div className="stat-grid">
        <StatCard label="Items reported" value={String(stats.reported)} note="In this sample" />
        <StatCard label="Returned" value={String(stats.returned)} note="Owner confirmed" />
        <StatCard label="Recovery rate" value={`${stats.recoveryRate}%`} note="Returned ÷ reported" highlight />
        <StatCard label="Pending matches" value={String(stats.pendingMatches)} note="Awaiting confirmation" />
      </div>

      <div className="two-col">
        <LocationChart title={chart.title} rows={chart.rows} />
        <BarList title="Items by category" rows={itemsByCategory(org, items)} />
      </div>

      {org.terms.format && (
        <BarList title={`Items by ${org.terms.format.toLowerCase()}`} rows={itemsByFormat(org, items)} />
      )}

      <ItemsTable org={org} items={items.slice(0, RECENT_ITEMS_LIMIT)} showBranch={showBranch} caption="Recent items" />
    </>
  );
}
