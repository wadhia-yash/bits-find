import { CategoryBars } from '../components/CategoryBars';
import { ItemsTable } from '../components/ItemsTable';
import { StatCard } from '../components/StatCard';
import { ZoneChart } from '../components/ZoneChart';
import { RECENT_ITEMS_LIMIT } from '../constants';
import { itemsByCategory, itemsByZone, overviewStats } from '../stats';
import type { PageProps } from '../types';

export function Overview({ items, showCampus }: PageProps) {
  const stats = overviewStats(items);
  return (
    <>
      <div className="stat-grid">
        <StatCard label="Items reported" value={String(stats.reported)} note="In this sample" />
        <StatCard label="Returned" value={String(stats.returned)} note="Owner confirmed" />
        <StatCard
          label="Recovery rate"
          value={`${stats.recoveryRate}%`}
          note="Returned ÷ reported"
          highlight
        />
        <StatCard label="Pending matches" value={String(stats.pendingMatches)} note="Awaiting confirmation" />
      </div>

      <div className="two-col">
        <ZoneChart rows={itemsByZone(items)} />
        <CategoryBars rows={itemsByCategory(items)} />
      </div>

      <ItemsTable items={items.slice(0, RECENT_ITEMS_LIMIT)} showCampus={showCampus} caption="Recent items" />
    </>
  );
}
