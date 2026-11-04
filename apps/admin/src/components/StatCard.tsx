interface Props {
  label: string;
  value: string;
  note: string;
  highlight?: boolean;
}

export function StatCard({ label, value, note, highlight }: Props) {
  return (
    <div className={`stat-card${highlight ? ' highlight' : ''}`}>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      <p className="stat-note">{note}</p>
    </div>
  );
}
