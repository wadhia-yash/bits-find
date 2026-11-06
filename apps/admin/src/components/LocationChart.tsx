import type { LocationChartProps } from '../types';

/** Vertical bars: reported (light) next to returned (dark) for each place. */
export function LocationChart({ title, rows }: LocationChartProps) {
  const max = Math.max(1, ...rows.map((r) => r.reported));
  return (
    <section className="panel" aria-label={title}>
      <header className="panel-head">
        <h2>{title}</h2>
        <div className="legend">
          <span><i className="dot dot-reported" /> Reported</span>
          <span><i className="dot dot-returned" /> Returned</span>
        </div>
      </header>
      {rows.length === 0 ? (
        <p className="empty">No items to show.</p>
      ) : (
        <div className="zone-chart" role="list">
          {rows.map((row) => (
            <div className="zone-col" role="listitem" key={row.label}>
              <div className="zone-bars" title={`${row.label}: ${row.reported} reported, ${row.returned} returned`}>
                <div className="bar bar-reported" style={{ height: `${(row.reported / max) * 100}%` }}>
                  <span className="bar-num">{row.reported}</span>
                </div>
                <div className="bar bar-returned" style={{ height: `${(row.returned / max) * 100}%` }}>
                  {row.returned > 0 && <span className="bar-num bar-num-light">{row.returned}</span>}
                </div>
              </div>
              <p className="zone-name">{row.label}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
