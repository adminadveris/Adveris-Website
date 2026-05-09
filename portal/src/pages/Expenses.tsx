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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

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

  const filteredData = entries.filter(e => {
    const matchesSearch = (e.expense_number + e.category + e.account_name).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' ? true : e.status === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const paginatedEntries = filteredData.slice(
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
        status: 'submitted'
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
        <div className="enterprise-toolbar portal-page-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <button onClick={cancelForm} className="btn-portal-outline">← Back</button>
          <div>
            <div className="enterprise-eyebrow">Expense Entry</div>
            <h1>{editingId ? 'Edit Expense' : 'New Expense'}</h1>
          </div>
          {editingId && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Status</span>
              <span className="portal-badge" style={{ background: statusColors[currentStatus], color: statusText[currentStatus], border: 'none', padding: '6px 16px', borderRadius: 100, fontSize: '0.65rem', fontWeight: 700 }}>
                {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
              </span>
            </div>
          )}
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

                {editingId && user?.role === 'admin' && (
                  <div style={{ 
                    marginBottom: 32, 
                    padding: 24, 
                    background: 'rgba(255,255,255,0.02)', 
                    borderRadius: 12, 
                    border: '1px dashed rgba(255,255,255,0.1)' 
                  }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.3, textTransform: 'uppercase', marginBottom: 16, letterSpacing: '0.1em' }}>
                      Administrative Governance
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button 
                        type="button"
                        onClick={() => handleBulkStatus('approved', [editingId])}
                        disabled={loading}
                        style={{ 
                          flex: 1, 
                          background: currentStatus === 'approved' ? 'rgba(34, 197, 94, 0.1)' : '#22c55e',
                          color: 'white',
                          border: currentStatus === 'approved' ? '1px solid #22c55e' : 'none',
                          padding: '12px',
                          borderRadius: 8,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          opacity: currentStatus === 'approved' ? 0.5 : 1
                        }}
                      >
                        {loading ? 'Processing...' : 'Approve Disbursement'}
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleBulkStatus('rejected', [editingId])}
                        disabled={loading}
                        style={{ 
                          flex: 1, 
                          background: 'transparent',
                          color: '#ef4444',
                          border: '1px solid #ef4444',
                          padding: '12px',
                          borderRadius: 8,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          opacity: currentStatus === 'rejected' ? 0.5 : 1
                        }}
                      >
                        {loading ? 'Processing...' : 'Reject Entry'}
                      </button>
                    </div>
                  </div>
                )}

                <button type="submit" className="btn-portal-primary w-full h-48">
                  {loading ? 'Processing...' : (editingId ? 'Commit Changes & Save' : 'Submit Disbursement')}
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
      <div className="enterprise-toolbar">
        <div>
          <div className="enterprise-eyebrow">Workspace</div>
          <h1>Expenses</h1>
        </div>
        <div className="enterprise-toolbar__actions">
          <span className="enterprise-status enterprise-status--warning">{filteredData.length} entries</span>
        </div>
      </div>

      <div className="enterprise-filterbar" style={{ marginBottom: 40, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flex: 1, maxWidth: 800 }}>
          <div style={{ position: 'relative', flex: 1 }}>
             <input 
               type="text" 
               placeholder="Search Expenses (Ref, Category, Account)..." 
               value={searchQuery}
               onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
               style={{ 
                 width: '100%', 
                 background: 'rgba(255,255,255,0.03)', 
                 border: '1px solid rgba(255,255,255,0.08)', 
                 borderRadius: 8, 
                 padding: '12px 16px 12px 40px',
                 color: 'white',
                 fontSize: '0.85rem',
                 fontFamily: 'var(--font-ui)'
               }} 
             />
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }}>
               <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
             </svg>
          </div>
          
          <select 
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            style={{ 
              background: 'rgba(255,255,255,0.03)', 
              border: '1px solid rgba(255,255,255,0.08)', 
              borderRadius: 8, 
              padding: '12px 16px',
              color: 'white',
              fontSize: '0.85rem',
              minWidth: 140,
              fontFamily: 'var(--font-ui)'
            }}
          >
            <option>All</option>
            <option>Submitted</option>
            <option>Approved</option>
            <option>Paid</option>
            <option>Rejected</option>
          </select>
        </div>

        <div style={{ paddingBottom: 0, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {user?.role === 'admin' && (
            <ExportDropdown data={filteredData} filename="Adveris_Expenses" label="Export Expense" dateField="date" />
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

        {/* BULK ACTION BAR */}
        <AnimatePresence>
          {selectedIds.length > 0 && user?.role === 'admin' && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              style={{
                position: 'fixed',
                bottom: 40,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                padding: '16px 32px',
                background: 'rgba(13, 27, 62, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: '16px',
                border: '1.5px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                fontFamily: 'var(--font-ui)'
              }}
            >
              <div style={{ color: 'white', fontSize: '0.85rem', fontWeight: 500 }}>
                {selectedIds.length} <span style={{ opacity: 0.5 }}>Disbursements Selected</span>
              </div>
              
              <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }} />
              
              <div style={{ display: 'flex', gap: 12 }}>
                <button 
                  onClick={() => handleBulkStatus('approved')}
                  disabled={loading}
                  style={{
                    padding: '8px 24px',
                    borderRadius: 8,
                    background: '#22c55e',
                    color: 'white',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
                  onMouseOut={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                >
                  {loading ? 'Approving...' : 'Approve Entries'}
                </button>
                <button 
                  onClick={() => handleBulkStatus('rejected')}
                  disabled={loading}
                  style={{
                    padding: '8px 24px',
                    borderRadius: 8,
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    border: '1px solid #ef4444',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                >
                  {loading ? 'Rejecting...' : 'Reject Entries'}
                </button>
              </div>

              <button 
                onClick={() => setSelectedIds([])}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  opacity: 0.3,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  marginLeft: 12
                }}
              >
                Cancel
              </button>
            </motion.div>
          )}
        </AnimatePresence>

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
            totalItems={filteredData.length}
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
