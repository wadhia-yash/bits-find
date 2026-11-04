import { useMemo, useState } from 'react';
import { Page, Sidebar } from './components/Sidebar';
import { mockHandovers, mockItems } from './mockData';
import { Handovers } from './pages/Handovers';
import { LostItems } from './pages/LostItems';
import { Overview } from './pages/Overview';
import { CAMPUSES, CampusId } from './types';

const TITLES: Record<Page, { title: string; sub: string }> = {
  overview: { title: 'Recovery overview', sub: 'How well lost items are finding their way home' },
  items: { title: 'Lost items', sub: 'Every request, with its current status' },
  handovers: { title: 'Admin handovers', sub: 'Items dropped off at the BITS Admin desk' },
};

export default function App() {
  const [page, setPage] = useState<Page>('overview');
  const [campus, setCampus] = useState<CampusId | 'ALL'>('ALL');

  const items = useMemo(
    () => mockItems.filter((i) => campus === 'ALL' || i.campusId === campus),
    [campus],
  );
  const handovers = useMemo(
    () => mockHandovers.filter((h) => campus === 'ALL' || h.campusId === campus),
    [campus],
  );
  const showCampus = campus === 'ALL';
  const heading = TITLES[page];

  return (
    <div className="shell">
      <Sidebar page={page} onChange={setPage} />
      <main className="main">
        <header className="topbar">
          <div>
            <h1>{heading.title}</h1>
            <p className="sub">{heading.sub}</p>
          </div>
          <div className="topbar-right">
            <span className="sample-tag">Sample data</span>
            <label className="select-label">
              <span className="sr-only">Campus</span>
              <select value={campus} onChange={(e) => setCampus(e.target.value as CampusId | 'ALL')}>
                <option value="ALL">All campuses</option>
                {CAMPUSES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </label>
          </div>
        </header>

        {page === 'overview' && <Overview items={items} showCampus={showCampus} />}
        {page === 'items' && <LostItems items={items} showCampus={showCampus} />}
        {page === 'handovers' && <Handovers handovers={handovers} showCampus={showCampus} />}
      </main>
    </div>
  );
}
