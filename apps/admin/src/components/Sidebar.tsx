import { NavLink } from 'react-router-dom';
import { PRODUCT_NAME } from '../constants';
import { ROUTES } from '../routes';
import type { SidebarProps } from '../types';

export function Sidebar({ org, orgs, onOrgChange }: SidebarProps) {
  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">LnF</span>
        <span className="brand-name">{PRODUCT_NAME}</span>
      </div>
      <div className="org-box">
        <p className="nav-heading">Organization</p>
        {orgs.length > 1 ? (
          <select
            className="org-select"
            aria-label="Organization"
            value={org.id}
            onChange={(e) => onOrgChange(e.target.value)}
          >
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        ) : (
          <p className="org-name">{org.name}</p>
        )}
      </div>
      <p className="nav-heading">Admin panel</p>
      <nav>
        {ROUTES.map((route) => (
          <NavLink
            key={route.path}
            to={route.path}
            end
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            {route.label}
          </NavLink>
        ))}
      </nav>
      <p className="sidebar-note">Showing sample data. Not connected to Firebase yet.</p>
    </aside>
  );
}
