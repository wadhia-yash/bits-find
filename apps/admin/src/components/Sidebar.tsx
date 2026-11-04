import { NavLink } from 'react-router-dom';
import { ROUTES } from '../routes';

export function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">BF</span>
        <span className="brand-name">BITS Find</span>
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
