import React from 'react';
import { NavLink } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import type { Profile } from '../types';

const PortalLayout = ({ children, profile }: { children: React.ReactNode, profile: Profile }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    localStorage.removeItem('adveris_mock_session');
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const switchRole = (role: string) => {
    // For testing/mock purposes, we associate IDs that match our seeded records
    const NEXUS_ALPHA_ID = 'seed-acc-1'; // We'll update seedData to use these fixed IDs

    const mockUsers: Record<string, Profile> = {
      admin: { id: 'mock-admin', role: 'admin', full_name: 'Adveris Admin' },
      employee: { id: 'mock-staff', role: 'employee', full_name: 'Firm Professional' },
      client: { id: 'mock-client', role: 'client', full_name: 'Nexus Client', account_id: NEXUS_ALPHA_ID }
    };
    localStorage.setItem('adveris_mock_session', JSON.stringify(mockUsers[role]));
    window.location.reload();
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
      name: 'All Requests',
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
      name: 'All History',
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
            <span className="brand-subline">ADVISORS PORTAL</span>
          </div>


          {/* MOBILE MENU TOGGLE (Header Level) */}
          <div className="portal-mobile-menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </div>
        </div>
      </header>

      {/* TIER 2: ACCOUNT TABS */}
      <nav className="portal-nav-row" style={{ marginBottom: 0 }}>
        <div className="container" style={{ maxWidth: 1600, width: '100%' }}>
          <div className={`portal-tab-group ${isMenuOpen ? 'open' : ''}`} style={{ marginBottom: 0, padding: '0 40px' }}>
            
            {/* INJECT IDENTITY SWITCHER AT TOP OF MOBILE DROPDOWN */}
            <div className="portal-header-actions-right" style={{ gap: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingRight: 16, borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '0.6rem', opacity: 0.2, letterSpacing: '0.1em' }}>IDENTITY /</span>
                {['admin', 'employee', 'client'].map(r => (
                  <span
                    key={r}
                    onClick={() => switchRole(r)}
                    className={`menu-trigger-text ${profile.role === r ? 'active' : ''}`}
                    style={{
                      fontSize: '0.55rem',
                      cursor: 'pointer',
                      color: profile.role === r ? 'var(--gold)' : 'white',
                      opacity: profile.role === r ? 1 : 0.3,
                      fontWeight: profile.role === r ? 800 : 400
                    }}
                  >
                    {r.toUpperCase()}
                  </span>
                ))}
              </div>
              <span className="menu-trigger-text" onClick={handleLogout} style={{ opacity: 0.3, fontSize: '0.6rem', cursor: 'pointer' }}>LOGOUT</span>
            </div>

            {subNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
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

      {/* MINIMALIST FOOTER — ACCOUNT SIGNATURE */}
      <footer style={{ marginTop: 'auto', paddingBottom: 40, borderTop: '1px solid rgba(255,255,255,0.03)', position: 'relative', zIndex: 10 }}>
        <div style={{ width: '100%', maxWidth: 1600, margin: '0 auto', padding: '40px 40px 0' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
            <div>
              <div className="portal-brand-lockup" style={{ marginBottom: 8 }}>
                <span className="brand-main" style={{ fontSize: '1.2rem' }}>Adveris</span>
                <span className="brand-subline" style={{ fontSize: '0.45rem' }}>ADVISORS PORTAL</span>
              </div>
              <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)', fontWeight: 200, letterSpacing: '0.02em' }}>
                Professional advisory for the Indian market. Strategic compliance, regulatory governance, and corporate excellence.
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.1)', letterSpacing: '0.3em', fontWeight: 600, marginBottom: 8 }}>
                © 2026 Adveris Advisors Portal. DEPLOYED FOR ACCOUNT USE.
              </div>
              <div style={{ display: 'flex', gap: 24, justifyContent: 'flex-end', opacity: 0.15 }}>
                <span style={{ fontSize: '0.55rem', color: 'var(--gold)', letterSpacing: '0.3em', fontWeight: 800 }}>BENGALURU</span>
                <span style={{ fontSize: '0.55rem', color: 'var(--gold)', letterSpacing: '0.3em', fontWeight: 800 }}>MUMBAI</span>
                <span style={{ fontSize: '0.55rem', color: 'var(--gold)', letterSpacing: '0.3em', fontWeight: 800 }}>DELHI</span>
              </div>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
};

export default PortalLayout;
