import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const ProfileField = ({
  label,
  children,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) => (
  <div className={`profile-field ${wide ? 'profile-field--wide' : ''}`}>
    <label className="portal-form-label">{label}</label>
    {children}
  </div>
);

const readValue = (value?: React.ReactNode, muted = false) => (
  <p className={`profile-read-value ${muted ? 'profile-read-value--muted' : ''}`}>{value || '-'}</p>
);

const UserProfile = () => {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<User>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) setEditData({ ...user });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const { role, status, email, created_at, id, ...rest } = editData;
      const updates = {
        ...rest,
        full_name: `${editData.first_name || ''} ${editData.last_name || ''}`.trim(),
      };
      await api.updateProfile(user.id, updates);

      // Password Update if provided
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }
        if (newPassword.length < 6) {
          throw new Error("Password must be at least 6 characters.");
        }
        await api.updatePassword(newPassword);
        setNewPassword('');
        setConfirmPassword('');
      }

      await refreshUser();
      setIsEditing(false);
      setSuccess('Profile updated successfully.');
      setTimeout(() => setSuccess(null), 3500);
    } catch (e: any) {
      console.error(e);
      setError(`Failed to save: ${e?.message || 'check network connection'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="profile-page">
      <div className="enterprise-toolbar profile-toolbar">
        <div>
          <div className="enterprise-eyebrow">Profile</div>
          <h1>Personal Identity</h1>
          <p>Manage your portal credentials and assigned access.</p>
        </div>

        <div className="enterprise-toolbar__actions">
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="btn-portal-primary">
              Edit Profile
            </button>
          ) : (
            <>
              <button onClick={() => setIsEditing(false)} className="btn-portal-outline">
                Cancel
              </button>
              <button onClick={handleSave} disabled={loading} className="btn-portal-primary">
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="profile-alert profile-alert--error"
          >
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="profile-alert profile-alert--success"
          >
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="portal-panel profile-card">
        <section className="profile-summary">
          <div className="profile-avatar">{(user.first_name || user.full_name || user.email || 'U').charAt(0).toUpperCase()}</div>
          <div>
            <h2>{user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Portal User'}</h2>
            <p>{user.email}</p>
          </div>
          <span className="enterprise-status enterprise-status--warning">
            {user.role === 'admin' ? 'Administrator' : user.role === 'employee' ? 'Firm Staff' : 'External Client'}
          </span>
        </section>

        <section className="profile-grid">
          <ProfileField label="First Name">
            {isEditing ? (
              <input
                className="portal-form-control"
                value={editData.first_name || ''}
                onChange={event => setEditData({ ...editData, first_name: event.target.value })}
              />
            ) : readValue(user.first_name)}
          </ProfileField>

          <ProfileField label="Last Name">
            {isEditing ? (
              <input
                className="portal-form-control"
                value={editData.last_name || ''}
                onChange={event => setEditData({ ...editData, last_name: event.target.value })}
              />
            ) : readValue(user.last_name)}
          </ProfileField>

          <ProfileField label="Gender / Sex">
            {isEditing ? (
              <select
                className="portal-form-control"
                value={editData.sex || ''}
                onChange={event => setEditData({ ...editData, sex: event.target.value as any })}
              >
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            ) : readValue(user.sex)}
          </ProfileField>

          <ProfileField label="Date Of Birth">
            {isEditing ? (
              <input
                type="date"
                className="portal-form-control"
                value={editData.dob || ''}
                onChange={event => setEditData({ ...editData, dob: event.target.value })}
              />
            ) : readValue(user.dob)}
          </ProfileField>

          <ProfileField label="Phone Number">
            {isEditing ? (
              <input
                type="tel"
                className="portal-form-control"
                value={editData.phone || ''}
                onChange={event => setEditData({ ...editData, phone: event.target.value })}
              />
            ) : readValue(user.phone)}
          </ProfileField>

          <ProfileField label="Email Address">
            {readValue(user.email, true)}
          </ProfileField>

          <ProfileField label="Assigned Portal Role">
            {readValue(user.role === 'admin' ? 'Administrator' : user.role === 'employee' ? 'Firm Staff' : 'External Client')}
          </ProfileField>

          <ProfileField label="Member Since">
            {readValue(new Date(user.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), true)}
          </ProfileField>

          {user.role !== 'client' && (
            <ProfileField label="Authorized Firm Services" wide>
              <div className="profile-tag-row">
                {(user.expertise_tags || []).map(tag => (
                  <span key={tag}>{tag}</span>
                ))}
                {(user.expertise_tags || []).length === 0 && <p className="profile-read-value profile-read-value--muted">No tags assigned.</p>}
              </div>
            </ProfileField>
          )}

          {isEditing && (
            <>
              <div className="profile-divider" style={{ gridColumn: '1 / -1', margin: '30px 0 10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}></div>
              <div style={{ gridColumn: '1 / -1', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--accent-primary)', marginBottom: '5px' }}>Security Credentials</h3>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Update your portal access password below. Leave blank to keep current.</p>
              </div>
              
              <ProfileField label="New Password">
                <input
                  type="password"
                  className="portal-form-control"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </ProfileField>

              <ProfileField label="Confirm New Password">
                <input
                  type="password"
                  className="portal-form-control"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </ProfileField>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default UserProfile;
