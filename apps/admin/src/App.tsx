import { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { ORGANIZATIONS } from './config/organizations';
import { ALL, PRODUCT_NAME } from './constants';
import { mockHandovers, mockItems } from './data/mock';
import { ROUTES } from './routes';
import type { BranchFilter } from './types';

export default function App() {
  const { pathname } = useLocation();
  const [orgId, setOrgId] = useState(ORGANIZATIONS[0].id);
  const [branchId, setBranchId] = useState<BranchFilter>(ALL);

  const org = ORGANIZATIONS.find((o) => o.id === orgId) ?? ORGANIZATIONS[0];

  useEffect(() => {
    document.title = `${PRODUCT_NAME} Admin · ${org.name}`;
  }, [org.name]);

  const changeOrg = (id: string) => {
    setOrgId(id);
    setBranchId(ALL); // branches belong to one organization
  };

  const items = useMemo(
    () => mockItems.filter((i) => i.orgId === org.id && (branchId === ALL || i.branchId === branchId)),
    [org.id, branchId],
  );
  const handovers = useMemo(
    () => mockHandovers.filter((h) => h.orgId === org.id && (branchId === ALL || h.branchId === branchId)),
    [org.id, branchId],
  );
  const showBranch = branchId === ALL;
  const current = ROUTES.find((route) => route.path === pathname) ?? ROUTES[0];

  return (
    <div className="shell">
      <Sidebar org={org} orgs={ORGANIZATIONS} onOrgChange={changeOrg} />
      <main className="main">
        <header className="topbar">
          <div>
            <h1>{current.title}</h1>
            <p className="sub">{current.subtitle}</p>
          </div>
          <div className="topbar-right">
            <span className="sample-tag">Sample data</span>
            <label className="select-label">
              <span className="sr-only">{org.terms.branch}</span>
              <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                <option value={ALL}>All {org.terms.branches.toLowerCase()}</option>
                {org.branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.label}</option>
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
              element={<Page org={org} branchId={branchId} items={items} handovers={handovers} showBranch={showBranch} />}
            />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
