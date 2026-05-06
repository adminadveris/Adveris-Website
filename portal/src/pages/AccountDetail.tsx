import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type {
  Account, Client, Request,
  TimesheetEntry, ExpenseEntry, AuditLog
} from '../types';

/* ── Inline editable field ── */
const Field = ({
  label, value, editing, inputValue, onChange, mono, placeholder
}: {
  label: string;
  value: string | undefined | null;
  editing: boolean;
  inputValue: string;
  onChange: (v: string) => void;
  mono?: boolean;
  placeholder?: string;
}) => (
  <div>
    <p style={{ fontSize: '0.72rem', fontWeight: 500, opacity: 0.4, marginBottom: 8 }}>
      {label}
    </p>
    {editing ? (
      <input
        className={`portal-form-control ${mono ? 'font-mono' : ''}`}
        value={inputValue}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || '—'}
        style={{ fontSize: '0.95rem', padding: '8px 12px', height: 40 }}
      />
    ) : (
      <p className={mono ? 'font-mono' : ''} style={{ fontSize: '1rem', color: 'white', fontWeight: 500, minHeight: 28, lineHeight: '28px' }}>
        {value || <span style={{ opacity: 0.2 }}>—</span>}
      </p>
    )}
  </div>
);

const AccountDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [account, setAccount]   = useState<Account | null>(null);
  const [clients, setClients]   = useState<Client[]>([]);
  const [history, setHistory]   = useState<AuditLog[]>([]);
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>([]);
  const [expenses, setExpenses]   = useState<ExpenseEntry[]>([]);
  const [mandates, setMandates]   = useState<Request[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Edit mode state ──
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<Account>>({});

  const set = (key: keyof Account, val: string) =>
    setDraft(d => ({ ...d, [key]: val }));

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const [acc, clis, hist, allT, allE, allM] = await Promise.all([
      api.getAccountById(id),
      api.getClientsByAccount(id),
      api.getHistoryByRecord(id),
      api.getTimesheets(),
      api.getExpenses(),
      api.getRecords()
    ]);
    if (!acc) { navigate('/dashboard/crm'); return; }
    setAccount(acc);
    setClients(clis);
    setHistory(hist);
    setTimesheets(allT.filter((t: TimesheetEntry) => t.account_id === id));
    setExpenses(allE.filter((e: ExpenseEntry) => e.account_id === id));
    setMandates(allM.filter((m: Request) => m.account_id === id));
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const stats = useMemo(() => ({
    totalHours: timesheets.reduce((s, t) => s + (Number(t.hours) || 0), 0),
    totalExp:   expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0),
    mandateCount: mandates.length,
  }), [timesheets, expenses, mandates]);

  const startEdit = () => {
    if (!account) return;
    setDraft({ ...account });
    setSaveError(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setSaveError(null);
    setDraft({});
  };

  const saveEdit = async () => {
    if (!account?.id || !draft.account_name?.trim()) {
      setSaveError('Account Name Is Required.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await api.updateAccount(account.id, draft);
      setEditing(false);
      setDraft({});
      await load();
    } catch (err: any) {
      setSaveError(err.message || 'Save Failed. Please Try Again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !account) return (
    <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="portal-loader" />
    </div>
  );

  const d = draft as any;
  const a = account as any;

  return (
    <div className="portal-content">

      {/* ── Header ── */}
      <div className="portal-page-header-row">
        <div className="portal-page-header" style={{ border: 'none', padding: 0 }}>
          <button onClick={() => navigate('/dashboard/crm')} className="btn-portal-outline"
            style={{ padding: '6px 12px', fontSize: '0.65rem', marginBottom: 16, width: 'auto', textAlign: 'left' }}>
            ← Back To Hub
          </button>
          <h1 className="serif-title" style={{ fontSize: '2.2rem', marginBottom: 8, fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
            {editing ? (
              <input
                className="portal-form-control"
                value={d.account_name ?? ''}
                onChange={e => set('account_name', e.target.value)}
                style={{ fontSize: '1.8rem', fontFamily: 'var(--font-sans)', fontWeight: 600, height: 52, padding: '8px 16px' }}
              />
            ) : account.account_name}
          </h1>
          {!editing && (
            <div style={{ display: 'flex', gap: 20, marginTop: 4 }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--gold)', fontWeight: 600 }}>
                {account.industry}
              </span>
              <span style={{ fontSize: '0.9rem', opacity: 0.3 }}>
                ID: {account.id.split('-')[0].toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Action buttons — toggle between Edit / Save+Cancel */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {editing ? (
            <>
              <button onClick={cancelEdit} className="btn-portal-outline" style={{ width: 'auto', padding: '10px 24px', fontSize: '0.65rem' }}>
                Cancel
              </button>
              <button onClick={saveEdit} disabled={saving} className="btn-portal-primary" style={{ width: 'auto', padding: '10px 28px', fontSize: '0.65rem' }}>
                {saving ? 'Syncing...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <button onClick={startEdit} className="btn-portal-primary" style={{ width: 'auto' }}>
              Edit Account
            </button>
          )}
        </div>
      </div>

      {/* Save error banner */}
      {saveError && (
        <div style={{ margin: '0 0 20px', padding: '12px 20px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '0.82rem' }}>
          {saveError}
        </div>
      )}

      {/* ── Main Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 16, marginTop: 16, alignItems: 'start' }}>

        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Account Registry */}
          <div className="portal-panel" style={{ padding: 32, transition: 'border-color 0.3s', borderColor: editing ? 'rgba(255,153,51,0.2)' : undefined }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.3 }}>Account Registry</h3>
              {editing && <span style={{ fontSize: '0.65rem', color: 'var(--saffron)', opacity: 0.6 }}>● Edit Mode</span>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 48px' }}>
              <Field label="Registration (Cin/Llpin)" value={a.cin_number}  editing={editing} inputValue={d.cin_number  ?? ''} onChange={v => set('cin_number',  v)} mono />
              <Field label="Pan Number"               value={a.pan_number}  editing={editing} inputValue={d.pan_number  ?? ''} onChange={v => set('pan_number',  v.toUpperCase())} mono placeholder="ABCDE1234F" />
              <Field label="Gstin Number"             value={a.gstin_number} editing={editing} inputValue={d.gstin_number ?? ''} onChange={v => set('gstin_number', v.toUpperCase())} mono />
              <Field label="Industry / Sector"        value={a.industry}    editing={editing} inputValue={d.industry    ?? ''} onChange={v => set('industry',    v)} placeholder="E.g. Finance & Banking" />
            </div>
          </div>

          {/* Administrative Address */}
          <div className="portal-panel" style={{ padding: 32, transition: 'border-color 0.3s', borderColor: editing ? 'rgba(255,153,51,0.2)' : undefined }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.3, marginBottom: 24 }}>Administrative Address</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px 36px' }}>
              <Field label="House No"  value={a.house_no}  editing={editing} inputValue={d.house_no  ?? ''} onChange={v => set('house_no',  v)} />
              <Field label="Landmark"  value={a.landmark}  editing={editing} inputValue={d.landmark  ?? ''} onChange={v => set('landmark',  v)} />
              <Field label="Street 1"  value={a.street_1}  editing={editing} inputValue={d.street_1  ?? ''} onChange={v => set('street_1',  v)} />
              <Field label="Street 2"  value={a.street_2}  editing={editing} inputValue={d.street_2  ?? ''} onChange={v => set('street_2',  v)} />
              <Field label="Street 3"  value={a.street_3}  editing={editing} inputValue={d.street_3  ?? ''} onChange={v => set('street_3',  v)} />
              <Field label="City"      value={a.city}      editing={editing} inputValue={d.city      ?? ''} onChange={v => set('city',      v)} />
              <Field label="State"     value={a.state}     editing={editing} inputValue={d.state     ?? ''} onChange={v => set('state',     v)} />
              <Field label="Country"   value={a.country}   editing={editing} inputValue={d.country   ?? ''} onChange={v => set('country',   v)} />
              <Field label="Pincode"   value={a.pincode}   editing={editing} inputValue={d.pincode   ?? ''} onChange={v => set('pincode',   v)} mono />
            </div>
          </div>

          {/* System Info — always read-only */}
          <div className="portal-panel" style={{ padding: 32, background: 'rgba(255,153,51,0.01)', border: '1px solid rgba(255,153,51,0.05)' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.3, marginBottom: 24, color: 'var(--gold)' }}>System Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 48px' }}>
              {[
                ['Created Date', account.created_at ? new Date(account.created_at).toLocaleString() : '—'],
                ['Created By', account.created_by_name || 'System'],
                ['Last Modified', account.updated_at ? new Date(account.updated_at).toLocaleString() : '—'],
                ['Modified By', account.updated_by_name || 'System'],
              ].map(([label, val]) => (
                <div key={label}>
                  <p style={{ fontSize: '0.72rem', fontWeight: 500, opacity: 0.4, marginBottom: 8 }}>{label}</p>
                  <p style={{ fontSize: '1rem', color: 'white', opacity: 0.6 }}>{val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Modification Log */}
          <div className="portal-panel" style={{ padding: 32 }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.4, marginBottom: 24 }}>Modification Log</h3>
            {history.length === 0 ? (
              <p style={{ opacity: 0.2, fontSize: '0.8rem', fontStyle: 'italic' }}>No Modifications Recorded Yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {history.slice(0, 6).map(log => (
                  <div key={log.id} style={{ padding: '14px 16px', background: 'rgba(255,153,51,0.03)', border: '1px solid rgba(255,153,51,0.05)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'white' }}>{log.action === 'CREATE' ? 'Created' : log.action === 'UPDATE' ? 'Updated' : log.action}</span>
                      <span style={{ fontSize: '0.65rem', opacity: 0.4 }}>{new Date(log.created_at).toLocaleDateString()}</span>
                    </div>
                    {log.old_value && (
                      <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>
                        <span style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '2px 6px', borderRadius: 4, marginRight: 8 }}>Prev: {log.old_value}</span>
                        <span style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', padding: '2px 6px', borderRadius: 4 }}>New: {log.new_value}</span>
                      </p>
                    )}
                    <p style={{ fontSize: '0.7rem', opacity: 0.35, fontStyle: 'italic', marginTop: 4 }}>by {log.changed_by_name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN — read-only stats + clients */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Stakeholders */}
          <div className="portal-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.4 }}>Related Stakeholders</h3>
              <button
                onClick={() => navigate(`/dashboard/crm/clients/new?account_id=${account.id}`)}
                className="btn-portal-primary"
                style={{ padding: '6px 14px', fontSize: '0.65rem', width: 'auto' }}
              >
                + Add
              </button>
            </div>
            <div style={{ padding: 8 }}>
              {clients.length > 0 ? clients.map(cli => (
                <div
                  key={cli.id}
                  onClick={() => navigate(`/dashboard/crm/clients/${cli.id}`)}
                  style={{ padding: '18px 24px', borderRadius: 10, cursor: 'pointer' }}
                  className="portal-list-item-elegant"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ color: 'white', fontWeight: 600, fontSize: '0.88rem' }}>{cli.client_name}</p>
                      <p style={{ fontSize: '0.72rem', opacity: 0.4, marginTop: 2 }}>{cli.designation || 'Representative'}</p>
                    </div>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ opacity: 0.2 }}>
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>
              )) : (
                <div style={{ padding: 40, textAlign: 'center', opacity: 0.25 }}>
                  <p style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>No Stakeholders Linked Yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Stat cards */}
          <div className="portal-panel" style={{ padding: 24, borderLeft: '3px solid var(--gold)' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 500, opacity: 0.4 }}>Total Professional Hours</p>
            <h2 className="serif-title" style={{ fontSize: '1.8rem', marginTop: 8, color: 'white', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
              {stats.totalHours}<em style={{ fontSize: '0.8rem', marginLeft: 6, opacity: 0.3 }}>Hrs</em>
            </h2>
          </div>
          <div className="portal-panel" style={{ padding: 24, borderLeft: '3px solid #10b981' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 500, opacity: 0.4 }}>Amount Disbursed</p>
            <h2 className="serif-title" style={{ fontSize: '1.8rem', marginTop: 8, color: 'white', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
              <em style={{ fontSize: '0.8rem', marginRight: 6, opacity: 0.3 }}>₹</em>{stats.totalExp.toLocaleString('en-IN')}
            </h2>
          </div>
          <div className="portal-panel" style={{ padding: 24, borderLeft: '3px solid var(--saffron)' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 500, opacity: 0.4 }}>Active Mandates</p>
            <h2 className="serif-title" style={{ fontSize: '1.8rem', marginTop: 8, color: 'white', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
              {stats.mandateCount}<em style={{ fontSize: '0.8rem', marginLeft: 6, opacity: 0.3 }}>Records</em>
            </h2>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AccountDetail;
