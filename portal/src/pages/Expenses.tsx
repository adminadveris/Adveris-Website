import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { mockApi } from '../lib/mockApi';
import { useAuth } from '../contexts/AuthContext';
import type { Account, ExpenseEntry } from '../types';
import Pagination from '../components/Pagination';
import SearchableSelect from '../components/SearchableSelect';
import ExportDropdown from '../components/ExportDropdown';
import { motion, AnimatePresence } from 'framer-motion';

const FF = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="portal-form-group">
    <label className="portal-form-label">{label}</label>
    {children}
  </div>
);

const statusColors: Record<string, string> = {
  submitted: 'rgba(255,153,51,0.2)',
  approved: 'rgba(34,197,94,0.2)',
  rejected: 'rgba(239,68,68,0.2)'
};

const statusText: Record<string, string> = {
  submitted: '#ff9933',
  approved: '#22c55e',
  rejected: '#ef4444'
};

const Expenses = () => {
  const { profile } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<ExpenseEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Form State
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Regulatory Fees');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [desc, setDesc] = useState('');
  const [url, setUrl] = useState('');
  const [currentStatus, setCurrentStatus] = useState('submitted');

  const loadData = async () => {
    if (!profile) return;
    const [accs, eEntries] = await Promise.all([
      mockApi.getAccounts(),
      mockApi.getExpenses()
    ]);
    setAccounts(accs);
    let filteredExpenses = eEntries;
    if (profile.role === 'employee') {
      filteredExpenses = eEntries.filter(e => e.created_by_name === profile.full_name);
    } else if (profile.role === 'client') {
      filteredExpenses = eEntries.filter(e => e.account_id === profile.account_id);
    }
    setEntries(filteredExpenses);
  };

  useEffect(() => { loadData(); }, [profile]);

  if (!profile) return null;
  const isAdmin = profile.role === 'admin' || profile.role === 'employee';

  const paginatedEntries = entries.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const accountOptions = accounts.map(a => ({
    id: a.id,
    label: a.account_name,
    sublabel: a.cin_number || 'Account Entity'
  }));

  const handleEdit = (entry: ExpenseEntry) => {
    setEditingId(entry.id);
    setSelectedAccountId(entry.account_id || '');
    setAmount(entry.amount.toString());
    setCategory(entry.category || 'Regulatory Fees');
    setDate(entry.date);
    setDesc(entry.description || '');
    setUrl(entry.url || '');
    setCurrentStatus(entry.status || 'submitted');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBulkStatus = async (status: string, overrideIds?: string[]) => {
    setLoading(true);
    try {
      const idsToUpdate = overrideIds || selectedIds;
      await mockApi.bulkUpdateExpensesStatus(idsToUpdate, status as ExpenseEntry['status']);
      if (editingId && idsToUpdate.includes(editingId)) {
        setCurrentStatus(status);
      }
      setSelectedIds([]);
      await loadData();
    } finally { setLoading(false); }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(entries.map(ent => ent.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId) return;
    setLoading(true);
    try {
      const account = accounts.find(a => a.id === selectedAccountId);
      const payload = {
        account_id: selectedAccountId,
        account_name: account?.account_name || 'N/A',
        amount: Number(amount),
        category,
        date,
        description: desc,
        url
      };

      if (editingId) {
        await mockApi.updateExpense(editingId, payload);
      } else {
        await mockApi.createExpense(payload);
      }

      setShowForm(false);
      setEditingId(null);
      setAmount('');
      setDesc('');
      setUrl('');
      setSelectedAccountId('');
      await loadData();
    } finally { setLoading(false); }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setAmount('');
    setDesc('');
    setUrl('');
    setSelectedAccountId('');
  };

  if (showForm) {
    return (
      <div className="portal-content">
        <div className="portal-page-header-row" style={{ justifyContent: 'flex-end', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            
            {editingId && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, opacity: 0.4 }}>STATUS</span>
                <span className="portal-badge" style={{ background: statusColors[currentStatus], color: statusText[currentStatus], border: 'none', padding: '6px 16px' }}>
                  {currentStatus.toUpperCase()}
                </span>
              </div>
            )}
            <button onClick={cancelForm} className="btn-portal-outline">← Back</button>
          </div>
        </div>
        
        <div className="portal-request-grid-center">
          <div className="portal-auth-card scoping-width">
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 24 }}>
                <SearchableSelect 
                  label="Client Account"
                  options={accountOptions}
                  value={selectedAccountId}
                  onChange={setSelectedAccountId}
                  placeholder="Search Account Name..."
                />
              </div>

              <div className="portal-form-grid-2">
                <FF label="Amount (INR)">
                  <input required type="number" className="portal-form-control" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
                </FF>
                <FF label="Category">
                  <select className="portal-form-control" value={category} onChange={e => setCategory(e.target.value)}>
                    <option>Regulatory Fees</option>
                    <option>Traveling & Lodging</option>
                    <option>Printing & Stationery</option>
                    <option>Professional Charges</option>
                  </select>
                </FF>
              </div>
              <div className="portal-form-grid-2">
                <FF label="Incurred Date">
                  <input required type="date" className="portal-form-control" value={date} onChange={e => setDate(e.target.value)} />
                </FF>
                <FF label="Receipt URL (Optional)">
                  <input type="url" className="portal-form-control" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." />
                </FF>
              </div>
              <FF label="Rationale & Justification">
                <textarea required className="portal-form-control" style={{ minHeight: 120 }} placeholder="Detailed reason for this disbursement..." value={desc} onChange={e => setDesc(e.target.value)} />
              </FF>

              <div className={editingId && isAdmin ? "portal-form-grid-2" : ""} style={{ marginTop: 16 }}>
                 
                  {editingId && isAdmin && (
                     <div className="portal-form-grid-2">
                       <button 
                         type="button"
                         onClick={() => handleBulkStatus('approved', [editingId])}
                         className="btn-batch btn-batch--approve" 
                         style={{ 
                           width: '100%', justifyContent: 'center', height: 48, borderRadius: 8,
                           border: currentStatus === 'approved' ? '2px solid #22c55e' : '1px solid rgba(255,255,255,0.05)',
                           background: currentStatus === 'approved' ? 'rgba(34,197,94,0.15)' : undefined,
                           boxShadow: currentStatus === 'approved' ? '0 0 15px rgba(34,197,94,0.1)' : 'none',
                           opacity: currentStatus === 'approved' ? 1 : 0.4
                         }}
                       >
                          APPROVE
                       </button>
                       <button 
                         type="button"
                         onClick={() => handleBulkStatus('rejected', [editingId])}
                         className="btn-batch btn-batch--reject"
                         style={{ 
                           width: '100%', justifyContent: 'center', height: 48, borderRadius: 8,
                           border: currentStatus === 'rejected' ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.05)',
                           background: currentStatus === 'rejected' ? 'rgba(239,68,68,0.15)' : undefined,
                           boxShadow: currentStatus === 'rejected' ? '0 0 15px rgba(239,68,68,0.1)' : 'none',
                           opacity: currentStatus === 'rejected' ? 1 : 0.4
                         }}
                       >
                          REJECT
                       </button>
                     </div>
                  )}

                 <button disabled={loading || !selectedAccountId} type="submit" className="btn-portal-primary" style={{ width: '100%', height: 48 }}>
                   {loading ? 'POSTING...' : editingId ? 'Update Expense' : 'Create Expense'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-content">
      {/* Action Bar (Top Relocation) */}
      <AnimatePresence>
        {selectedIds.length > 0 && profile?.role === 'admin' && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="portal-batch-bar"
          >
            <div className="batch-content">
              <span className="batch-label">{selectedIds.length} DISBURSEMENTS SELECTED</span>
              <div className="batch-actions">
                <button 
                  disabled={loading}
                  onClick={() => handleBulkStatus('approved')} 
                  className="btn-batch btn-batch--approve"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  APPROVE
                </button>
                <button 
                  disabled={loading}
                  onClick={() => handleBulkStatus('rejected')} 
                  className="btn-batch btn-batch--reject"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  REJECT
                </button>
                <div className="batch-divider" />
                <button onClick={() => setSelectedIds([])} className="btn-batch-text">CANCEL</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ marginBottom: 40, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
        <div style={{ paddingBottom: 0, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {profile?.role === 'admin' && (
            <ExportDropdown data={entries} filename="Adveris_Expenses" label="EXPORT LEDGER" dateField="date" />
          )}
          <button 
            className="btn-portal-primary" 
            style={{ width: 'auto', padding: '12px 32px', fontSize: '0.65rem' }}
            onClick={() => setShowForm(true)}
          >
            New Expense
          </button>
        </div>
      </div>

      <div className="portal-panel" style={{ padding: 0, overflow: 'visible' }}>
        <div className="portal-table-wrap">
          <table className="portal-table-v2">
            <thead>
              <tr>
                {profile?.role === 'admin' && (
                  <th style={{ width: 40, paddingLeft: 60 }}>
                    <input 
                      type="checkbox" 
                      className="portal-checkbox" 
                      checked={selectedIds.length === entries.length && entries.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                )}
                <th style={{ width: 90, paddingLeft: profile?.role === 'admin' ? 0 : 60 }}>Date</th>
                <th style={{ width: 140 }}>Category</th>
                <th style={{ width: 140 }}>Account Name</th>
                <th style={{ width: 100 }}>Verification</th>
                <th style={{ textAlign: 'right', width: 120 }}>Amount (INR)</th>
                <th style={{ textAlign: 'right', paddingRight: 60, width: 80 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEntries.length > 0 ? paginatedEntries.map(e => (
                <tr key={e.id} 
                  onClick={() => handleEdit(e)}
                  style={{ cursor: 'pointer' }}
                  className={selectedIds.includes(e.id) ? 'selected' : ''}
                >
                  {profile?.role === 'admin' && (
                    <td onClick={evt => evt.stopPropagation()} style={{ paddingLeft: 60 }}>
                      <input 
                        type="checkbox" 
                        className="portal-checkbox"
                        checked={selectedIds.includes(e.id)}
                        onChange={() => handleSelectOne(e.id)}
                      />
                    </td>
                  )}
                  <td data-label="Date" style={{ paddingLeft: profile?.role === 'admin' ? 0 : 60 }}>{new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                  <td data-label="Category" style={{ color: 'white', fontSize: '0.85rem' }}>{e.category}</td>
                  <td data-label="Account Name" style={{ opacity: 0.6, fontSize: '0.85rem' }}>{e.account_name}</td>
                  <td data-label="Verification">
                    <span className="portal-badge" style={{ background: statusColors[e.status || 'submitted'], color: statusText[e.status || 'submitted'] }}>
                      {(e.status || 'submitted').toUpperCase()}
                    </span>
                  </td>
                  <td data-label="Amount" style={{ fontWeight: 600, color: 'white', textAlign: 'right' }}>₹{e.amount.toLocaleString('en-IN')}</td>
                  <td data-label="Actions" style={{ textAlign: 'right', paddingRight: 60 }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button onClick={(evt) => { evt.stopPropagation(); handleEdit(e); }} className="btn-portal-record-dots" title="Edit Expense">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={profile?.role === 'admin' ? 7 : 6} style={{ textAlign: 'center', padding: 60, opacity: 0.1 }}>No disbursement logs detected.</td>
                </tr>
              )}
            </tbody>
          </table>
          
          <Pagination 
            currentPage={currentPage}
            totalItems={entries.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
          />
        </div>
      </div>
    </div>
  );
};

export default Expenses;
