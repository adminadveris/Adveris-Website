import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import NewRequest from './NewRequest';
import RecordsList from './RecordsList';
import AuditLogs from './AuditLogs';
import { mockApi } from '../lib/mockApi';

/* ——— SHARED ICON COMPONENT ——— */
const Ico = ({ d, viewBox = "0 0 24 24", size = 20 }: { d: string | JSX.Element, viewBox?: string, size?: number }) => (
  <svg width={size} height={size} viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);

/* ——— OVERVIEW ——— */
const Overview = () => {
  const [stats, setStats] = useState({ records: 0, hours: 128.5 });
  useEffect(() => {
    mockApi.getRecords().then(recs => setStats(prev => ({ ...prev, records: recs.length })));
  }, []);

  const statCards = [
    { label: 'Active Mandates', value: stats.records.toString().padStart(2, '0'), accent: 'saffron', icon: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></> },
    { label: 'Billable Hours (MTD)', value: stats.hours.toString(), accent: 'gold', icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> },
    { label: 'Pending Approvals', value: '00', accent: 'dim', icon: <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></> },
  ];

  return (
    <div className="portal-content">
      {/* Page Header */}
      <div className="portal-page-header">
        <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--saffron)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 20, height: 1.5, background: 'var(--saffron)', display: 'inline-block' }} />
          Adveris Advisors LLP
        </div>
        <h1>Intelligence <em>Hub</em></h1>
        <p style={{ marginTop: 12, fontSize: '1rem', color: 'rgba(255,255,255,0.5)', fontWeight: 300, maxWidth: 520 }}>
          Your firm-wide operational command centre for mandates, time tracking, and strategic intelligence.
        </p>
      </div>

      {/* Stats */}
      <div className="portal-stats-grid">
        {statCards.map(c => (
          <div key={c.label} className={`portal-stat-card portal-stat-card--${c.accent}`}>
            <div className="portal-stat-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {c.icon}
              </svg>
              {c.label}
            </div>
            <div className="portal-stat-value">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        {/* Recent Activity */}
        <div className="portal-panel">
          <div className="portal-panel-header">
            <h2>Recent Activity</h2>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--saffron)" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <div className="portal-panel-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, textAlign: 'center' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" style={{ marginBottom: 20 }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic', maxWidth: 300 }}>
              Connect the Audit Hub to synchronize live firm operations.
            </p>
          </div>
        </div>

        {/* Dev Tools */}
        <div className="portal-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 28px', textAlign: 'center' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,153,51,0.3)" strokeWidth="1.5" style={{ marginBottom: 16 }}>
            <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
          </svg>
          <p style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--saffron)', marginBottom: 20, opacity: 0.5 }}>
            Local Environment
          </p>
          <button
            className="btn-portal-outline"
            onClick={() => mockApi.resetDatabase()}
            style={{ fontSize: '0.7rem' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.69"/>
            </svg>
            Clear Local Memory
          </button>
        </div>
      </div>
    </div>
  );
};

/* ——— FORM FIELD ——— */
const FF = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="portal-form-group">
    <label className="portal-form-label">{label}</label>
    {children}
  </div>
);

/* ——— TIMESHEETS ——— */
const Timesheets = () => {
  const [records, setRecords] = useState<any[]>([]);
  useEffect(() => { mockApi.getRecords().then(setRecords); }, []);

  return (
    <div className="portal-content">
      <div className="portal-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-sm)', background: 'var(--saffron-pale)', border: '1px solid var(--saffron-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--saffron)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div>
            <h1>Time <em>Tracking</em></h1>
          </div>
        </div>
        <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)', fontWeight: 300 }}>Log professional billable hours against active mandates.</p>
      </div>

      <div className="portal-panel">
        <div className="portal-panel-header">
          <h2>New Time Entry</h2>
        </div>
        <div className="portal-panel-body">
          <form>
            <div className="portal-form-grid-2">
              <FF label="Date">
                <input type="date" className="portal-form-control" />
              </FF>
              <FF label="Related Project">
                <select className="portal-form-control">
                  <option>Select Active Record...</option>
                  {records.map(r => <option key={r.id}>{r.request_number} — {r.title}</option>)}
                </select>
              </FF>
              <FF label="Hours Spent">
                <input type="number" step="0.5" placeholder="e.g. 4.5" className="portal-form-control" />
              </FF>
            </div>
            <FF label="Task Description">
              <textarea className="portal-form-control" placeholder="Describe the professional work performed in detail..." />
            </FF>
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 12 }}>
              <button className="btn-portal-saffron">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                Log Entry
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

/* ——— EXPENSES ——— */
const Expenses = () => {
  const [records, setRecords] = useState<any[]>([]);
  useEffect(() => { mockApi.getRecords().then(setRecords); }, []);

  return (
    <div className="portal-content">
      <div className="portal-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-sm)', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <h1>Expense <em>Management</em></h1>
        </div>
        <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)', fontWeight: 300 }}>Record client disbursements and manage invoice documentation.</p>
      </div>

      <div className="portal-panel">
        <div className="portal-panel-header">
          <h2>Submit Disbursement</h2>
        </div>
        <div className="portal-panel-body">
          <form>
            <div className="portal-form-grid-2">
              <FF label="Invoice Date"><input type="date" className="portal-form-control" /></FF>
              <FF label="Billed Project">
                <select className="portal-form-control">
                  <option>Select Project...</option>
                  {records.map(r => <option key={r.id}>{r.request_number} — {r.title}</option>)}
                </select>
              </FF>
              <FF label="Quantum (INR)"><input type="number" placeholder="0.00" className="portal-form-control" /></FF>
              <FF label="Disbursement Type">
                <select className="portal-form-control">
                  <option>Select Category...</option>
                  <option>Regulatory Filing Fee</option>
                  <option>Travel & Logistics</option>
                  <option>Statutory Levy</option>
                  <option>Professional Fee</option>
                </select>
              </FF>
              <FF label="Artifact URL (Drive)">
                <input type="url" placeholder="Secure link to scanned receipt..." className="portal-form-control" />
              </FF>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 12 }}>
              <button className="btn-portal-saffron">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Certify Expense
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

/* ——— DASHBOARD ROOT ——— */
const Dashboard = () => {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    mockApi.getProfile().then(setProfile);
  }, []);

  if (!profile) return null;

  return (
    <div className="portal-root">
      <Sidebar role={profile.role} />
      <main className="portal-main">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="new-request" element={<NewRequest />} />
          <Route path="records" element={<RecordsList />} />
          <Route path="timesheets" element={<Timesheets />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="service-hub" element={<AuditLogs />} />
          <Route path="*" element={
            <div className="portal-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.2)' }}>
                Module under development...
              </p>
            </div>
          } />
        </Routes>
      </main>
    </div>
  );
};

export default Dashboard;
