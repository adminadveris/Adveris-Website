import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/portal/reset-password`,
      });

      if (resetError) throw resetError;
      setSuccess(true);
    } catch (err: any) {
      console.error("Reset failed:", err);
      setError(err.message || 'Recovery Request Failed. Please Try Again.');
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
          <span className="brand-subline" style={{ fontSize: '0.6rem', letterSpacing: '0.4em' }}>Advisors Portal</span>
        </div>

        <div className="firm-intel-tag" style={{ justifyContent: 'center', marginBottom: 'clamp(24px, 5vh, 40px)', opacity: 0.4 }}>Credential Recovery</div>

        {success ? (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center' }}
          >
            <p style={{ opacity: 0.7, lineHeight: 1.8, marginBottom: 32 }}>
              If An Account Exists For <strong>{email}</strong>, A Secure Recovery Link Has Been Dispatched To Your Inbox.
            </p>
            <Link to="/" className="btn-portal-primary" style={{ display: 'inline-block', width: 'auto', padding: '12px 40px' }}>Return To Login</Link>
          </motion.div>
        ) : (
          <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(20px, 4vh, 32px)' }}>
            <div style={{ textAlign: 'left' }}>
              <label className="portal-form-label">Email</label>
              <input
                type="email"
                className="portal-form-control"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="Enter Your Email Address"
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
              style={{ marginTop: 8, width: '100%' }}
            >
              {loading ? 'Processing...' : 'Send Recovery Link'}
            </button>
            
            <div style={{ marginTop: 20 }}>
              <Link to="/" style={{ fontSize: '0.75rem', opacity: 0.4, color: 'white', textDecoration: 'none' }}>
                ← Back To Login
              </Link>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
