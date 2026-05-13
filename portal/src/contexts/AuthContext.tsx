import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
  signOut: async () => {}
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      if (!session) {
        setUser(null);
        return;
      }

      const { data: userProfile, error: profileError } = await supabase
        .from('User')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "no rows found"
        throw profileError;
      }

      if (!userProfile) {
        // Create a minimal user object if profile doesn't exist yet
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || 'New User',
          role: session.user.user_metadata?.role || 'client',
          status: 'pending',
          created_at: new Date().toISOString()
        } as User);
      } else {
        setUser(userProfile as User);
      }
    } catch (error) {
      console.error("Failed to load user", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        fetchUser();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // --- IMPROVED INACTIVITY GOVERNANCE ---
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (!user) {
      setShowWarning(false);
      return;
    }

    const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes
    const WARNING_THRESHOLD = 28 * 60 * 1000; // 28 minutes
    const STORAGE_KEY = 'adveris_portal_last_active';
    let lastResetTime = Date.now();

    const resetTimer = (force = false) => {
      const now = Date.now();
      // Throttle storage writes to every 30 seconds unless forced
      if (force || now - lastResetTime > 30000) {
        localStorage.setItem(STORAGE_KEY, now.toString());
        lastResetTime = now;
        if (showWarning) setShowWarning(false);
      }
    };

    // Cross-tab synchronization: If another tab resets the timer, this tab follows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        lastResetTime = parseInt(e.newValue || '0');
        setShowWarning(false);
      }
    };

    // Events to track activity
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(e => window.addEventListener(e, () => resetTimer()));
    window.addEventListener('storage', handleStorageChange);

    // Initialize timer
    resetTimer(true);

    // Check interval
    const interval = setInterval(() => {
      const lastActive = parseInt(localStorage.getItem(STORAGE_KEY) || '0');
      const now = Date.now();
      const diff = now - lastActive;

      if (diff > INACTIVITY_LIMIT) {
        clearInterval(interval);
        signOut();
      } else if (diff > WARNING_THRESHOLD) {
        setShowWarning(true);
      } else {
        if (showWarning) setShowWarning(false);
      }
    }, 10000); // Check every 10 seconds

    return () => {
      activityEvents.forEach(e => window.removeEventListener(e, () => resetTimer()));
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [user, showWarning]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setShowWarning(false);
    localStorage.removeItem('adveris_portal_last_active');
  };

  const stayLoggedIn = () => {
    const STORAGE_KEY = 'adveris_portal_last_active';
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    setShowWarning(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser: fetchUser, signOut }}>
      {children}
      
      {/* SESSION EXPIRY WARNING MODAL */}
      {showWarning && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          fontFamily: 'var(--font-ui)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '48px',
            borderRadius: '24px',
            maxWidth: '480px',
            textAlign: 'center',
            boxShadow: '0 24px 48px rgba(0,0,0,0.5)'
          }}>
            <div style={{
              width: '64px', height: '64px',
              background: 'rgba(255,153,51,0.1)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ff9933" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <h2 style={{ color: 'white', marginBottom: 12, fontSize: '1.5rem', fontWeight: 600 }}>Session Expiring</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, lineHeight: 1.6 }}>
              Your secure session is about to expire due to inactivity. Would you like to stay logged in?
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={() => signOut()}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'transparent',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Sign Out
              </button>
              <button 
                onClick={stayLoggedIn}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'var(--gold)',
                  color: 'black',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                Stay Logged In
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
