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

  // --- INACTIVITY TIMEOUT (30 MINS) ---
  useEffect(() => {
    if (!user) return;

    const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes
    const STORAGE_KEY = 'adveris_portal_last_active';

    const resetTimer = () => {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    };

    // Events to track activity
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(e => window.addEventListener(e, resetTimer));

    // Initialize timer
    resetTimer();

    // Check interval
    const interval = setInterval(() => {
      const lastActive = parseInt(localStorage.getItem(STORAGE_KEY) || '0');
      const now = Date.now();

      if (now - lastActive > INACTIVITY_LIMIT) {
        console.warn("Session expired due to inactivity.");
        signOut();
      }
    }, 10000); // Check every 10 seconds

    return () => {
      activityEvents.forEach(e => window.removeEventListener(e, resetTimer));
      clearInterval(interval);
    };
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('adveris_portal_last_active');
  };

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser: fetchUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
