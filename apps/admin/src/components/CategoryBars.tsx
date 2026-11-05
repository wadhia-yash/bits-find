import type { CategoryBarsProps } from '../types';

/** Horizontal bars, one row per category. */
export function CategoryBars({ rows }: CategoryBarsProps) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <section className="panel" aria-label="Items by category">
      <header className="panel-head">
        <h2>Items by category</h2>
      </header>
      {rows.length === 0 ? (
        <p className="empty">No items to show.</p>
      ) : (
        <ul className="cat-list">
          {rows.map((row) => (
            <li key={row.category} className="cat-row">
              <span className="cat-name">{row.category}</span>
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
