import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const { isPasswordRecovery } = useAuth();

  useEffect(() => {
    // The PASSWORD_RECOVERY event fires via onAuthStateChange in AuthContext.
    // We also check the URL hash for the recovery token as a fallback
    // (Supabase appends #access_token=...&type=recovery to the redirect URL).
    const hash = window.location.hash;
    if (isPasswordRecovery || hash.includes('type=recovery')) {
      setReady(true);
    } else {
      // Give Supabase a moment to process the token from the URL
      const timeout = setTimeout(() => {
        if (!isPasswordRecovery) {
          // No recovery session detected — user navigated here directly
          setReady(true); // Still show the form, but it will fail gracefully if no session
        }
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [isPasswordRecovery]);

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password Must Be At Least 8 Characters Long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords Do Not Match. Please Re-Enter.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;
      
      // Sign the user out to clear the recovery session and force them to use the new password
      await supabase.auth.signOut();
      
      setSuccess(true);

      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 4000);
    } catch (err: any) {
      console.error("Password update failed:", err);
      if (err.message?.includes('same_password')) {
        setError('New Password Must Be Different From Your Current Password.');
      } else if (err.message?.includes('session')) {
        setError('Recovery Session Has Expired. Please Request A New Password Reset Link.');
      } else {
        setError(err.message || 'Password Update Failed. Please Try Again.');
      }
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

        <div className="firm-intel-tag" style={{ justifyContent: 'center', marginBottom: 'clamp(24px, 5vh, 40px)', opacity: 0.4 }}>Set New Password</div>

        {success ? (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center' }}
          >
            <div style={{
              width: '64px', height: '64px',
              background: 'rgba(34,197,94,0.1)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <h3 style={{ color: '#4ade80', fontWeight: 600, marginBottom: 12, fontSize: '1.2rem' }}>Password Updated Successfully</h3>
            <p style={{ opacity: 0.7, lineHeight: 1.8, marginBottom: 32 }}>
              Your Credentials Have Been Securely Updated. Redirecting To Login...
            </p>
            <Link to="/" className="btn-portal-primary" style={{ display: 'inline-block', width: 'auto', padding: '12px 40px' }}>Return To Login</Link>
          </motion.div>
        ) : !ready ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '40px 0' }}
          >
            <div style={{ 
              fontFamily: 'var(--font-serif)', 
              fontSize: '1.1rem', 
              fontStyle: 'italic', 
              color: 'var(--saffron)',
              opacity: 0.6 
            }}>
              Verifying Recovery Session...
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(20px, 4vh, 28px)' }}>
            <div style={{ textAlign: 'left' }}>
              <label className="portal-form-label">New Password</label>
              <input
                type="password"
                className="portal-form-control"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Minimum 8 Characters"
                autoComplete="new-password"
              />
            </div>

            <div style={{ textAlign: 'left' }}>
              <label className="portal-form-label">Confirm Password</label>
              <input
                type="password"
                className="portal-form-control"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Re-Enter New Password"
                autoComplete="new-password"
              />
            </div>

            {/* Password strength indicator */}
            {password.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                style={{ textAlign: 'left' }}
              >
                <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                  {[1, 2, 3, 4].map(level => {
                    const strength = 
                      (password.length >= 8 ? 1 : 0) +
                      (/[A-Z]/.test(password) ? 1 : 0) +
                      (/[0-9]/.test(password) ? 1 : 0) +
                      (/[^A-Za-z0-9]/.test(password) ? 1 : 0);
                    const colors = ['#ef4444', '#f59e0b', '#eab308', '#22c55e'];
                    return (
                      <div key={level} style={{
                        flex: 1, height: 3, borderRadius: 2,
                        background: level <= strength ? colors[strength - 1] : 'rgba(255,255,255,0.05)',
                        transition: 'background 0.3s'
                      }} />
                    );
                  })}
                </div>
                <p style={{ fontSize: '0.65rem', opacity: 0.3, fontWeight: 500 }}>
                  Use Uppercase, Numbers & Special Characters For Maximum Security
                </p>
              </motion.div>
            )}

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ color: 'var(--saffron)', fontSize: '0.7rem', fontWeight: 300, textAlign: 'left' }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Match indicator */}
            {confirmPassword.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ 
                  textAlign: 'left', 
                  fontSize: '0.7rem', 
                  fontWeight: 500,
                  color: password === confirmPassword ? '#4ade80' : '#f87171'
                }}
              >
                {password === confirmPassword ? '✓ Passwords Match' : '✗ Passwords Do Not Match'}
              </motion.div>
            )}

            <button
              type="submit"
              className="btn-portal-primary"
              disabled={loading || password.length < 8 || password !== confirmPassword}
              style={{ marginTop: 8, width: '100%' }}
            >
              {loading ? 'Updating Credentials...' : 'Update Password'}
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

export default ResetPassword;
