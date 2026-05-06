import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const UserProfile = () => {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<User>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setEditData({ ...user });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const updates = {
        ...editData,
        full_name: `${editData.first_name || ''} ${editData.last_name || ''}`.trim()
      };
      await api.updateProfile(user.id, updates);
      await refreshUser();
      setIsEditing(false);
      setSuccess("Profile Updated Successfully.");
      setTimeout(() => setSuccess(null), 5000);
    } catch (e: any) {
      console.error(e);
      setError(`Failed To Save: ${e?.message || 'Check Network Connection'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="theater-container" style={{ minHeight: '80vh', padding: '60px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 60 }}>
          <div>
            <h1 className="serif-title" style={{ fontSize: '3.5rem', marginBottom: 12, fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Personal Identity</h1>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>Manage Your Portal Credentials</p>
          </div>
          
          <div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={async () => {
                  try {
                    await api.createNotification({
                      user_id: user.id,
                      title: 'System Diagnostic',
                      message: 'This is a test notification to verify your database connection.',
                      type: 'system',
                      sender_name: 'Adveris Support'
                    });
                    setSuccess("Test Notification Sent! Check The Bell Icon.");
                    setTimeout(() => setSuccess(null), 5000);
                  } catch (e) {
                    setError("Failed To Send Test Notification. Check Sql Console.");
                  }
                }}
                className="btn-portal-outline"
                style={{ padding: '16px 24px', opacity: 0.6 }}
              >
                Test Notification
              </button>
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="btn-portal-primary"
                  style={{ padding: '16px 40px' }}
                >
                  Edit Profile
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 12 }}>
                  <button 
                    onClick={() => setIsEditing(false)} 
                    className="btn-portal-outline"
                    style={{ padding: '16px 32px' }}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave} 
                    disabled={loading}
                    className="btn-portal-primary"
                    style={{ padding: '16px 40px' }}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ padding: '20px 24px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, color: '#f87171', marginBottom: 40, fontSize: '0.9rem', fontWeight: 600 }}
            >
              ⚠ {error}
            </motion.div>
          )}
          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ padding: '20px 24px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, color: '#4ade80', marginBottom: 40, fontSize: '0.9rem', fontWeight: 600 }}
            >
              ✓ {success}
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px 80px', padding: '60px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 24 }}>
          
          <div>
            <label className="portal-form-label">First Name</label>
            {isEditing ? (
              <input 
                className="portal-form-control"
                value={editData.first_name || ''}
                onChange={e => setEditData({ ...editData, first_name: e.target.value })}
                style={{ height: 48 }}
              />
            ) : (
              <p style={{ fontSize: '1rem', color: 'white', fontWeight: 400 }}>{user.first_name || '—'}</p>
            )}
          </div>

          <div>
            <label className="portal-form-label">Last Name</label>
            {isEditing ? (
              <input 
                className="portal-form-control"
                value={editData.last_name || ''}
                onChange={e => setEditData({ ...editData, last_name: e.target.value })}
                style={{ height: 48 }}
              />
            ) : (
              <p style={{ fontSize: '1rem', color: 'white', fontWeight: 400 }}>{user.last_name || '—'}</p>
            )}
          </div>

          <div>
            <label className="portal-form-label">Gender / Sex</label>
            {isEditing ? (
              <select 
                className="portal-form-control"
                value={editData.sex || ''}
                onChange={e => setEditData({ ...editData, sex: e.target.value as any })}
                style={{ height: 48 }}
              >
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            ) : (
              <p style={{ fontSize: '1rem', color: 'white', fontWeight: 400 }}>{user.sex || '—'}</p>
            )}
          </div>

          <div>
            <label className="portal-form-label">Date Of Birth</label>
            {isEditing ? (
              <input 
                type="date"
                className="portal-form-control"
                value={editData.dob || ''}
                onChange={e => setEditData({ ...editData, dob: e.target.value })}
                style={{ height: 48 }}
              />
            ) : (
              <p style={{ fontSize: '1rem', color: 'white', fontWeight: 400 }}>{user.dob || '—'}</p>
            )}
          </div>

          <div>
            <label className="portal-form-label">Phone Number</label>
            {isEditing ? (
              <input 
                type="tel"
                className="portal-form-control font-mono"
                value={editData.phone || ''}
                onChange={e => setEditData({ ...editData, phone: e.target.value })}
                style={{ height: 48 }}
              />
            ) : (
              <p style={{ fontSize: '1rem', color: 'white', fontWeight: 400, fontFamily: 'monospace' }}>{user.phone || '—'}</p>
            )}
          </div>

          <div>
            <label className="portal-form-label">Email Address</label>
            <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>{user.email}</p>
          </div>

          <div>
            <label className="portal-form-label">Assigned Portal Role</label>
            <p style={{ fontSize: '1rem', color: 'var(--gold)', fontWeight: 500 }}>{user.role === 'admin' ? 'Administrator' : user.role === 'employee' ? 'Firm Staff' : 'External Client'}</p>
          </div>

          <div>
            <label className="portal-form-label">Member Since</label>
            <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>{new Date(user.created_at).toLocaleDateString()}</p>
          </div>

          {user.role !== 'client' && (
            <div style={{ gridColumn: 'span 2', marginTop: 20 }}>
              <label className="portal-form-label">Authorized Firm Services</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
                {(user.expertise_tags || []).map(tag => (
                  <span key={tag} style={{ padding: '8px 16px', borderRadius: 6, background: 'rgba(255,153,51,0.05)', border: '1px solid rgba(255,153,51,0.1)', color: 'var(--saffron)', fontSize: '0.75rem', fontWeight: 500 }}>{tag}</span>
                ))}
                {(user.expertise_tags || []).length === 0 && <p style={{ opacity: 0.2, fontSize: '0.85rem' }}>No Tags Assigned.</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
