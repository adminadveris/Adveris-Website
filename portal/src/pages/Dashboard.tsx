import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode, ChangeEvent } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import PortalLayout from '../components/PortalLayout';
import NewRequest from './NewRequest';
import RecordsList from './RecordsList';
import MandateDetail from './MandateDetail';
import AuditLogs from './AuditLogs';
import CRMHub from './CRMHub';
import ClientDetail from './ClientDetail';
import ClientForm from './ClientForm';
import AccountDetail from './AccountDetail';
import HistoryRegistry from './HistoryRegistry';
import { mockApi } from '../lib/mockApi';
import type { 
  Profile, Account, ServiceRecord, 
  TimesheetEntry, ExpenseEntry, UIHistoryItem 
} from '../types';
import Pagination from '../components/Pagination';
import SearchableSelect from '../components/SearchableSelect';
import { motion, AnimatePresence } from 'framer-motion';

import ExportDropdown from '../components/ExportDropdown';

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


/* ——— OVERVIEW ——— */
const Overview = () => {
  const [stats, setStats] = useState({
    pendingVerifications: 0,
    activeMandates: 0,
    totalAccounts: 0,
    paidThisMonth: 0,
    pendingCurrMonth: 0,
    pendingLastMonth: 0,
    currWeekHours: 0,
    lastWeekHours: 0,
    pendingTimesheets: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOverviewTelemetery = async () => {
      try {
        const [profile, recs, tlogs, elogs, accs, clis] = await Promise.all([
          mockApi.getProfile(),
          mockApi.getRecords(),
          mockApi.getTimesheets(),
          mockApi.getExpenses(),
          mockApi.getAccounts(),
          mockApi.getClients()
        ]);
        
        const now = new Date();
        
        // Date Helpers
        const getMonday = (d: Date) => {
          const day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1);
          return new Date(d.setDate(diff)).setHours(0,0,0,0);
        };
        
        const startOfThisWeek = getMonday(new Date(now));
        const startOfLastWeek = startOfThisWeek - (7 * 24 * 60 * 60 * 1000);
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime();

        // --- Role Based Security Filtering ---
        let fRecs = recs;
        let fTlogs = tlogs;
        let fElogs = elogs;
        let fAccs = accs;
        let fClis = clis;

        if (profile.role === 'employee') {
          // Staff see ALL mandates (per request)
          fRecs = recs; 
          // But only their own timesheets and expenses
          fTlogs = tlogs.filter(t => t.logged_by === profile.full_name);
          fElogs = elogs.filter(e => e.created_by_name === profile.full_name);
          
          // Registry: For now, staff see full registry if they see all mandates
          fAccs = accs;
          fClis = clis;
        } else if (profile.role === 'client') {
          // Clients see ONLY their own data
          fRecs = recs.filter(r => r.account_id === profile.account_id);
          fTlogs = tlogs.filter(t => t.account_id === profile.account_id);
          fElogs = elogs.filter(e => e.account_id === profile.account_id);
          fAccs = accs.filter(a => a.id === profile.account_id);
          fClis = clis.filter(c => c.account_id === profile.account_id);
        }

        // 1. Operations
        const pendingVerifications = fRecs.filter(r => r.verification_status === 'Pending').length;
        const activeMandates = fRecs.filter(r => r.status !== 'completed').length;
        const totalRegistry = fAccs.length + fClis.length;

        // 2. Financials
        const paidThisMonth = fElogs
          .filter(e => e.status === 'paid' && new Date(e.date).getTime() >= startOfThisMonth)
          .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
          
        const pendingCurrMonth = fElogs
          .filter(e => e.status !== 'paid' && new Date(e.date).getTime() >= startOfThisMonth)
          .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
          
        const pendingLastMonth = fElogs
          .filter(e => e.status !== 'paid' && new Date(e.date).getTime() >= startOfLastMonth && new Date(e.date).getTime() <= endOfLastMonth)
          .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

        // 3. Timesheets
        const currWeekHours = fTlogs
          .filter(t => new Date(t.date).getTime() >= startOfThisWeek)
          .reduce((sum, t) => sum + (Number(t.hours) || 0), 0);
          
        const lastWeekHours = fTlogs
          .filter(t => new Date(t.date).getTime() >= startOfLastWeek && new Date(t.date).getTime() < startOfThisWeek)
          .reduce((sum, t) => sum + (Number(t.hours) || 0), 0);
          
        const pendingTimesheets = fTlogs.filter(t => t.status === 'submitted').length;

        setStats({
          pendingVerifications, activeMandates, totalAccounts: totalRegistry,
          paidThisMonth, pendingCurrMonth, pendingLastMonth,
          currWeekHours, lastWeekHours, pendingTimesheets
        });
      } catch (err) {
        console.error("Telemetry failure:", err);
      } finally {
        setLoading(false);
      }
    };
    loadOverviewTelemetery();
  }, []);

  const sections = [
    {
      title: 'OPERATIONS & VERIFICATION',
      cards: [
        { label: 'PENDING VERIFICATION', value: stats.pendingVerifications.toString(), suffix: 'LEDS', accent: 'saffron', icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/> },
        { label: 'ACTIVE MANDATES', value: stats.activeMandates.toString(), suffix: 'LIVE', accent: 'gold', icon: <circle cx="12" cy="12" r="10"/> },
        { label: 'TOTAL REGISTRY', value: stats.totalAccounts.toString(), suffix: 'STK', accent: 'dim', icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></> }
      ]
    },
    {
      title: 'FINANCIAL DISBURSALS',
      cards: [
        { label: 'PAID THIS MONTH', value: '₹' + stats.paidThisMonth.toLocaleString('en-IN'), suffix: '', accent: 'gold', icon: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/> },
        { label: 'PENDING (CURR MONTH)', value: '₹' + stats.pendingCurrMonth.toLocaleString('en-IN'), suffix: '', accent: 'saffron', icon: <><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></> },
        { label: 'PENDING (LAST MONTH)', value: '₹' + stats.pendingLastMonth.toLocaleString('en-IN'), suffix: '', accent: 'dim', icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> }
      ]
    },
    {
      title: 'PROFESSIONAL TIMESHEETS',
      cards: [
        { label: 'THIS WEEK HOURS', value: stats.currWeekHours.toFixed(1), suffix: 'HRS', accent: 'gold', icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> },
        { label: 'LAST WEEK HOURS', value: stats.lastWeekHours.toFixed(1), suffix: 'HRS', accent: 'dim', icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> },
        { label: 'PENDING APPROVAL', value: stats.pendingTimesheets.toString(), suffix: 'LOGS', accent: 'saffron', icon: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></> }
      ]
    }
  ];

  if (loading) return (
    <div className="portal-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="intelligence-pulse">SYNCING ACCOUNT TELEMETRY...</div>
    </div>
  );

  return (
    <div className="theater-container" style={{ paddingTop: 0, paddingBottom: 60 }}>
      {sections.map((section, sIdx) => (
        <div key={section.title} style={{ marginBottom: sIdx === sections.length - 1 ? 0 : 32 }}>
          <div className="firm-intel-tag" style={{ marginBottom: 12, fontSize: '0.55rem', opacity: 0.3, letterSpacing: '0.2em' }}>{section.title}</div>
          <div className="dashboard-grid">
            {section.cards.map(c => (
              <div key={c.label} className="portal-panel" style={{ padding: '32px 28px', position: 'relative', overflow: 'hidden' }}>
                <div className="firm-intel-tag" style={{ marginBottom: 20, fontSize: '0.5rem', opacity: 0.4 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    {c.icon}
                  </svg>
                  {c.label}
                </div>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: '2.8rem', fontWeight: 300, lineHeight: 0.9, color: 'white' }}>
                  {c.value}<span style={{ fontSize: '0.8rem', verticalAlign: 'top', opacity: 0.3, marginLeft: 8, fontWeight: 800 }}>{c.suffix}</span>
                </div>
                {/* Visual Accent */}
                <div style={{ 
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', 
                  background: c.accent === 'gold' ? 'var(--gold)' : c.accent === 'saffron' ? 'var(--saffron)' : 'rgba(255,255,255,0.05)',
                  opacity: 0.3
                }} />
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {/* Platform Utilities */}
      <div style={{ marginTop: 60, display: 'flex', justifyContent: 'center' }}>
        <div className="portal-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 60px', textAlign: 'center', maxWidth: 600 }}>
          <div style={{ color: 'var(--gold)', marginBottom: 24, opacity: 0.2 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
              <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
            </svg>
          </div>
          <div className="firm-intel-tag" style={{ marginBottom: 32, justifyContent: 'center', opacity: 0.3 }}>PLATFORM ENCRYPTED CACHE</div>
          <button
            className="btn-portal-primary"
            style={{ padding: '14px 32px', fontSize: '0.55rem' }}
            onClick={() => { 
              localStorage.clear(); 
              window.location.href = '/portal/'; 
            }}
          >
            PURGE ACCOUNT DATA
          </button>
        </div>
      </div>
    </div>
  );
};

/* ——— FORM FIELD ——— */
const FF = ({ label, children }: { label: string, children: ReactNode }) => (
  <div className="portal-form-group">
    <label className="portal-form-label">{label}</label>
    {children}
  </div>
);

/* ——— TIMESHEETS ——— */
const Timesheets = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [logs, setLogs] = useState<TimesheetEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Form State
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedRecordId, setSelectedRecordId] = useState('');
  const [hours, setHours] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [desc, setDesc] = useState('');

  const loadData = async () => {
    const [p, accs, recs, tlogs] = await Promise.all([
      mockApi.getProfile(),
      mockApi.getAccounts(),
      mockApi.getRecords(),
      mockApi.getTimesheets()
    ]);
    setProfile(p);
    setAccounts(accs);
    setRecords(recs);
    let filteredTlogs = tlogs;
    if (p.role === 'employee') {
      filteredTlogs = tlogs.filter(t => t.logged_by === p.full_name);
    } else if (p.role === 'client') {
      filteredTlogs = tlogs.filter(t => t.account_id === p.account_id);
    }
    setLogs(filteredTlogs);
  };

  useEffect(() => { loadData(); }, []);

  if (!profile) return null;
  if (profile.role === 'client') return <Navigate to="/dashboard/overview" replace />;

  const paginatedLogs = logs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const accountOptions = accounts.map(a => ({
    id: a.id,
    label: a.account_name,
    sublabel: a.cin_number || 'Account Entity'
  }));

  const filteredMandates = records.filter(r => r.account_id === selectedAccountId);
  
  const mandateOptions = filteredMandates.map(r => ({
    id: r.id,
    label: r.title,
    sublabel: r.request_number
  }));

  const handleEdit = (log: TimesheetEntry) => {
    setEditingId(log.id);
    setSelectedAccountId(log.account_id || '');
    setSelectedRecordId(log.record_id || '');
    setHours(log.hours.toString());
    setDate(log.date);
    setDesc(log.description);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isAdmin = profile.role === 'admin' || profile.role === 'staff';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedRecordId) return;
    setLoading(true);
    try {
      const account = accounts.find(a => a.id === selectedAccountId);
      const payload = {
        record_id: selectedRecordId,
        account_id: selectedAccountId,
        account_name: account?.account_name || 'N/A',
        hours: Number(hours),
        date,
        description: desc
      };

      if (editingId) {
        await mockApi.updateTimesheet(editingId, payload);
      } else {
        await mockApi.createTimesheet(payload);
      }

      setShowForm(false);
      setEditingId(null);
      setHours('');
      setDesc('');
      setSelectedRecordId('');
      setSelectedAccountId('');
      await loadData();
    } finally { setLoading(false); }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setHours('');
    setDesc('');
    setSelectedRecordId('');
    setSelectedAccountId('');
  };

  if (showForm) {
    return (
      <div className="portal-content">
        <div className="portal-page-header-row" style={{ justifyContent: 'flex-end', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            
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
                  onChange={(id) => { setSelectedAccountId(id); setSelectedRecordId(''); }}
                  placeholder="Search Account Name..."
                />
              </div>
              
              <div style={{ marginBottom: 24, opacity: selectedAccountId ? 1 : 0.4, pointerEvents: selectedAccountId ? 'auto' : 'none', transition: 'all 0.3s' }}>
                <SearchableSelect 
                  label="Associated Mandate"
                  options={mandateOptions}
                  value={selectedRecordId}
                  onChange={setSelectedRecordId}
                  placeholder={selectedAccountId ? "Select Project or ADV Record..." : "Select account first..."}
                />
              </div>

              <div className="portal-form-grid-2">
                <FF label="Hours Quantum">
                  <input required type="number" step="0.5" className="portal-form-control" value={hours} onChange={e => setHours(e.target.value)} placeholder="0.0" />
                </FF>
                <FF label="Activity Date">
                  <input required type="date" className="portal-form-control" value={date} onChange={e => setDate(e.target.value)} />
                </FF>
              </div>
              <FF label="Strategic Work performed">
                <textarea required className="portal-form-control" style={{ minHeight: 140 }} placeholder="Strategic context of the work performed..." value={desc} onChange={e => setDesc(e.target.value)} />
              </FF>
              <div className={editingId && isAdmin ? "portal-form-grid-2" : ""} style={{ marginTop: 16 }}>
                 
                 <button disabled={loading || !selectedRecordId} type="submit" className="btn-portal-primary w-full h-48">
                   {loading ? 'SYNCING...' : editingId ? 'Update Timesheet' : 'Create Timesheet'}
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
      {/* Batch actions removed for timesheets */}

      <div style={{ marginBottom: 40, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
        <div style={{ paddingBottom: 0, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {profile?.role === 'admin' && (
            <ExportDropdown data={logs} filename="Adveris_Timesheets" />
          )}
          <button onClick={() => setShowForm(true)} className="btn-portal-primary" style={{ width: 'auto' }}>
            LOG TIME
          </button>
        </div>
      </div>

      <div className="portal-panel" style={{ padding: 0, overflow: 'visible' }}>
        <div className="portal-table-wrap">
          <table className="portal-table-v2">
            <thead>
              <tr>
                <th style={{ width: 100, paddingLeft: 60 }}>Date</th>
                <th style={{ width: 140 }}>Created By</th>
                <th>Account Name</th>
                <th style={{ width: 150, whiteSpace: 'nowrap' }}>Request ID</th>
                <th style={{ textAlign: 'right', width: 90 }}>Hours</th>
                <th style={{ textAlign: 'right', width: 100, paddingRight: 60 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.length > 0 ? paginatedLogs.map(log => (
                <tr key={log.id} 
                  onClick={() => handleEdit(log)}
                  style={{ cursor: 'pointer' }}
                  className={selectedIds.includes(log.id) ? 'selected' : ''}
                >
                  <td data-label="Date" style={{ paddingLeft: 60 }}>{new Date(log.date || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                  <td data-label="Created By" style={{ color: 'white', fontSize: '0.85rem' }}>{log.logged_by || 'Admin'}</td>
                  <td data-label="Account Name" style={{ opacity: 0.6, fontSize: '0.85rem' }}>{log.account_name || 'Individual'}</td>
                  <td data-label="Request ID" style={{ whiteSpace: 'nowrap' }}><span className="portal-record-id">{(records.find(r => r.id === log.record_id)?.request_number) || 'ADV-000'}</span></td>
                  <td data-label="Hours" style={{ fontWeight: 600, color: 'white', textAlign: 'right' }}>{log.hours}h</td>
                  <td data-label="Actions" style={{ textAlign: 'right', paddingRight: 60 }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button onClick={() => handleEdit(log)} className="btn-portal-record-dots" title="Edit Log">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 60, opacity: 0.1 }}>No time logs detected.</td>
                </tr>
              )}
            </tbody>
          </table>
          
          <Pagination 
            currentPage={currentPage}
            totalItems={logs.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
          />
        </div>
      </div>
    </div>
  );
};

/* ——— EXPENSES ——— */
const Expenses = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
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
    const [p, accs, eEntries] = await Promise.all([
      mockApi.getProfile(),
      mockApi.getAccounts(),
      mockApi.getExpenses()
    ]);
    setProfile(p);
    setAccounts(accs);
    let filteredExpenses = eEntries;
    if (p.role === 'employee') {
      filteredExpenses = eEntries.filter(e => e.created_by_name === p.full_name);
    } else if (p.role === 'client') {
      filteredExpenses = eEntries.filter(e => e.account_id === p.account_id);
    }
    setEntries(filteredExpenses);
  };

  useEffect(() => { loadData(); }, []);

  if (!profile) return null;
  const isAdmin = profile.role === 'admin' || profile.role === 'staff';

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
    setDesc(entry.description);
    setUrl(entry.url || '');
    setCurrentStatus(entry.status || 'submitted');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBulkStatus = async (status: string, overrideIds?: string[]) => {
    setLoading(true);
    try {
      const idsToUpdate = overrideIds || selectedIds;
      await mockApi.bulkUpdateExpensesStatus(idsToUpdate, status);
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
      </AnimatePresence>

      <div style={{ marginBottom: 40, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
        <div style={{ paddingBottom: 0, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {profile?.role === 'admin' && (
            <ExportDropdown data={entries} filename="Adveris_Expenses" />
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
                  className={selectedIds.includes(e.id) ? 'row-selected' : ''}
                >
                  {profile?.role === 'admin' && (
                    <td onClick={e => e.stopPropagation()} style={{ paddingLeft: 60 }} data-label="Select">
                      <input 
                        type="checkbox" 
                        className="portal-checkbox"
                        checked={selectedIds.includes(e.id)}
                        onChange={() => handleSelectOne(e.id)}
                      />
                    </td>
                  )}
                  <td data-label="Date" style={{ paddingLeft: profile?.role === 'admin' ? 0 : 60 }}>{new Date(e.date || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                  <td data-label="Category">
                    <span className="portal-badge" style={{ background: 'rgba(255,153,51,0.05)', color: 'var(--saffron)', border: '1px solid rgba(255,153,51,0.15)', fontSize: '0.65rem' }}>
                      {e.category || 'Disbursement'}
                    </span>
                  </td>
                  <td data-label="Account" style={{ opacity: 0.6, fontSize: '0.85rem' }}>{e.account_name || 'Individual'}</td>
                  <td data-label="Proof">
                    {e.url ? (
                      <a href={e.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)', textDecoration: 'underline', fontSize: '0.75rem' }}>View Receipt</a>
                    ) : (
                      <span style={{ opacity: 0.2, fontSize: '0.7rem' }}>N/A</span>
                    )}
                  </td>
                  <td data-label="Amount" style={{ textAlign: 'right', fontWeight: 600, color: 'white' }}>{Number(e.amount).toLocaleString('en-IN')}</td>
                  <td data-label="Actions" style={{ textAlign: 'right', paddingRight: 60 }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button onClick={() => handleEdit(e)} className="btn-portal-record-dots" title="Edit Disbursement">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 60, opacity: 0.1 }}>No disbursement logs detected.</td>
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

/* ——— CLIENT OVERVIEW (for client role) ——— */
const ClientOverview = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    mockApi.getProfile().then(async p => {
      setProfile(p);
      const recs = await mockApi.getRecords();
      // Filter to only the client's own mandates
      setRecords(recs.filter((r: ServiceRecord) => r.account_id === p.account_id || r.submitted_by === p.id));
    });
  }, []);

  if (!profile) return null;

  return (
    <div className="theater-container" style={{ paddingTop: 80, paddingBottom: 150 }}>
      <div style={{ marginBottom: 40 }}>
        <div className="firm-intel-tag">
           <span className="tag-line" /> CLIENT PORTAL
        </div>
      </div>

      <div className="portal-panel" style={{ padding: 0, overflow: 'visible' }}>
        <div className="portal-panel-header" style={{ padding: '24px 40px', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
          <h2 className="serif-title" style={{ fontSize: '1.8rem' }}>Your <em>Mandates</em></h2>
        </div>
        <div className="portal-panel-body">
          {records.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>No mandates submitted yet.</p>
          ) : (
            records.map((r: ServiceRecord) => (
              <div 
                key={r.id} 
                onClick={() => navigate(`/dashboard/records/${r.id}`)}
                style={{ cursor: 'pointer', padding: '48px 60px', borderBottom: '1px solid rgba(255,255,255,0.015)', transition: 'all 0.8s var(--ease)' }}
                className="portal-list-item-elegant"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: 600 }}>{r.request_number} — {r.primary_service}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '0.7rem', padding: '3px 10px', borderRadius: 'var(--radius-pill)', background: 'rgba(255,153,51,0.15)', color: 'var(--saffron)', fontWeight: 700, textTransform: 'uppercase' }}>{r.status}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ opacity: 0.3 }}><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{r.description}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

/* ——— DASHBOARD ROOT ——— */
const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    mockApi.getProfile().then(setProfile);
  }, []);

  if (!profile) return null;

  const isClient = profile.role === 'client';

  return (
    <PortalLayout profile={profile}>
      <Routes>
        <Route path="/" element={<Navigate to={isClient ? "/dashboard/overview" : "/dashboard/overview"} replace />} />
        <Route path="overview" element={isClient ? <ClientOverview /> : <Overview />} />
        <Route path="new-request" element={<NewRequest />} />
        <Route path="records" element={<RecordsList />} />
        <Route path="records/:id" element={<MandateDetail />} />
        <Route path="records/:id/edit" element={<NewRequest />} />
        <Route path="records/:id/history" element={<HistoryRegistry />} />
        <Route path="timesheets" element={<Timesheets />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="service-hub" element={<AuditLogs />} />
        <Route path="crm" element={<CRMHub />} />
        <Route path="crm/accounts/:id" element={<AccountDetail />} />
        <Route path="crm/clients/new" element={<ClientForm />} />
        <Route path="crm/clients/:id" element={<ClientDetail />} />
        <Route path="crm/clients/:id/edit" element={<ClientForm />} />
        <Route path="*" element={
          <div className="portal-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.2)' }}>
              Module under development...
            </p>
          </div>
        } />
      </Routes>
    </PortalLayout>
  );
};

export default Dashboard;
