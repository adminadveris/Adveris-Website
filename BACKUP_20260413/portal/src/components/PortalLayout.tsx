import React from 'react';
import { NavLink } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const PortalLayout = ({ children, profile }: { children: React.ReactNode, profile: any }) => {


  const handleLogout = async () => {
    localStorage.removeItem('adveris_mock_session');
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const subNavItems = [
    {
      name: 'Overview',
      path: '/dashboard/overview',
      roles: ['admin', 'employee'],
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
    },
    {
      name: 'New Request',
      path: '/dashboard/new-request',
      roles: ['client', 'admin'],
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"></path></svg>
    },
    {
      name: 'Firm Mandates',
      path: '/dashboard/records',
      roles: ['admin', 'employee'],
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 17L12 22L22 17M2 12L12 17L22 12M12 2L2 7L12 12L22 7L12 2Z"></path></svg>
    },
    {
      name: 'My Mandates',
      path: '/dashboard/records',
      roles: ['client'],
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 17L12 22L22 17M2 12L12 17L22 12M12 2L2 7L12 12L22 7L12 2Z"></path></svg>
    },
    {
      name: 'Timesheets',
      path: '/dashboard/timesheets',
      roles: ['admin', 'employee'],
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
    },
    {
      name: 'Expenses',
      path: '/dashboard/expenses',
      roles: ['admin', 'employee'],
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
    },
    {
      name: 'Accounts & Clients',
      path: '/dashboard/crm',
      roles: ['admin', 'employee'],
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
    },
    {
      name: 'Action Logs',
      path: '/dashboard/service-hub',
      roles: ['admin'],
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
    },
  ].filter(item => item.roles.includes(profile.role));

  return (
    <div className="portal-aura-container">
      {/* AURORA BLOBS — Atmospheric Glowing Effect */}
      <div className="portal-aurora-bg" aria-hidden="true">
        <div className="aurora-blob aurora-blob-1"></div>
        <div className="aurora-blob aurora-blob-2"></div>
      </div>

      {/* TIER 1: BRAND & PRIMARY ACTIONS */}
      <header className="portal-header-top">
        <div className="portal-header-inner-wrap" style={{ maxWidth: 1600 }}>
          <div className="portal-brand-lockup">
            <span className="brand-main">Adveris</span>
            <span className="brand-subline">ADVISORS LLP</span>
          </div>


          <div className="portal-header-actions-right">
            <span className="menu-trigger-text" onClick={handleLogout} style={{ opacity: 0.3, fontSize: '0.6rem' }}>LOGOUT</span>
            <span className="menu-trigger-text" style={{ fontSize: '0.6rem', letterSpacing: '0.4em' }}>MENU</span>

            <button className="btn-portal-plus-circle" style={{ width: 40, height: 40 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* TIER 2: INSTITUTIONAL TABS */}
      <nav className="portal-nav-row" style={{ marginBottom: 0 }}>
        <div className="container" style={{ maxWidth: 1600 }}>
          <div className="portal-tab-group" style={{ marginBottom: 0, padding: '0 40px' }}>
            {subNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/dashboard/overview'}
                className={({ isActive }) =>
                  `portal-tab-item ${isActive ? 'active' : ''}`
                }
              >
                {item.icon}
                {item.name}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      <main className="portal-main-stage">
        <div className="container" style={{ maxWidth: 1600 }}>
          {children}
        </div>
      </main>

      {/* PORTAL FOOTER — INSTITUTIONAL SIGNATURE */}
      <footer style={{ marginTop: 'auto', paddingBottom: 60, position: 'relative', zIndex: 10 }}>
        <div style={{ width: '100%', maxWidth: 1600, margin: '0 auto', padding: '0 40px' }}>

          <div style={{ padding: '60px 0', borderTop: '1px solid rgba(255,255,255,0.03)', display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.2fr 1.2fr', gap: 60 }}>

            {/* Brand Context */}
            <div>
              <div className="portal-brand-lockup" style={{ marginBottom: 20 }}>
                <span className="brand-main">Adveris</span>
                <span className="brand-subline" style={{ fontSize: '0.5rem' }}>ADVISORS LLP</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.25)', lineHeight: 2.2, maxWidth: 360, fontWeight: 200 }}>
                Institutional advisory for the Indian market. Specializing in strategic compliance, regulatory governance, and corporate excellence.
              </p>
            </div>

            {/* Hub Links */}
            <div>
              <h4 className="firm-intel-tag" style={{ marginBottom: 24, opacity: 0.4 }}>Resources</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <a href="#" className="portal-nav-pill-v2" style={{ padding: 0, textTransform: 'uppercase' }}>Service Hub</a>
                <a href="#" className="portal-nav-pill-v2" style={{ padding: 0, textTransform: 'uppercase' }}>Knowledge Portal</a>
                <a href="#" className="portal-nav-pill-v2" style={{ padding: 0, textTransform: 'uppercase' }}>Audit Trail</a>
              </div>
            </div>

            <div>
              <h4 className="firm-intel-tag" style={{ marginBottom: 24, opacity: 0.4 }}>Governance</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <a href="#" className="portal-nav-pill-v2" style={{ padding: 0, textTransform: 'uppercase' }}>Privacy Protocol</a>
                <a href="#" className="portal-nav-pill-v2" style={{ padding: 0, textTransform: 'uppercase' }}>Data Sovereignity</a>
                <a href="#" className="portal-nav-pill-v2" style={{ padding: 0, textTransform: 'uppercase' }}>Terms of Mandate</a>
              </div>
            </div>

            <div>
              <h4 className="firm-intel-tag" style={{ marginBottom: 24, opacity: 0.4 }}>Coordinates</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <a href="mailto:contact@adveris.in" className="portal-nav-pill-v2" style={{ padding: 0, textTransform: 'uppercase' }}>Bengaluru HQ</a>
                <a href="#" className="portal-nav-pill-v2" style={{ padding: 0, textTransform: 'uppercase' }}>LinkedIn</a>
              </div>
            </div>

          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 40, borderTop: '0.5px solid rgba(255,255,255,0.02)' }}>
            <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.1)', letterSpacing: '0.2em', fontWeight: 600 }}>© 2026 Adveris Advisors LLP. DEPLOYED FOR INSTITUTIONAL USE.</span>
            <div style={{ display: 'flex', gap: 60 }}>
              <span style={{ fontSize: '0.62rem', color: 'var(--gold)', opacity: 0.15, letterSpacing: '0.3em', fontWeight: 800 }}>BENGALURU</span>
              <span style={{ fontSize: '0.62rem', color: 'var(--gold)', opacity: 0.15, letterSpacing: '0.3em', fontWeight: 800 }}>MUMBAI</span>
              <span style={{ fontSize: '0.62rem', color: 'var(--gold)', opacity: 0.15, letterSpacing: '0.3em', fontWeight: 800 }}>DELHI</span>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
};

export default PortalLayout;
