import type { ItemsTableProps } from '../types';
import { campusLabel, shortDate } from '../utils';
import { StatusBadge } from './StatusBadge';

export function ItemsTable({ items, showCampus, caption }: ItemsTableProps) {
  return (
    <section className="panel" aria-label={caption}>
      <header className="panel-head">
        <h2>{caption}</h2>
        <span className="panel-meta">{items.length} shown</span>
      </header>
      {items.length === 0 ? (
        <p className="empty">Nothing matches this view.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Item</th>
                {showCampus && <th scope="col">Campus</th>}
                <th scope="col">Location</th>
                <th scope="col">Reported</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="cell-title">{item.title}<span className="cell-sub">{item.category}</span></td>
                  {showCampus && <td>{campusLabel(item.campusId)}</td>}
                  <td>{item.lastSeenZone}</td>
                  <td>{shortDate(item.createdAt)}</td>
                  <td><StatusBadge status={item.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
