import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import './portal.css';
import './animations.css';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { supabase } from './lib/supabaseClient';

// === ANIMATED BACKGROUND — same as website ===
const PageBackground = () => (
  <div className="portal-page-bg">
    <div style={{
      position: 'absolute', width: '700px', height: '700px',
      top: '-180px', left: '-180px', borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(255,153,51,0.18) 0%, transparent 70%)',
      filter: 'blur(90px)',
      animation: 'blobFloat 22s ease-in-out infinite'
    }} />
    <div style={{
      position: 'absolute', width: '500px', height: '500px',
      bottom: '-100px', right: '-100px', borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(255,153,51,0.12) 0%, transparent 70%)',
      filter: 'blur(90px)',
      animation: 'blobFloat 30s ease-in-out infinite reverse'
    }} />
    <div style={{
      position: 'absolute', width: '350px', height: '350px',
      top: '20%', right: '15%', borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(255,179,102,0.08) 0%, transparent 70%)',
      filter: 'blur(90px)',
      animation: 'blobFloat 26s ease-in-out infinite 3s'
    }} />
  </div>
);

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mockSession = localStorage.getItem('adveris_mock_session');
    if (mockSession) {
      setSession({ user: JSON.parse(mockSession) });
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--navy)' }}>
        <PageBackground />
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontStyle: 'italic', color: 'var(--saffron)' }}>
          Adveris...
        </div>
      </div>
    );
  }

  return (
    <Router>
      <PageBackground />
      <Routes>
        <Route path="/" element={!session ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard/*" element={session ? <Dashboard /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
