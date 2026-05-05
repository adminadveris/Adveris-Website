
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'employee' | 'client'>('employee');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showExpertiseModal, setShowExpertiseModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Edit Mode State ---
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<User>>({});

  const startEdit = () => {
    if (selectedUser) {
      setEditData({ ...selectedUser });
      setIsEditing(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!selectedUserId) return;
    try {
      const updates = {
        ...editData,
        full_name: `${editData.first_name || ''} ${editData.last_name || ''}`.trim()
      };
      await api.updateProfile(selectedUserId, updates);
      await load();
      setIsEditing(false);
    } catch (e: any) {
      console.error("Profile save failure:", e);
      const msg = e?.message || "Network or permission error.";
      setError(`Save failed: ${msg}. Ensure your Supabase table has the required columns.`);
      setTimeout(() => setError(null), 8000);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const p = await api.getAllProfiles();
      setUsers(p);
      if (p.length > 0 && !selectedUserId) {
        // Find first staff if filtering by employee
        const staff = p.find(u => u.role === 'employee' || u.role === 'admin');
        setSelectedUserId(staff?.id || p[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const selectedUser = users.find(p => p.id === selectedUserId);

  const filteredUsers = users.filter(p => {
    const roleMatch = roleFilter === 'all' || p.role === roleFilter;
    const searchMatch = p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase());
    return roleMatch && searchMatch;
  });

  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedProfiles = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleStatusChange = async (id: string, status: User['status']) => {
    const target = users.find(p => p.id === id);
    if (status === 'approved' && target?.role === 'employee') {
      const tags = target.expertise_tags || [];
      if (tags.length === 0) {
        setError("Approval requires at least one Firm Authorization for staff members.");
        setTimeout(() => setError(null), 5000);
        return;
      }
    }

    try {
      await api.updateProfile(id, { status });
      await load();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRoleChange = async (id: string, role: User['role']) => {
    try {
      await api.updateProfile(id, { role });
      await load();
    } catch (e) {
      console.error(e);
    }
  };

  const handleExpertiseChange = async (id: string, tags: string[]) => {
    try {
      await api.updateProfile(id, { expertise_tags: tags });
      await load();
      setShowExpertiseModal(false);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (showExpertiseModal) {
      document.body.classList.add('portal-modal-active');
    } else {
      document.body.classList.remove('portal-modal-active');
    }
    return () => document.body.classList.remove('portal-modal-active');
  }, [showExpertiseModal]);

  if (loading) return (
    <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="intelligence-pulse">Mapping governance ecosystem...</div>
    </div>
  );

  return (
    <div className="theater-container" style={{ padding: 0, height: 'calc(100vh - 120px)', display: 'flex', gap: 0 }}>

      {/* SIDEBAR: USER LIST */}
      <div style={{
        width: 380,
        borderRight: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(255,255,255,0.01)'
      }}>
        <div style={{ padding: '32px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.3, marginBottom: 24 }}>User List</h2>
          <div className="portal-form-group" style={{ marginBottom: 16 }}>
            <input
              type="text"
              className="portal-form-control"
              placeholder="Search identity..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ height: 48, fontSize: '0.85rem' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['all', 'admin', 'employee', 'client'].map(r => (
              <button
                key={r}
                onClick={() => setRoleFilter(r as any)}
                style={{
                  flex: 1, height: 32, fontSize: '0.7rem', fontWeight: 500, borderRadius: 6,
                  background: roleFilter === r ? 'var(--gold)' : 'rgba(255,255,255,0.05)',
                  color: roleFilter === r ? 'black' : 'rgba(255,255,255,0.4)',
                  border: 'none', cursor: 'pointer'
                }}
              >
                {r === 'all' ? 'Any' : r === 'employee' ? 'Staff' : r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {paginatedProfiles.map(p => (
            <div
              key={p.id}
              onClick={() => setSelectedUserId(p.id)}
              style={{
                padding: '16px 20px', borderRadius: 12, cursor: 'pointer', marginBottom: 4,
                background: selectedUserId === p.id ? 'rgba(255,153,51,0.08)' : 'transparent',
                border: `1px solid ${selectedUserId === p.id ? 'rgba(255,153,51,0.2)' : 'transparent'}`,
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontWeight: 500, color: selectedUserId === p.id ? 'white' : 'rgba(255,255,255,0.6)', fontSize: '0.95rem' }}>{p.full_name}</p>
                  <p style={{ fontSize: '0.75rem', opacity: 0.3, marginTop: 2 }}>{p.email}</p>
                </div>
                <span style={{
                  fontSize: '0.65rem', fontWeight: 600, 
                  padding: '4px 8px', borderRadius: 4,
                  background: p.role === 'admin' ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.05)',
                  color: p.role === 'admin' ? 'var(--gold)' : 'rgba(255,255,255,0.3)'
                }}>{p.role === 'admin' ? 'Admin' : p.role === 'employee' ? 'Staff' : 'Client'}</span>
              </div>
            </div>
          ))}
          {paginatedProfiles.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', opacity: 0.2, fontSize: '0.85rem' }}>No users found.</div>
          )}
        </div>

        {/* SIDEBAR PAGINATION */}
        <div style={{
          padding: '20px 24px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', opacity: 0.3, fontWeight: 500 }}>Showing {Math.min(filteredUsers.length, pageSize)} of {filteredUsers.length}</span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="portal-select-minimal"
            >
              <option value={10}>10 rows</option>
              <option value={25}>25 rows</option>
              <option value={50}>50 rows</option>
              <option value={100}>100 rows</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="btn-portal-outline"
              style={{ flex: 1, height: 36, fontSize: '0.75rem', padding: 0, opacity: currentPage === 1 ? 0.2 : 1 }}
            >
              Previous
            </button>
            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="btn-portal-outline"
              style={{ flex: 1, height: 36, fontSize: '0.75rem', padding: 0, opacity: currentPage === totalPages || totalPages === 0 ? 0.2 : 1 }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT: user VIEW */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'radial-gradient(circle at top right, rgba(255,153,51,0.03), transparent)' }}>
        <AnimatePresence mode="wait">
          {selectedUser ? (
            <motion.div
              key={selectedUser.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              style={{ padding: 60 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 60 }}>
                <div>
                  <h1 className="serif-title" style={{ fontSize: '3.5rem', marginBottom: 8 }}>{selectedUser.full_name}</h1>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <span style={{ fontSize: '1rem', color: 'var(--gold)', fontWeight: 300, opacity: 0.6 }}>{selectedUser.email}</span>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                    <span style={{ fontSize: '0.85rem', opacity: 0.4, fontWeight: 500 }}>{selectedUser.role === 'admin' ? 'Administrator' : selectedUser.role === 'employee' ? 'Firm Staff' : 'External Client'}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end' }}>
                    <div style={{
                      display: 'inline-block', padding: '12px 32px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.05)',
                      background: selectedUser.status === 'approved' ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)',
                      color: selectedUser.status === 'approved' ? '#4ade80' : '#f87171',
                      fontWeight: 600, fontSize: '0.75rem'
                    }}>
                      {selectedUser.status === 'approved' ? 'Approved' : selectedUser.status === 'rejected' ? 'Revoked' : 'Pending'}
                    </div>
                    {!isEditing ? (
                      <button
                        onClick={startEdit}
                        className="btn-portal-outline"
                        style={{ padding: '8px 20px', fontSize: '0.75rem', borderRadius: 8, width: 'auto' }}
                      >
                        Edit Profile
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="btn-portal-outline"
                          style={{ padding: '8px 16px', fontSize: '0.75rem', borderRadius: 8, width: 'auto', opacity: 0.5 }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          className="btn-portal-primary"
                          style={{ padding: '8px 20px', fontSize: '0.75rem', borderRadius: 8, width: 'auto' }}
                        >
                          Save
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  style={{
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                    padding: '16px 24px', borderRadius: 8, color: '#f87171', fontSize: '0.85rem',
                    marginBottom: 40, fontWeight: 600
                  }}
                >
                  ⚠ {error}
                </motion.div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60 }}>

                {/* USER PROFILE DETAILS (2 Column Grid) */}
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.3, margin: 0 }}>User profile details</h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px 60px' }}>
                    <div>
                      <label className="portal-form-label">First Name</label>
                      {isEditing ? (
                        <input
                          className="portal-form-control"
                          value={editData.first_name || ''}
                          onChange={e => setEditData({ ...editData, first_name: e.target.value })}
                          style={{ background: 'rgba(255,255,255,0.03)', height: 48 }}
                        />
                      ) : (
                        <p style={{ color: 'white', fontSize: '1rem', fontWeight: 400 }}>{selectedUser.first_name || '—'}</p>
                      )}
                    </div>

                    <div>
                      <label className="portal-form-label">Last Name</label>
                      {isEditing ? (
                        <input
                          className="portal-form-control"
                          value={editData.last_name || ''}
                          onChange={e => setEditData({ ...editData, last_name: e.target.value })}
                          style={{ background: 'rgba(255,255,255,0.03)', height: 48 }}
                        />
                      ) : (
                        <p style={{ color: 'white', fontSize: '1rem', fontWeight: 400 }}>{selectedUser.last_name || '—'}</p>
                      )}
                    </div>

                    <div>
                      <label className="portal-form-label">Gender / Sex</label>
                      {isEditing ? (
                        <select
                          className="portal-form-control"
                          value={editData.sex || ''}
                          onChange={e => setEditData({ ...editData, sex: e.target.value as any })}
                          style={{ background: 'rgba(255,255,255,0.03)', height: 48 }}
                        >
                          <option value="">Select...</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      ) : (
                        <p style={{ color: 'white', fontSize: '1rem', fontWeight: 400 }}>{selectedUser.sex || '—'}</p>
                      )}
                    </div>

                    <div>
                      <label className="portal-form-label">Date of Birth</label>
                      {isEditing ? (
                        <input
                          type="date"
                          className="portal-form-control"
                          value={editData.dob || ''}
                          onChange={e => setEditData({ ...editData, dob: e.target.value })}
                          style={{ background: 'rgba(255,255,255,0.03)', height: 48 }}
                        />
                      ) : (
                        <p style={{ color: 'white', fontSize: '1rem', fontWeight: 400 }}>{selectedUser.dob || '—'}</p>
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
                          style={{ background: 'rgba(255,255,255,0.03)', height: 48 }}
                        />
                      ) : (
                        <p style={{ color: 'white', fontSize: '1.1rem', fontWeight: 400, fontFamily: 'monospace' }}>{selectedUser.phone || '—'}</p>
                      )}
                    </div>

                    <div>
                      <label className="portal-form-label">Email Address</label>
                      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem', fontWeight: 400 }}>{selectedUser.email}</p>
                    </div>

                    <div>
                      <label className="portal-form-label">Assigned Portal Role</label>
                      {isEditing ? (
                        <select
                          value={editData.role || selectedUser.role}
                          onChange={(e) => setEditData({ ...editData, role: e.target.value as any })}
                          disabled={selectedUser.id === currentUser?.id}
                          className="portal-form-control"
                          style={{ background: 'rgba(255,255,255,0.03)', height: 48, padding: '0 14px' }}
                        >
                          <option value="admin">Administrator (Full Access)</option>
                          <option value="employee">Firm Staff (Restricted)</option>
                          <option value="client">External Client</option>
                        </select>
                      ) : (
                        <p style={{ color: 'white', fontSize: '1rem', fontWeight: 400 }}>
                          {selectedUser.role === 'admin' ? 'Administrator' :
                            selectedUser.role === 'employee' ? 'Firm Staff' : 'External Client'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="portal-form-label">Member Since</label>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem', fontWeight: 400 }}>{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* FIRM AUTHORIZATIONS (Hidden for Clients) */}
                {selectedUser.role !== 'client' && (
                  <div style={{ gridColumn: 'span 2', marginTop: 40, paddingTop: 40, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                      <h3 style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.3, margin: 0 }}>Firm authorizations</h3>
                      <button
                        onClick={() => setShowExpertiseModal(true)}
                        style={{
                          background: 'none', border: 'none', color: 'var(--gold)',
                          fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer'
                        }}
                      >
                        Manage access
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                      {(selectedUser.expertise_tags || []).length > 0 ? (
                        selectedUser.expertise_tags?.map(t => (
                          <div key={t} style={{
                            padding: '12px 20px', borderRadius: 8, background: 'rgba(255,153,51,0.05)',
                            border: '1px solid rgba(255,153,51,0.1)', color: 'var(--saffron)',
                            fontSize: '0.85rem', fontWeight: 500
                          }}>
                            {t}
                          </div>
                        ))
                      ) : (
                        <div style={{
                          width: '100%', padding: '40px', borderRadius: 12, border: '1px dashed rgba(255,255,255,0.05)',
                          textAlign: 'center', opacity: 0.2
                        }}>
                          <p style={{ fontSize: '0.85rem' }}>No institutional services authorized yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ACTION HUB */}
              <div style={{ marginTop: 80, paddingTop: 60, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 16 }}>
                {selectedUser.id !== currentUser?.id && (
                  <>
                    {selectedUser.status !== 'approved' && (
                      <button
                        onClick={() => handleStatusChange(selectedUser.id, 'approved')}
                        className="btn-portal-primary"
                        style={{ padding: '20px 60px', fontSize: '0.85rem' }}
                      >
                        Approve User Request
                      </button>
                    )}
                    {selectedUser.status !== 'rejected' && (
                      <button
                        onClick={() => handleStatusChange(selectedUser.id, 'rejected')}
                        className="btn-portal-outline"
                        style={{ padding: '20px 40px', fontSize: '0.85rem' }}
                      >
                        Revoke System Access
                      </button>
                    )}
                  </>
                )}
              </div>

            </motion.div>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.1 }}>
              <h2 className="serif-title" style={{ fontSize: '2rem' }}>Select a user to view details</h2>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* MODAL: EXPERTISE MANAGEMENT */}
      <AnimatePresence>
        {showExpertiseModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="portal-modal-overlay"
            onClick={() => setShowExpertiseModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="portal-modal-card scoping-width"
              onClick={e => e.stopPropagation()}
              style={{ padding: 48, maxWidth: 800 }}
            >
              <h2 className="serif-title" style={{ fontSize: '2.5rem', marginBottom: 12 }}>Authorizations</h2>
              <p style={{ opacity: 0.4, marginBottom: 40 }}>Assign service-level expertise tags for <strong>{selectedUser.full_name}</strong>. These define the operational visibility of firm records.</p>

              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 12, maxHeight: '50vh', overflowY: 'auto', paddingRight: 8
              }}>
                {[
                  "ALL (Global Access)",
                  "Commercial Contracts",
                  "Employment Law",
                  "Joint Ventures",
                  "Foreign Direct Investment",
                  "Regulatory Compliance & Risk Management",
                  "Due Diligence Report",
                  "Dispute & Pre-Litigation Support",
                  "Business Valuation",
                  "Representation before Authorities",
                  "Bankruptcy and Insolvency"
                ].map((service, index, array) => {
                  const currentTags = selectedUser.expertise_tags || [];
                  const isSelected = currentTags.includes(service);
                  const allOtherServices = array.slice(1);

                  return (
                    <label key={service} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px',
                      background: isSelected ? 'rgba(255,153,51,0.1)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isSelected ? 'rgba(255,153,51,0.3)' : 'rgba(255,255,255,0.05)'}`,
                      borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s'
                    }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          let next: string[] = [];
                          if (service === "ALL (Global Access)") {
                            next = checked ? [...array] : [];
                          } else {
                            if (checked) {
                              next = [...currentTags, service];
                              if (allOtherServices.filter(s => s !== service).every(s => next.includes(s))) {
                                next.push("ALL (Global Access)");
                              }
                            } else {
                              next = currentTags.filter(s => s !== service && s !== "ALL (Global Access)");
                            }
                          }
                          const updatedProfiles = users.map(p => p.id === selectedUser.id ? { ...p, expertise_tags: next } : p);
                          setUsers(updatedProfiles);
                        }}
                        style={{ accentColor: 'var(--saffron)', width: 18, height: 18 }}
                      />
                      <span style={{ fontSize: '0.9rem', fontWeight: 500, color: isSelected ? 'white' : 'rgba(255,255,255,0.5)' }}>{service}</span>
                    </label>
                  );
                })}
              </div>

              <div style={{ marginTop: 48, display: 'flex', gap: 16 }}>
                <button
                  className="btn-portal-primary" style={{ flex: 1, padding: '20px 0' }}
                  onClick={() => handleExpertiseChange(selectedUser.id, selectedUser.expertise_tags || [])}
                >
                  Save Authorizations
                </button>
                <button
                  className="btn-portal-outline" style={{ flex: 1, padding: '20px 0' }}
                  onClick={() => setShowExpertiseModal(false)}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;
