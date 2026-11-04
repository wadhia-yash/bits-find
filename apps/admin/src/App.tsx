import { useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { mockHandovers, mockItems } from './mockData';
import { ROUTES } from './routes';
import { CAMPUSES, CampusId } from './types';

export default function App() {
  const { pathname } = useLocation();
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
  const current = ROUTES.find((route) => route.path === pathname) ?? ROUTES[0];

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <header className="topbar">
          <div>
            <h1>{current.title}</h1>
            <p className="sub">{current.subtitle}</p>
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

        <Routes>
          {ROUTES.map(({ path, component: Page }) => (
            <Route
              key={path}
              path={path}
              element={<Page items={items} handovers={handovers} showCampus={showCampus} />}
            />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
