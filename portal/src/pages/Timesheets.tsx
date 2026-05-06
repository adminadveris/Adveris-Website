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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedRecordId, setSelectedRecordId] = useState('');
  const [hours, setHours] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [desc, setDesc] = useState('');
  const [timesheetNumber, setTimesheetNumber] = useState('');
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  // Weekly Grid State
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  });
  const [weeklyRows, setWeeklyRows] = useState<{
    accountId: string;
    recordId: string;
    days: Record<string, { hours: string; desc: string; id?: string; timesheet_number?: string }>;
  }[]>([]);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

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

  const filteredData = logs.filter(l => {
    return (l.timesheet_number + (l.logged_by || '') + (l.account_name || '') + (l.task_details || '')).toLowerCase().includes(searchQuery.toLowerCase());
  });

  const paginatedLogs = filteredData.slice(
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

  const handleWeeklySave = async () => {
    setLoading(true);
    setSubmitStatus(null);
    try {
      const promises = [];
      for (const row of weeklyRows) {
        if (!row.accountId) continue;
        const account = accounts.find(a => a.id === row.accountId);
        
        for (const [dateStr, dayData] of Object.entries(row.days)) {
          if (!dayData.hours || Number(dayData.hours) === 0) continue;
          
          const payload = {
            record_id: row.recordId || null,
            account_id: row.accountId,
            account_name: account?.account_name || 'Individual',
            hours: Number(dayData.hours),
            task_details: dayData.desc || 'Standard Professional Service',
            date: dateStr,
            status: 'submitted'
          };

          if (dayData.id) {
            promises.push(api.updateTimesheet(dayData.id, payload));
          } else {
            promises.push(api.createTimesheet(payload));
          }
        }
      }

      if (promises.length === 0) {
        alert("No hours detected to save. Please enter time for the week.");
        setLoading(false);
        return;
      }

      await Promise.all(promises);
      setSubmitStatus({ type: 'success', msg: "Weekly Timesheet Synchronized Successfully." });
      setTimeout(() => {
        setShowForm(false);
        setSubmitStatus(null);
        loadData();
      }, 2000);
    } catch (err: any) {
      console.error("WEEKLY_SAVE_ERROR:", err);
      setSubmitStatus({ type: 'error', msg: "Save Failed: " + (err.message || "Unknown Error") });
    } finally {
      setLoading(false);
    }
  };

  const initWeeklyGrid = () => {
    const weekStr = weekDays.map(d => d.toISOString().split('T')[0]);
    const weeklyLogs = logs.filter(l => weekStr.includes(l.date));
    
    // Group logs by account + mandate
    const grouped: Record<string, any> = {};
    weeklyLogs.forEach(l => {
      const key = `${l.account_id}-${l.record_id || 'none'}`;
      if (!grouped[key]) {
        grouped[key] = { accountId: l.account_id, recordId: l.record_id, days: {} };
      }
      grouped[key].days[l.date] = { hours: l.hours.toString(), desc: l.task_details, id: l.id, timesheet_number: l.timesheet_number };
    });

    const rows = Object.values(grouped);
    if (rows.length === 0) {
      rows.push({ accountId: '', recordId: '', days: {} });
    }
    setWeeklyRows(rows as any);
  };

  useEffect(() => {
    if (showForm) initWeeklyGrid();
  }, [showForm, weekStart]);

  const addWeeklyRow = () => {
    setWeeklyRows([...weeklyRows, { accountId: '', recordId: '', days: {} }]);
  };

  const updateWeeklyRow = (index: number, field: string, value: any) => {
    const newRows = [...weeklyRows];
    newRows[index] = { ...newRows[index], [field]: value };
    setWeeklyRows(newRows);
  };

  const updateWeeklyDay = (rowIndex: number, dateStr: string, field: 'hours' | 'desc', value: string) => {
    const newRows = [...weeklyRows];
    const dayData = newRows[rowIndex].days[dateStr] || { hours: '', desc: '' };
    newRows[rowIndex].days[dateStr] = { ...dayData, [field]: value };
    setWeeklyRows(newRows);
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
    const isFuture = (d: Date) => d > new Date();
    
    return (
      <div className="portal-content" style={{ maxWidth: '100vw', padding: '40px 60px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <button onClick={cancelForm} className="btn-portal-outline" style={{ padding: '10px 24px' }}>← Back to Ledger</button>
            <div style={{ height: 24, width: 1, background: 'rgba(255,255,255,0.1)' }} />
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'white', marginBottom: 4 }}>Weekly Timesheet Entry</h2>
              <p style={{ fontSize: '0.8rem', opacity: 0.4 }}>Week Starting Monday, {weekStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div className="portal-panel" style={{ display: 'flex', padding: 4, borderRadius: 10, gap: 4 }}>
               <button 
                 onClick={() => setWeekStart(new Date(weekStart.setDate(weekStart.getDate() - 7)))}
                 className="btn-portal-record-dots" style={{ width: 36, height: 36 }}
               >
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
               </button>
               <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--gold)' }}>
                 {weekStart.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} — {weekDays[6].toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
               </div>
               <button 
                 onClick={() => {
                   const next = new Date(weekStart);
                   next.setDate(next.getDate() + 7);
                   if (next <= new Date()) setWeekStart(next);
                 }}
                 disabled={new Date(new Date(weekStart).setDate(weekStart.getDate() + 7)) > new Date()}
                 className="btn-portal-record-dots" style={{ width: 36, height: 36, opacity: new Date(new Date(weekStart).setDate(weekStart.getDate() + 7)) > new Date() ? 0.2 : 1 }}
               >
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
               </button>
            </div>
            
            <button 
              onClick={handleWeeklySave}
              disabled={loading}
              className="btn-portal-primary" 
              style={{ padding: '12px 32px', minWidth: 160 }}
            >
              {loading ? 'Syncing...' : 'Save Weekly Ledger'}
            </button>
          </div>
        </div>

        {submitStatus && (
          <div style={{ 
            marginBottom: 24, 
            padding: '16px 24px', 
            borderRadius: 12, 
            background: submitStatus.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: submitStatus.type === 'success' ? '#22c55e' : '#ef4444',
            border: `1px solid ${submitStatus.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: '0.85rem'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
            {submitStatus.msg}
          </div>
        )}

        <div className="portal-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="portal-table-v2" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ width: '22%', paddingLeft: 40 }}>Project / Mandate</th>
                {weekDays.map((d, i) => (
                  <th key={i} style={{ textAlign: 'center', width: '10%' }}>
                    <div style={{ fontSize: '0.65rem', opacity: 0.4, textTransform: 'uppercase', marginBottom: 4 }}>{d.toLocaleDateString('en-IN', { weekday: 'short' })}</div>
                    <div style={{ fontSize: '0.85rem', color: d.toDateString() === new Date().toDateString() ? 'var(--gold)' : 'white' }}>{d.getDate()}</div>
                  </th>
                ))}
                <th style={{ width: '8%', textAlign: 'right', paddingRight: 40 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {weeklyRows.map((row, rowIndex) => {
                const total = weekDays.reduce((sum, d) => sum + (Number(row.days[d.toISOString().split('T')[0]]?.hours) || 0), 0);
                return (
                  <tr key={rowIndex} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '20px 20px 20px 40px', verticalAlign: 'top' }}>
                      <div style={{ marginBottom: 8 }}>
                        <SearchableSelect 
                          options={accountOptions}
                          value={row.accountId}
                          onChange={(id) => updateWeeklyRow(rowIndex, 'accountId', id)}
                          placeholder="Search Account..."
                          style={{ 
                            background: 'transparent', 
                            border: 'none', 
                            padding: 0, 
                            color: 'var(--gold)', 
                            fontWeight: 600, 
                            fontSize: '0.85rem' 
                          }}
                        />
                      </div>
                      <SearchableSelect 
                        options={records.filter(r => r.account_id === row.accountId).map(r => ({ id: r.id, label: r.title, sublabel: r.request_number }))}
                        value={row.recordId}
                        onChange={(id) => updateWeeklyRow(rowIndex, 'recordId', id)}
                        placeholder="Search Mandate..."
                        style={{ 
                          background: 'transparent', 
                          border: 'none', 
                          padding: 0, 
                          opacity: 0.4, 
                          fontSize: '0.75rem' 
                        }}
                      />
                    </td>
                    {weekDays.map((d, i) => {
                      const dateStr = d.toISOString().split('T')[0];
                      const dayData = row.days[dateStr] || { hours: '', desc: '' };
                      const isLocked = isFuture(d);
                      
                      return (
                        <td key={i} style={{ padding: 8, verticalAlign: 'top', background: d.toDateString() === new Date().toDateString() ? 'rgba(255,153,51,0.02)' : 'transparent' }}>
                          <input 
                            type="number"
                            step="0.5"
                            placeholder="0"
                            disabled={isLocked}
                            value={dayData.hours}
                            onChange={(e) => updateWeeklyDay(rowIndex, dateStr, 'hours', e.target.value)}
                            style={{ 
                              width: '100%', 
                              background: isLocked ? 'transparent' : 'rgba(255,255,255,0.03)', 
                              border: isLocked ? 'none' : '1px solid rgba(255,255,255,0.08)',
                              borderRadius: 6,
                              textAlign: 'center',
                              padding: '8px 4px',
                              color: 'white',
                              fontSize: '0.9rem',
                              fontWeight: 600,
                              opacity: isLocked ? 0.1 : 1
                            }}
                          />
                          {!isLocked && (
                            <textarea 
                              placeholder="Notes..."
                              value={dayData.desc}
                              onChange={(e) => updateWeeklyDay(rowIndex, dateStr, 'desc', e.target.value)}
                              style={{ 
                                width: '100%', 
                                background: 'transparent', 
                                border: 'none',
                                fontSize: '0.65rem',
                                color: 'white',
                                opacity: 0.3,
                                marginTop: 6,
                                resize: 'none',
                                height: 40,
                                textAlign: 'center'
                              }}
                            />
                          )}
                        </td>
                      );
                    })}
                    <td style={{ textAlign: 'right', paddingRight: 40, fontSize: '1rem', fontWeight: 700, color: 'white', opacity: 0.6 }}>
                      {total}h
                    </td>
                  </tr>
                );
              })}
              <tr>
                <td colSpan={9} style={{ padding: '16px 40px' }}>
                  <button 
                    onClick={addWeeklyRow}
                    style={{ 
                      background: 'none', 
                      border: '1px dashed rgba(255,255,255,0.1)', 
                      color: 'var(--gold)', 
                      padding: '8px 24px', 
                      borderRadius: 8, 
                      fontSize: '0.75rem', 
                      cursor: 'pointer' 
                    }}
                  >
                    + Add Mandate Row
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div style={{ marginTop: 40, textAlign: 'center', opacity: 0.2, fontSize: '0.7rem' }}>
          Restricted Governance Mode: Only current and past week logging permitted. Future dates are locked automatically.
        </div>
      </div>
    );
  }

  return (
    <div className="portal-content">
      <div style={{ marginBottom: 40, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flex: 1, maxWidth: 800 }}>
          <div style={{ position: 'relative', flex: 1 }}>
             <input 
               type="text" 
               placeholder="Search Time Logs (Ref, Staff, Account)..." 
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
        </div>

        <div style={{ paddingBottom: 0, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {user?.role === 'admin' && (
            <ExportDropdown data={filteredData} filename="Adveris_Timesheets" label="Export Logs" dateField="date" />
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
                <th style={{ width: 100, paddingLeft: 60, whiteSpace: 'nowrap' }}>Date</th>
                <th style={{ width: 140 }}>Created By</th>
                <th>Account Name</th>
                <th style={{ width: 120 }}>Time Reference</th>
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
                >
                  <td data-label="Date" style={{ paddingLeft: 60, whiteSpace: 'nowrap' }}>{new Date(log.date || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                  <td data-label="Created By" style={{ color: 'white', fontSize: '0.85rem' }}>{log.logged_by || 'Admin'}</td>
                  <td data-label="Account Name" style={{ opacity: 0.6, fontSize: '0.85rem' }}>{log.account_name || 'Individual'}</td>
                  <td data-label="Time Reference" style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '0.75rem' }}>{log.timesheet_number || 'Time Temp'}</td>
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
                  <td colSpan={6} style={{ textAlign: 'center', padding: 60, opacity: 0.1 }}>No Time Logs Detected.</td>
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

export default Timesheets;
