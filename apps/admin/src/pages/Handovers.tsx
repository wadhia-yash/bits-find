import { HandoverBadge } from '../components/StatusBadge';
import { StatCard } from '../components/StatCard';
import { handoverStats, shortDate } from '../stats';
import { AdminHandover, CAMPUSES } from '../types';

interface Props {
  handovers: AdminHandover[];
  showCampus: boolean;
}

/** Hours as "1d 6h" or "14.5h". */
function formatHours(hours: number): string {
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  const rest = Math.round(hours - days * 24);
  return `${days}d ${rest}h`;
}

export function Handovers({ handovers, showCampus }: Props) {
  const stats = handoverStats(handovers);
  return (
    <>
      <div className="stat-grid">
        <StatCard label="Total drop-offs" value={String(stats.total)} note="Via BITS Admin desk" />
        <StatCard label="At admin desk" value={String(stats.atDesk)} note="Waiting for owner" />
        <StatCard label="Collected" value={String(stats.collected)} note="Owner picked up" />
        <StatCard
          label="Avg. turnaround"
          value={stats.avgTurnaroundHours === null ? '–' : formatHours(stats.avgTurnaroundHours)}
          note="Drop-off to pickup"
          highlight
        />
      </div>

      <section className="panel" aria-label="Admin handovers">
        <header className="panel-head">
          <h2>Admin handovers</h2>
          <span className="panel-meta">{handovers.length} shown</span>
        </header>
        {handovers.length === 0 ? (
          <p className="empty">No handovers for this campus.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  {showCampus && <th scope="col">Campus</th>}
                  <th scope="col">Dropped off</th>
                  <th scope="col">Collected</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {handovers.map((h) => (
                  <tr key={h.id}>
                    <td className="cell-title">{h.itemTitle}</td>
                    {showCampus && <td>{CAMPUSES.find((c) => c.id === h.campusId)?.label}</td>}
                    <td>{shortDate(h.submittedAt)}</td>
                    <td>{h.collectedAt ? shortDate(h.collectedAt) : '–'}</td>
                    <td><HandoverBadge status={h.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
