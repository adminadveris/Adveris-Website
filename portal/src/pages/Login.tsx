import { useState } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import type { Profile, Client } from '../types';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim(); // Trim password just in case of copy-paste spaces

    console.log("LOGIN_DEBUG:", { cleanEmail, cleanPass });

    // 1. Static Mock Auth (Admin/Staff)
    // We'll make this EXTREMELY simple: 
    // Email: csashikgswamy@gmail.com -> Pass: csashikgswamy123
    // Email: staff@adverisadvisors.com -> Pass: staff123

    if (cleanEmail === 'cs@cs.com') {
      if (cleanPass === 'cs123') {
        const adminProfile = { id: 'mock-admin', email: 'csashikgswamy@gmail.com', role: 'admin' as const, full_name: 'Adveris Admin' };
        localStorage.setItem('adveris_mock_session', JSON.stringify(adminProfile));
        window.location.href = '/portal/dashboard';
        return;
      }
    }

    if (cleanEmail === 'staff@adverisadvisors.com') {
      if (cleanPass === 'staff123') {
        const staffProfile = { id: 'mock-staff', email: 'staff@adverisadvisors.com', role: 'employee' as const, full_name: 'Firm Professional' };
        localStorage.setItem('adveris_mock_session', JSON.stringify(staffProfile));
        window.location.href = '/portal/dashboard';
        return;
      }
    }

    // 2. Client Auth lookup
    const clientsStr = localStorage.getItem('adveris_clients');
    if (clientsStr) {
      const clients: Client[] = JSON.parse(clientsStr);
      const foundClient = clients.find((c: Client) => c.email_1.toLowerCase() === cleanEmail);
      if (foundClient && cleanPass === 'pass123') {
        const sessionUser = {
          id: foundClient.id,
          email: foundClient.email_1,
          role: 'client' as const,
          full_name: foundClient.client_name,
          account_id: foundClient.account_id
        };
        localStorage.setItem('adveris_mock_session', JSON.stringify(sessionUser));
        window.location.href = '/portal/dashboard';
        return;
      }
    }

    // Fallback to error if no mock match
    setError('Invalid credentials. Please use csashikgswamy@gmail.com / csashikgswamy123');
    setLoading(false);
  };

  return (
    <div className="login-stage" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="portal-aurora-bg">
        <div className="aurora-blob aurora-blob-1" style={{ opacity: 0.15 }}></div>
        <div className="aurora-blob aurora-blob-2" style={{ opacity: 0.1 }}></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        className="portal-panel"
        style={{ width: '100%', maxWidth: 540, padding: '100px 72px', textAlign: 'center' }}
      >
        <div className="portal-brand-lockup" style={{ marginBottom: 60, alignItems: 'center' }}>
          <span className="brand-main" style={{ fontSize: '3.5rem' }}>Adveris</span>
          <span className="brand-subline" style={{ fontSize: '0.65rem', letterSpacing: '0.5em' }}>ADVISORS PORTAL</span>
        </div>

        <div className="firm-intel-tag" style={{ justifyContent: 'center', marginBottom: 48, opacity: 0.4 }}>ACCOUNT ACCESS</div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
          <div style={{ textAlign: 'left' }}>
            <label className="portal-form-label">Professional Email</label>
            <input
              type="email"
              className="portal-form-control"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="off"
            />
          </div>

          <div style={{ textAlign: 'left' }}>
            <label className="portal-form-label">Access Identity Key</label>
            <input
              type="password"
              className="portal-form-control"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                style={{ color: 'var(--saffron)', fontSize: '0.7rem', fontWeight: 300, textAlign: 'left' }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            className="btn-portal-primary"
            disabled={loading}
            style={{ marginTop: 20, width: '100%' }}
          >
            {loading ? 'AUTHENTICATING...' : 'SECURE ADVISORS PORTAL ENTRY'}
          </button>
        </form>

        <div style={{ marginTop: 80, paddingTop: 40, borderTop: '1px solid rgba(255,255,255,0.02)' }}>
          <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.15)', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Strategic Compliance · Pan India · Global Governance
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
