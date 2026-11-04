import { useMemo, useState } from 'react';
import { ItemsTable } from '../components/ItemsTable';
import { STATUS_FILTERS } from '../constants';
import { ItemStatus, PageProps, STATUS_LABEL } from '../types';

export function LostItems({ items, showCampus }: PageProps) {
  const [status, setStatus] = useState<ItemStatus | 'ALL'>('ALL');
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (status !== 'ALL' && item.status !== status) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.lastSeenZone.toLowerCase().includes(q)
      );
    });
  }, [items, status, query]);

  return (
    <>
      <div className="toolbar">
        <div className="chips" role="group" aria-label="Filter by status">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className={`chip${status === f ? ' active' : ''}`}
              aria-pressed={status === f}
              onClick={() => setStatus(f)}
            >
              {f === 'ALL' ? 'All' : STATUS_LABEL[f]}
            </button>
          ))}
        </div>
        <input
          className="search"
          type="search"
          placeholder="Search item, category or location"
          aria-label="Search lost items"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <ItemsTable items={visible} showCampus={showCampus} caption="All lost items" />
    </>
  );
}
