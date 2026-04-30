import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import type { User, Client } from '../types';

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
    const cleanPass = password.trim();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass,
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        window.location.href = '/portal/dashboard';
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-stage" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflow: 'hidden' }}>
      <div className="portal-aurora-bg">
        <div className="aurora-blob aurora-blob-1" style={{ opacity: 0.15 }}></div>
        <div className="aurora-blob aurora-blob-2" style={{ opacity: 0.1 }}></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        className="portal-panel"
        style={{ 
          width: '100%', 
          maxWidth: 500, 
          padding: 'clamp(40px, 8vh, 60px) clamp(30px, 5vw, 60px)', 
          textAlign: 'center',
          maxHeight: '95vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        <div className="portal-brand-lockup" style={{ marginBottom: 'clamp(30px, 6vh, 48px)', alignItems: 'center' }}>
          <span className="brand-main" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>Adveris</span>
          <span className="brand-subline" style={{ fontSize: '0.6rem', letterSpacing: '0.4em' }}>ADVISORS PORTAL</span>
        </div>

        <div className="firm-intel-tag" style={{ justifyContent: 'center', marginBottom: 'clamp(24px, 5vh, 40px)', opacity: 0.4 }}>ACCOUNT ACCESS</div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(20px, 4vh, 32px)' }}>
          <div style={{ textAlign: 'left' }}>
            <label className="portal-form-label">Email</label>
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
            <label className="portal-form-label">Password</label>
            <input
              type="password"
              className="portal-form-control"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <div style={{ textAlign: 'right', marginTop: 8 }}>
              <Link to="/forgot-password" style={{ fontSize: '0.65rem', color: 'var(--gold)', textDecoration: 'none', opacity: 0.7 }}>
                Forgot Password?
              </Link>
            </div>
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
            style={{ marginTop: 8, width: '100%' }}
          >
            {loading ? 'AUTHENTICATING...' : 'SECURE ENTRY'}
          </button>

          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: '0.75rem', opacity: 0.4 }}>
              New to Adveris? <Link to="/signup" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Request Access</Link>
            </p>
          </div>
        </form>

        <div style={{ marginTop: 'clamp(30px, 6vh, 60px)', paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.02)' }}>
          <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.15)', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Strategic Compliance · Pan India
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
