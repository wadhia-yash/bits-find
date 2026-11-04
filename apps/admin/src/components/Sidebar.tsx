export type Page = 'overview' | 'items' | 'handovers';

const NAV: { id: Page; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'items', label: 'Lost items' },
  { id: 'handovers', label: 'Handovers' },
];

interface Props {
  page: Page;
  onChange: (page: Page) => void;
}

export function Sidebar({ page, onChange }: Props) {
  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">BF</span>
        <span className="brand-name">BITS Find</span>
      </div>
      <p className="nav-heading">Admin panel</p>
      <nav>
        {NAV.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={`nav-item${page === entry.id ? ' active' : ''}`}
            aria-current={page === entry.id ? 'page' : undefined}
            onClick={() => onChange(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </nav>
      <p className="sidebar-note">Showing sample data. Not connected to Firebase yet.</p>
    </aside>
  );
}
