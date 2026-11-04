import type { StatCardProps } from '../types';

export function StatCard({ label, value, note, highlight }: StatCardProps) {
  return (
    <div className={`stat-card${highlight ? ' highlight' : ''}`}>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      <p className="stat-note">{note}</p>
    </div>
  );
}
