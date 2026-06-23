import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './index.css';
import './portal.css';
import './animations.css';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import { useAuth } from './contexts/AuthContext';

// === ANIMATED BACKGROUND — same as website ===
const PageBackground = () => (
  <div className="portal-page-bg">
    <div style={{
      position: 'absolute', width: '700px', height: '700px',
      top: '-180px', left: '-180px', borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(255,153,51,0.75) 0%, transparent 70%)',
      filter: 'blur(90px)',
      animation: 'blobFloat 22s ease-in-out infinite'
    }} />
    <div style={{
      position: 'absolute', width: '500px', height: '500px',
      bottom: '-100px', right: '-100px', borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(255,153,51,0.45) 0%, transparent 70%)',
      filter: 'blur(90px)',
      animation: 'blobFloat 30s ease-in-out infinite reverse'
    }} />
    <div style={{
      position: 'absolute', width: '350px', height: '350px',
      top: '20%', right: '15%', borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(255,179,102,0.5) 0%, transparent 70%)',
      filter: 'blur(90px)',
      animation: 'blobFloat 26s ease-in-out infinite 3s'
    }} />
  </div>
);

const PendingApproval = () => {
  const { signOut } = useAuth() as any; // Cast as any if signOut is not in context yet

  return (
    <div className="login-stage" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <PageBackground />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="portal-panel"
        style={{ maxWidth: 600, padding: 80, textAlign: 'center' }}
      >
        <div className="firm-intel-tag" style={{ justifyContent: 'center', marginBottom: 32, color: 'var(--saffron)' }}>Governance Review Pending</div>
        <h2 className="serif-title" style={{ fontSize: '2.4rem', marginBottom: 24 }}>Identity Verification In Progress</h2>
        <p style={{ opacity: 0.6, lineHeight: 1.8, marginBottom: 48, fontSize: '1.1rem' }}>
          Your Adveris Portal credentials have been successfully registered.
          For security and compliance, our administrative team is currently reviewing your application.
          You will receive an email notification once your access is authorized.
        </p>
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = '/portal/';
          }}
          className="btn-portal-outline"
          style={{ padding: '14px 40px' }}
        >
          Log Out & Return
        </button>
      </motion.div>
    </div>
  );
};

function App() {
  const { user, loading, isPasswordRecovery } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--navy)' }}>
        <PageBackground />
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontStyle: 'italic', color: 'var(--saffron)' }}>
          Loading Adveris Advisors LLP Portal...
        </div>
      </div>
    );
  }

  // Handle Logic for Auth states
  const isAuthenticated = !!user;
  const isApproved = user?.status === 'approved';

  return (
    <Router basename="/portal">
      <PageBackground />
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={
          isPasswordRecovery ? <Navigate to="/reset-password" replace /> :
          !isAuthenticated ? <Login /> : (isApproved ? <Navigate to="/dashboard" /> : <Navigate to="/pending" />)
        } />
        <Route path="/signup" element={!isAuthenticated ? <Signup /> : <Navigate to="/dashboard" />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* PROTECTED ROUTES */}
        <Route path="/pending" element={isAuthenticated && !isApproved ? <PendingApproval /> : <Navigate to="/" />} />
        <Route path="/dashboard/*" element={isAuthenticated && isApproved ? <Dashboard /> : <Navigate to="/" />} />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
