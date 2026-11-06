import type { ItemsTableProps } from '../types';
import { areaName, branchName, shortDate } from '../utils';
import { StatusBadge } from './StatusBadge';

export function ItemsTable({ org, items, showBranch, caption }: ItemsTableProps) {
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
                {showBranch && <th scope="col">{org.terms.branch}</th>}
                <th scope="col">{org.terms.area}</th>
                <th scope="col">Reported</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="cell-title">{item.title}<span className="cell-sub">{item.category}</span></td>
                  {showBranch && <td>{branchName(org, item.branchId)}</td>}
                  <td>{areaName(org, item.branchId, item.areaId)}</td>
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
