import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { Account, Request, ExpenseEntry } from '../types';
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
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [records, setRecords] = useState<Request[]>([]);
  const [entries, setEntries] = useState<ExpenseEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const getInputStyle = (field: string) => ({
    border: validationErrors.includes(field) ? '1px solid var(--saffron)' : '1.5px solid rgba(255,255,255,0.1)',
    transition: 'all 0.3s ease',
    boxShadow: validationErrors.includes(field) ? '0 0 0 3px rgba(255,153,51,0.08)' : 'none'
  });

  // Form State
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedRecordId, setSelectedRecordId] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Regulatory Fees');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [desc, setDesc] = useState('');
  const [url, setUrl] = useState('');
  const [currentStatus, setCurrentStatus] = useState('submitted');
  const [expenseNumber, setExpenseNumber] = useState('');
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const loadData = async () => {
    if (!user) return;
    const [accs, recs, eEntries] = await Promise.all([
      api.getAccounts(),
      api.getRecords(),
      api.getExpenses()
    ]);
    setAccounts(accs);
    setRecords(recs);
    let filteredExpenses = eEntries;
    if (user.role === 'employee') {
      filteredExpenses = eEntries.filter(e => e.created_by_name === user.full_name);
    } else if (user.role === 'client') {
      filteredExpenses = eEntries.filter(e => e.account_id === user.account_id);
    }
    setEntries(filteredExpenses);
  };

  useEffect(() => { loadData(); }, [user]);

  if (!user) return null;
  const isAdmin = user.role === 'admin' || user.role === 'employee';

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
    setSelectedRecordId(entry.record_id || '');
    setAmount(entry.amount.toString());
    setCategory(entry.category || 'Regulatory Fees');
    setDate(entry.date);
    setDesc(entry.description || '');
    setUrl(entry.url || '');
    setCurrentStatus(entry.status || 'submitted');
    setExpenseNumber(entry.expense_number || '');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBulkStatus = async (status: string, overrideIds?: string[]) => {
    setLoading(true);
    try {
      const idsToUpdate = overrideIds || selectedIds;
      await api.bulkUpdateExpensesStatus(idsToUpdate, status as ExpenseEntry['status']);
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

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    
    const errors: string[] = [];
    if (!selectedAccountId || !amount || !category || !date) {
      const errs = [];
      if (!selectedAccountId) errs.push('accountId');
      if (!amount) errs.push('amount');
      if (!category) errs.push('category');
      if (!date) errs.push('date');
      setValidationErrors(errs);
      alert("Validation Error: Please Ensure Account, Amount, Category, And Date Are All Completed.");
      return;
    }

    setLoading(true);
    setValidationErrors([]);
    setSubmitStatus(null);
    try {
      const account = accounts.find(a => a.id === selectedAccountId);
      const payload = {
        record_id: selectedRecordId ? (isNaN(Number(selectedRecordId)) ? selectedRecordId : Number(selectedRecordId)) : null,
        account_id: selectedAccountId,
        account_name: account?.account_name || 'N/A',
        amount: Number(amount),
        category,
        date,
        description: desc,
        url,
        status: currentStatus
      };


      if (editingId) {
        await api.updateExpense(editingId, payload);
      } else {
        await api.createExpense(payload);
      }

      setSubmitStatus({ type: 'success', msg: "Expense Record Successfully Committed To Ledger." });
      setTimeout(() => {
        setShowForm(false);
        setEditingId(null);
        setAmount('');
        setDesc('');
        setUrl('');
        setSelectedAccountId('');
        setSelectedRecordId('');
        setSubmitStatus(null);
      }, 2000);
      await loadData();
    } catch (err: any) {
      console.error("EXPENSE_SUBMIT_ERROR:", err);
      setSubmitStatus({ type: 'error', msg: "Submission Failed: " + (err.message || "Unknown Server Error") });
    } finally {
      setLoading(false);
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setAmount('');
    setDesc('');
    setUrl('');
    setSelectedAccountId('');
    setSelectedRecordId('');
    setExpenseNumber('');
    setSubmitStatus(null);
  };

  if (showForm) {
    return (
      <div className="portal-content">
        <div className="portal-page-header-row" style={{ justifyContent: 'flex-start', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <button onClick={cancelForm} className="btn-portal-outline">← Back</button>
            {editingId && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, opacity: 0.4 }}>Status</span>
                <span className="portal-badge" style={{ background: statusColors[currentStatus], color: statusText[currentStatus], border: 'none', padding: '6px 16px' }}>
                  {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="portal-request-grid-center">
          <div className="portal-panel scoping-width" style={{ padding: 48 }}>
            <form onSubmit={handleSubmit}>
              {editingId && (
                <div style={{ marginBottom: 24 }}>
                  <FF label="Expense Reference">
                    <input readOnly className="portal-form-control" style={{ opacity: 0.6, color: 'var(--gold)', fontWeight: 700 }} value={expenseNumber} />
                  </FF>
                </div>
              )}
              <div style={{ marginBottom: 24 }}>
                <SearchableSelect 
                  label="Client Account"
                  options={accountOptions}
                  value={selectedAccountId}
                  error={validationErrors.includes('selectedAccountId')}
                  onChange={(id) => { setSelectedAccountId(id); setSelectedRecordId(''); }}
                  placeholder="Search Account Name..."
                />
              </div>

              <div style={{ marginBottom: 24, opacity: selectedAccountId ? 1 : 0.4, pointerEvents: selectedAccountId ? 'auto' : 'none', transition: 'all 0.3s' }}>
                <SearchableSelect 
                  label="Associated Mandate"
                  options={records.filter(r => r.account_id === selectedAccountId).map(r => ({ id: r.id, label: r.title, sublabel: r.request_number }))}
                  value={selectedRecordId}
                  onChange={setSelectedRecordId}
                  placeholder={selectedAccountId ? "Select Project Or Adv Request..." : "Select Account First..."}
                />
              </div>

              <div className="portal-form-grid-2">
                <FF label="Amount (Inr)">
                  <input required type="number" className="portal-form-control" style={getInputStyle('amount')} value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
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
                  <input required type="date" className="portal-form-control" style={getInputStyle('date')} value={date} onChange={e => setDate(e.target.value)} />
                </FF>
                <FF label="Receipt Url (Optional)">
                  <input type="url" className="portal-form-control" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." />
                </FF>
              </div>
              <FF label="Rationale & Justification">
                <textarea required className="portal-form-control" style={{ minHeight: 120, ...getInputStyle('desc') }} placeholder="Detailed Reason For This Disbursement..." value={desc} onChange={e => setDesc(e.target.value)} />
              </FF>

              {editingId && isAdmin && (
                <div className="portal-form-grid-2" style={{ marginTop: 16 }}>
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
                    Approve
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
                    Reject
                  </button>
                </div>
              )}

              <div style={{ marginTop: 16 }}>
                {submitStatus && (
                  <div style={{ 
                    marginBottom: 16,
                    padding: '12px 20px',
                    borderRadius: 8,
                    fontSize: '0.8rem',
                    background: submitStatus.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: submitStatus.type === 'success' ? '#10b981' : '#ef4444',
                    border: `1px solid ${submitStatus.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                  }}>
                    {submitStatus.msg}
                  </div>
                )}
                <button type="submit" className="btn-portal-primary w-full h-48">
                  {loading ? 'Syncing...' : editingId ? 'Update Expense' : 'Create Expense'}
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
        {selectedIds.length > 0 && user?.role === 'admin' && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="portal-batch-bar"
          >
            <div className="batch-content">
              <span className="batch-label">{selectedIds.length} Disbursements Selected</span>
              <div className="batch-actions">
                <button 
                  disabled={loading}
                  onClick={() => handleBulkStatus('approved')} 
                  className="btn-batch btn-batch--approve"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  Approve
                </button>
                <button 
                  disabled={loading}
                  onClick={() => handleBulkStatus('rejected')} 
                  className="btn-batch btn-batch--reject"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  Reject
                </button>
                <div className="batch-divider" />
                <button onClick={() => setSelectedIds([])} className="btn-batch-text">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ marginBottom: 40, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
        <div style={{ paddingBottom: 0, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {user?.role === 'admin' && (
            <ExportDropdown data={entries} filename="Adveris_Expenses" label="Export Expense" dateField="date" />
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
                {user?.role === 'admin' && (
                  <th style={{ width: 40, paddingLeft: 60 }}>
                    <input 
                      type="checkbox" 
                      className="portal-checkbox" 
                      checked={selectedIds.length === entries.length && entries.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                )}
                <th style={{ width: 100, paddingLeft: user?.role === 'admin' ? 0 : 60, whiteSpace: 'nowrap' }}>Date</th>
                <th style={{ width: 140 }}>Category</th>
                <th style={{ width: 140 }}>Account Name</th>
                <th style={{ width: 100 }}>Expense Ref</th>
                <th style={{ width: 100 }}>Verification</th>
                <th style={{ textAlign: 'right', width: 120 }}>Amount (Inr)</th>
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
                  {user?.role === 'admin' && (
                    <td onClick={evt => evt.stopPropagation()} style={{ paddingLeft: 60 }}>
                      <input 
                        type="checkbox" 
                        className="portal-checkbox"
                        checked={selectedIds.includes(e.id)}
                        onChange={() => handleSelectOne(e.id)}
                      />
                    </td>
                  )}
                  <td data-label="Date" style={{ paddingLeft: user?.role === 'admin' ? 0 : 60, whiteSpace: 'nowrap' }}>{new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                  <td data-label="Category" style={{ color: 'white', fontSize: '0.85rem' }}>{e.category}</td>
                  <td data-label="Account Name" style={{ opacity: 0.6, fontSize: '0.85rem' }}>{e.account_name}</td>
                  <td data-label="Exp-Ref" style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '0.75rem' }}>{e.expense_number || 'Exp-Temp'}</td>
                  <td data-label="Verification">
                    <span className="portal-badge" style={{ background: statusColors[e.status || 'submitted'], color: statusText[e.status || 'submitted'] }}>
                      {((e.status || 'submitted').charAt(0).toUpperCase() + (e.status || 'submitted').slice(1))}
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
                  <td colSpan={user?.role === 'admin' ? 7 : 6} style={{ textAlign: 'center', padding: 60, opacity: 0.1 }}>No Disbursement Logs Detected.</td>
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
