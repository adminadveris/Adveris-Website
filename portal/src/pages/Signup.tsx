import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();
    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();
    const cleanName = `${cleanFirst} ${cleanLast}`.trim();

    if (cleanPass.length < 6) {
      setError('Password Must Be At Least 6 Characters.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPass,
        options: {
          data: {
            first_name: cleanFirst,
            last_name: cleanLast,
            full_name: cleanName,
            role: 'client' // Default role for new signups
          }
        }
      });

      if (signupError) throw signupError;

      if (data.user) {
        setSuccess(true);
        setTimeout(() => navigate('/'), 5000);
      }
    } catch (err: any) {
      console.error("Signup failed:", err);
      setError(err.message || 'Signup Failed. Please Try Again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="login-stage" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div className="portal-aurora-bg">
          <div className="aurora-blob aurora-blob-1" style={{ opacity: 0.15 }}></div>
          <div className="aurora-blob aurora-blob-2" style={{ opacity: 0.1 }}></div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="portal-panel"
          style={{ maxWidth: 540, padding: 80, textAlign: 'center' }}
        >
          <div className="firm-intel-tag" style={{ justifyContent: 'center', marginBottom: 32, color: 'var(--emerald)' }}>Registration Submitted</div>
          <h2 className="serif-title" style={{ fontSize: '2rem', marginBottom: 24, fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Account Initialized</h2>
          <p style={{ opacity: 0.6, lineHeight: 1.8, marginBottom: 40 }}>
            Your Request Has Been Submitted To The Adveris Governance Board.
            Access Will Be Granted Once Your Identity Is Verified By Our Administrative Team.
          </p>
          <Link to="/" className="btn-portal-primary" style={{ display: 'inline-block', width: 'auto', padding: '12px 40px' }}>Return To Login</Link>
        </motion.div>
      </div>
    );
  }

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
          padding: 'clamp(30px, 6vh, 40px) clamp(30px, 5vw, 60px)',
          textAlign: 'center',
          maxHeight: '95vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        <div className="portal-brand-lockup" style={{ marginBottom: 'clamp(20px, 4vh, 32px)', alignItems: 'center' }}>
          <span className="brand-main" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>Adveris</span>
          <span className="brand-subline" style={{ fontSize: '0.6rem', letterSpacing: '0.4em' }}>Advisors Portal</span>
        </div>

        <div className="firm-intel-tag" style={{ justifyContent: 'center', marginBottom: 'clamp(20px, 4vh, 32px)', opacity: 0.4 }}>Client Onboarding</div>

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 3vh, 24px)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ textAlign: 'left' }}>
              <label className="portal-form-label">First Name</label>
              <input
                type="text"
                className="portal-form-control"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                required
                placeholder="e.g. John"
              />
            </div>
            <div style={{ textAlign: 'left' }}>
              <label className="portal-form-label">Last Name</label>
              <input
                type="text"
                className="portal-form-control"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                required
                placeholder="e.g. Doe"
              />
            </div>
          </div>

          <div style={{ textAlign: 'left' }}>
            <label className="portal-form-label">Email</label>
            <input
              type="email"
              className="portal-form-control"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ textAlign: 'left' }}>
            <label className="portal-form-label">Set Password</label>
            <input
              type="password"
              className="portal-form-control"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Minimum 6 Characters"
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
            {loading ? 'Initializing...' : 'Request Access'}
          </button>
        </form>

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.02)' }}>
          <p style={{ fontSize: '0.75rem', opacity: 0.4 }}>
            Already Have An Account? <Link to="/" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Secure Login</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
