import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    const mockUsers: any = {
      'admin@adveris.in': { id: 'mock-admin', email: 'admin@adveris.in', role: 'admin' },
      'client@adveris.in': { id: 'mock-client', email: 'client@adveris.in', role: 'client' },
      'staff@adveris.in': { id: 'mock-staff', email: 'staff@adveris.in', role: 'employee' }
    };

    if (mockUsers[email] && password === (email.split('@')[0] + '123')) {
      localStorage.setItem('adveris_mock_session', JSON.stringify(mockUsers[email]));
      window.location.href = '/dashboard';
      return;
    }

    if (error) setMessage(error.message);
    setLoading(false);
  };

  return (
    <div className="portal-login-root">
      <div className="portal-login-inner">

        {/* Left: Brand Hero */}
        <div className="portal-login-hero">
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 18px', borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--saffron-border)',
            background: 'var(--saffron-pale)',
            fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: 'var(--saffron)',
            marginBottom: '36px'
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--saffron)', animation: 'pulseDot 2s ease-in-out infinite' }} />
            Secure Access
          </div>

          <h1>
            Adveris<br />
            <em>Intelligence</em><br />
            <strong>Portal.</strong>
          </h1>

          <p style={{ marginTop: 24 }}>
            The firm's unified operational workspace for strategic compliance, case management, and professional excellence — Pan India.
          </p>

          <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {['Enterprise-grade data security', 'Role-based access control', 'Local-first mock environment'].map(feat => (
              <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 20, height: 1.5, background: 'var(--saffron)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Login Card */}
        <div className="portal-login-card">
          <div className="portal-login-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>

          <h2>Sign In</h2>
          <p style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--saffron)', marginBottom: 36 }}>
            Adveris Advisors Internal Login
          </p>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
                Corporate Email
              </label>
              <div className="portal-input-wrap">
                <span className="portal-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </span>
                <input
                  type="email" required
                  className="portal-input"
                  placeholder="name@adverisadvisors.in"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 8, marginTop: 16 }}>
                Security Key
              </label>
              <div className="portal-input-wrap">
                <span className="portal-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input
                  type="password" required
                  className="portal-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            {message && <div className="portal-error-msg">{message}</div>}

            <button type="submit" disabled={loading} className="btn-portal-primary">
              {loading ? 'Authenticating...' : 'Access Portal'}
              {!loading && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              )}
            </button>
          </form>

          <div style={{ marginTop: 36, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Strategic Compliance · Pan India · Est. 2024
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
