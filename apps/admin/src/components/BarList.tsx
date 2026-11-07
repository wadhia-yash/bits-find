import type { BarListProps } from '../types';

/** Horizontal bars, one row per label (categories, screen formats...). */
export function BarList({ title, rows }: BarListProps) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <section className="panel" aria-label={title}>
      <header className="panel-head">
        <h2>{title}</h2>
      </header>
      {rows.length === 0 ? (
        <p className="empty">No items to show.</p>
      ) : (
        <ul className="cat-list">
          {rows.map((row) => (
            <li key={row.label} className="cat-row">
              <span className="cat-name">{row.label}</span>
              <span className="cat-track" aria-hidden="true">
                <span className="cat-fill" style={{ width: `${(row.count / max) * 100}%` }} />
              </span>
              <span className="cat-count">{row.count}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
