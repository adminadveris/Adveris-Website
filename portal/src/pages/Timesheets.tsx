import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { Account, Request, TimesheetEntry } from '../types';
import Pagination from '../components/Pagination';
import SearchableSelect from '../components/SearchableSelect';
import ExportDropdown from '../components/ExportDropdown';

const FF = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="portal-form-group">
    <label className="portal-form-label">{label}</label>
    {children}
  </div>
);

const Timesheets = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [records, setRecords] = useState<Request[]>([]);
  const [logs, setLogs] = useState<TimesheetEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const getInputStyle = (field: string) => ({
    border: validationErrors.includes(field) ? '1px solid var(--saffron)' : '1.5px solid rgba(255,255,255,0.1)',
    transition: 'all 0.3s ease',
    boxShadow: validationErrors.includes(field) ? '0 0 0 3px rgba(255,153,51,0.08)' : 'none'
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Form State
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedRecordId, setSelectedRecordId] = useState('');
  const [hours, setHours] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [desc, setDesc] = useState('');
  const [timesheetNumber, setTimesheetNumber] = useState('');

  const loadData = async () => {
    if (!user) return;
    const [accs, recs, tlogs] = await Promise.all([
      api.getAccounts(),
      api.getRecords(),
      api.getTimesheets()
    ]);
    setAccounts(accs);
    setRecords(recs);
    let filteredTlogs = tlogs;
    if (user.role === 'employee') {
      filteredTlogs = tlogs.filter(t => t.logged_by === user.full_name);
    } else if (user.role === 'client') {
      filteredTlogs = tlogs.filter(t => t.account_id === user.account_id);
    }
    setLogs(filteredTlogs);
  };

  useEffect(() => { loadData(); }, [user]);

  if (!user) return null;
  if (user.role === 'client') return <Navigate to="/dashboard/overview" replace />;

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
    setDesc(log.task_details || '');
    setTimesheetNumber(log.timesheet_number || '');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isAdmin = user.role === 'admin' || user.role === 'employee';

  const handleSubmit = async (e: FormEvent) => {
    if (e) e.preventDefault();

    const errors: string[] = [];
    if (!selectedAccountId) errors.push('selectedAccountId');
    if (!hours) errors.push('hours');
    if (!date) errors.push('date');
    if (!desc) errors.push('desc');

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);
    setValidationErrors([]);
    try {
      const account = accounts.find(a => a.id === selectedAccountId);
      const payload = {
        record_id: selectedRecordId || null,
        account_id: selectedAccountId,
        account_name: account?.account_name || 'N/A',
        hours: Number(hours),
        date,
        task_details: desc
      };

      if (editingId) {
        await api.updateTimesheet(editingId, payload);
      } else {
        await api.createTimesheet(payload);
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
    setTimesheetNumber('');
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
          <div className="portal-panel scoping-width" style={{ padding: 48 }}>
            <form onSubmit={handleSubmit}>
              {editingId && (
                <div style={{ marginBottom: 24 }}>
                  <FF label="Timesheet Reference">
                    <input readOnly className="portal-form-control" style={{ opacity: 0.6, color: 'var(--gold)', fontWeight: 700 }} value={timesheetNumber} />
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
                  options={mandateOptions}
                  value={selectedRecordId}
                  error={validationErrors.includes('selectedRecordId')}
                  onChange={setSelectedRecordId}
                  placeholder={selectedAccountId ? "Select Project or ADV Request..." : "Select account first..."}
                />
              </div>

              <div className="portal-form-grid-2">
                <FF label="Hours">
                  <input required type="number" step="0.5" className="portal-form-control" style={getInputStyle('hours')} value={hours} onChange={e => setHours(e.target.value)} placeholder="0.0" />
                </FF>
                <FF label="Activity Date">
                  <input required type="date" className="portal-form-control" style={getInputStyle('date')} value={date} onChange={e => setDate(e.target.value)} />
                </FF>
              </div>
              <FF label="Activity Work performed">
                <textarea required className="portal-form-control" style={{ minHeight: 140, ...getInputStyle('desc') }} placeholder="Strategic context of the work performed..." value={desc} onChange={e => setDesc(e.target.value)} />
              </FF>
              <div className={editingId && isAdmin ? "portal-form-grid-2" : ""} style={{ marginTop: 16 }}>

                <button disabled={loading || !selectedAccountId} type="submit" className="btn-portal-primary w-full h-48">
                  {loading ? 'Syncing...' : editingId ? 'Update Timesheet' : 'Create Timesheet'}
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
      <div style={{ marginBottom: 40, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
        <div style={{ paddingBottom: 0, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {user?.role === 'admin' && (
            <ExportDropdown data={logs} filename="Adveris_Timesheets" label="Export Logs" dateField="date" />
          )}
          <button onClick={() => setShowForm(true)} className="btn-portal-primary" style={{ width: 'auto' }}>
            Log Time
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
                <th style={{ width: 120 }}>Time-Ref</th>
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
                  <td data-label="Time-Ref" style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '0.75rem' }}>{log.timesheet_number || 'Time-Temp'}</td>
                  <td data-label="Request ID" style={{ whiteSpace: 'nowrap' }}><span className="portal-record-id">{(records.find(r => r.id === log.record_id)?.request_number) || 'ADV-000'}</span></td>
                  <td data-label="Hours" style={{ fontWeight: 600, color: 'white', textAlign: 'right' }}>{log.hours}h</td>
                  <td data-label="Actions" style={{ textAlign: 'right', paddingRight: 60 }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button onClick={() => handleEdit(log)} className="btn-portal-record-dots" title="Edit Log">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
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

export default Timesheets;
