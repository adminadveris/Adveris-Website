import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 1. Static Mock Auth (Admin/Staff)
    const mockUsers: any = {
      'csashikgswamy@gmail.com': { id: 'mock-admin', email: 'csashikgswamy@gmail.com', role: 'admin', full_name: 'Adveris Admin' },
      'staff@adverisadvisors.com': { id: 'mock-staff', email: 'staff@adverisadvisors.com', role: 'employee', full_name: 'Firm Professional' }
    };

    if (mockUsers[email]) {
      if (password === (email.split('@')[0] + '123')) {
        localStorage.setItem('adveris_mock_session', JSON.stringify(mockUsers[email]));
        window.location.href = '/dashboard';
        return;
      } else {
        setError('Invalid credentials for system account.');
        setLoading(false);
        return;
      }
    }

    // 2. Dynamic Registry Auth (30 Seeded Clients)
    const clientsStr = localStorage.getItem('adveris_clients');
    if (clientsStr) {
      const clients = JSON.parse(clientsStr);
      const foundClient = clients.find((c: any) => c.email_1.toLowerCase() === email.toLowerCase());
      
      if (foundClient) {
        if (password === 'pass123') {
          const sessionUser = {
            id: foundClient.id,
            email: foundClient.email_1,
            role: 'client',
            full_name: foundClient.client_name,
            account_id: foundClient.account_id
          };
          localStorage.setItem('adveris_mock_session', JSON.stringify(sessionUser));
          window.location.href = '/dashboard';
          return;
        } else {
          setError('Invalid key for client access.');
          setLoading(false);
          return;
        }
      }
    }

    // Fallback to Supabase (Production)
    const { error: sbError } = await supabase.auth.signInWithPassword({ email, password });
    if (sbError) setError(sbError.message);
    setLoading(false);
  };

  return (
    <div className="login-stage" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      {/* Dynamic Aura for Login */}
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
          <span className="brand-subline" style={{ fontSize: '0.65rem', letterSpacing: '0.5em' }}>ADVISORS LLP</span>
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
            {loading ? 'AUTHENTICATING...' : 'SECURE PORTAL ENTRY'}
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
