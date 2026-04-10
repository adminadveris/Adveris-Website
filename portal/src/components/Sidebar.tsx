import React from 'react';
import { NavLink } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

interface SidebarProps {
  role: 'admin' | 'employee' | 'client';
}

const navItems = [
  { name: 'Overview', path: '/dashboard', icon: 'grid', roles: ['admin', 'employee', 'client'] },
  { name: 'New Request', path: '/dashboard/new-request', icon: 'plus-circle', roles: ['client', 'admin'] },
  { name: 'My Mandates', path: '/dashboard/records', icon: 'folder', roles: ['client'] },
  { name: 'Service Hub', path: '/dashboard/service-hub', icon: 'shield', roles: ['admin', 'employee'] },
  { name: 'Timesheets', path: '/dashboard/timesheets', icon: 'clock', roles: ['admin', 'employee'] },
  { name: 'Expenses', path: '/dashboard/expenses', icon: 'file-text', roles: ['admin', 'employee', 'client'] },
  { name: 'Firm Directory', path: '/dashboard/directory', icon: 'users', roles: ['admin', 'employee'] },
];

const Icon = ({ name }: { name: string }) => {
  const icons: Record<string, JSX.Element> = {
    grid: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>,
    'plus-circle': <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></>,
    folder: <><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    'file-text': <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>,
    users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
  };
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const handleLogout = async () => {
    localStorage.removeItem('adveris_mock_session');
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const filtered = navItems.filter(item => item.roles.includes(role));

  return (
    <aside className="portal-sidebar">
      {/* Brand */}
      <div className="portal-sidebar__brand">
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 400, color: 'var(--saffron)', fontStyle: 'italic', lineHeight: 1 }}>
          Adveris
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <span style={{ width: 20, height: 1, background: 'var(--saffron-border)' }} />
          <p style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
            Intelligence Portal
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="portal-sidebar__nav">
        <p className="portal-nav-section-label">Management</p>
        {filtered.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            className={({ isActive }) =>
              `portal-nav-item${isActive ? ' active' : ''}`
            }
          >
            <Icon name={item.icon} />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="portal-sidebar__footer">
        <div className="portal-user-chip">
          <div className="portal-user-avatar">
            {role.charAt(0).toUpperCase()}
          </div>
          <div className="portal-user-info">
            <p>{role.charAt(0).toUpperCase() + role.slice(1)}</p>
            <span>Verified Session</span>
          </div>
        </div>
        <button className="portal-logout-btn" onClick={handleLogout}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
