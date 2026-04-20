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
    { name: 'Overview', path: '/dashboard/overview', roles: ['admin', 'employee'] },
    { name: 'New Request', path: '/dashboard/new-request', roles: ['client', 'admin'] },
    { name: 'My Mandates', path: '/dashboard/records', roles: ['client'] },
    { name: 'Firm Mandates', path: '/dashboard/records', roles: ['admin', 'employee'] },
    { name: 'Timesheets', path: '/dashboard/timesheets', roles: ['admin', 'employee'] },
    { name: 'Expenses', path: '/dashboard/expenses', roles: ['admin', 'employee'] },
    { name: 'Accounts & Clients', path: '/dashboard/crm', roles: ['admin', 'employee'] },
  ].filter(item => item.roles.includes(profile.role));

  return (
    <>
      {/* BACKGROUND BLOBS */}
      <div className="page-bg" aria-hidden="true">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
        <div className="blob blob-4"></div>
      </div>

      {/* TOP NAVIGATION (Mirrors index.html) */}
      <nav className="nav" id="mainNav" role="navigation">
        <div className="nav__inner" style={{ paddingRight: 40 }}>
          <a href="/" className="nav__logo" style={{ textDecoration: 'none' }}>
            <span className="logo-name">Adveris</span>
            <span className="logo-tagline">Advisors LLP</span>
          </a>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: 24 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--saffron)', display: 'inline-block' }}></span>
              {profile.role}
            </div>
            <button onClick={handleLogout} style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'white', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'color 0.2s ease' }} onMouseOver={e => e.currentTarget.style.color = 'var(--saffron)'} onMouseOut={e => e.currentTarget.style.color = 'white'}>
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main style={{ position: 'relative', zIndex: 1, paddingTop: 100, minHeight: '80vh', paddingBottom: 80 }}>
        {/* SUB-NAVIGATION HEADER */}
        <div className="container" style={{ marginBottom: 40, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 20 }}>
          <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 10 }}>
            {subNavItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/dashboard'}
                style={({ isActive }) => ({
                  fontSize: '0.75rem',
                  fontWeight: isActive ? 700 : 500,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: isActive ? 'var(--navy)' : 'rgba(255,255,255,0.5)',
                  backgroundColor: isActive ? 'var(--saffron)' : 'transparent',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-pill)',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap'
                })}
              >
                {item.name}
              </NavLink>
            ))}
            {/* Admin only sub-nav */}
            {profile.role === 'admin' && (
              <>
                <NavLink to="/dashboard/service-hub" style={({ isActive }) => ({ fontSize: '0.75rem', fontWeight: isActive ? 700 : 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: isActive ? 'var(--navy)' : 'rgba(255,255,255,0.5)', backgroundColor: isActive ? 'var(--saffron)' : 'transparent', padding: '8px 16px', borderRadius: 'var(--radius-pill)', textDecoration: 'none', transition: 'all 0.3s ease' })}>
                  Action Logs
                </NavLink>
              </>
            )}
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div className="container">
          {children}
        </div>
      </main>

      {/* FOOTER (Mirrors index.html) */}
      <footer style={{ marginTop: 'auto' }}>
        <div className="footer-saffron-bar"></div>
        <div className="container" style={{ paddingTop: 72 }}>
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="nav__logo" style={{ marginBottom: 16 }}>
                <span className="logo-name" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'white' }}>Adveris</span>
                <span className="logo-tagline" style={{ color: 'rgba(255,255,255,0.45)' }}>Advisors LLP</span>
              </div>
              <p>Your Trusted Advisory Partner in India. Expert legal, compliance and company secretary services delivered with integrity.</p>
            </div>
            <div className="footer-col">
              <h4>Support</h4>
              <a href="mailto:csashikgswamy@gmail.com">Help Desk</a>
              <a href="#">Knowledge Base</a>
            </div>
            <div className="footer-col">
              <h4>Firm</h4>
              <a href="/about.html">About Us</a>
              <a href="/team.html">Our Team</a>
              <a href="/contact.html">Contact</a>
            </div>
            <div className="footer-col">
              <h4>Contact</h4>
              <a href="tel:+919739382704">+91 97393 82704</a>
              <a href="mailto:csashikgswamy@gmail.com">csashikgswamy@gmail.com</a>
              <a href="https://www.google.com/maps/search/?api=1&query=Om+Chambers+648/A,+4th+Flr+Binnamangala+1st+stg+Indiranagar+Bengaluru+560038" target="_blank" rel="noopener noreferrer">Om Chambers 648/A, Indiranagar</a>
              <a href="https://www.google.com/maps/search/?api=1&query=Om+Chambers+648/A,+4th+Flr+Binnamangala+1st+stg+Indiranagar+Bengaluru+560038" target="_blank" rel="noopener noreferrer">Bengaluru — 560038</a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 Adveris Advisors LLP. All rights reserved.</span>
            <span>Bengaluru, Karnataka, India</span>
          </div>
        </div>
      </footer>
    </>
  );
};

export default PortalLayout;
