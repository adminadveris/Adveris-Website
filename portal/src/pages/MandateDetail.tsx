import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { Request, Account, AuditLog } from '../types';

const STATUSES_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending Assessment', color: 'var(--saffron)' },
  approved: { label: 'Authorized', color: '#22c55e' },
  rejected: { label: 'Declined', color: '#ef4444' },
  clarification_required: { label: 'Clarification Req', color: '#a78bfa' },
  ongoing: { label: 'Operational', color: '#38bdf8' },
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

/* ── Field wrapper ── */
const Field = ({ label, children, span, whisper }: { label: string; children: React.ReactNode; span?: boolean, whisper?: boolean }) => (
  <div style={{ gridColumn: span ? '1 / -1' : undefined, marginBottom: 12 }}>
    <p className="portal-form-label" style={{
      marginBottom: 6,
      opacity: 0.7,
      fontSize: '1rem',
      textTransform: 'none',
      letterSpacing: 'normal',
      color: 'var(--gold)',
      fontWeight: 400,
      fontFamily: 'var(--font-sans)'
    }}>
      {label}
    </p>
    <div style={{
      fontSize: '1rem',
      color: 'white',
      lineHeight: 1.5,
      fontWeight: whisper ? 300 : 600,
      fontFamily: 'var(--font-sans)'
    }}>
      {children}
    </div>
  </div>
);

const MandateDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [request, setRequest] = useState<Request | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [history, setHistory] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async (fileUrl: string, fileName: string) => {
    if (fileUrl.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      try {
        // Fetch the file bytes, then create a local blob URL so the browser
        // saves with the original file name instead of the random storage path.
        const res = await fetch(fileUrl);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } catch {
        // Fallback: open in new tab
        window.open(fileUrl, '_blank');
      }
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!id || !user) return;
      setLoading(true);
      try {
        let allRecs = await api.getRecords();

        const rec = allRecs.find((r: Request) =>
          r.id === id || r.id === `seed-mand-${id}`
        );

        if (!rec) {
          setError("Request not found.");
          setLoading(false);
          return;
        }

        // Basic RBAC guard
        if (user.role === 'client' && rec.account_id !== user.account_id) {
          setError("Access strictly denied. Intelligence classification exceeds your clearance.");
          setLoading(false);
          return;
        }

        const [acc, hist] = await Promise.all([
          api.getAccountById(rec.account_id),
          api.getHistoryByRecord(rec.id)
        ]);

        setRequest(rec);
        setAccount(acc);
        setHistory(hist);
      } catch (err: any) {
        console.error("MANDATE_DETAIL: Load failure", err);
        setError(err.message || 'Operation failed.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, user]);

  if (loading) return (
    <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="intelligence-pulse">Retrieving Request Ledger...</div>
    </div>
  );

  if (!request) return (
    <div className="theater-container" style={{ textAlign: 'center', paddingTop: 100 }}>
      <h1 className="serif-title" style={{ fontSize: '2.5rem', opacity: 0.1, fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Request <em>Invalid</em></h1>
      <p style={{ opacity: 0.4, marginTop: 20 }}>The Requested Mandate ID "{id}" Could Not Be Retrieved From The Authorized Ledger.</p>
      <button onClick={() => navigate('/dashboard/requests')} className="btn-portal-outline" style={{ marginTop: 40 }}>Return To Requests</button>
    </div>
  );

  const status = (request.status === 'rejected' || request.status === 'closed')
    ? { label: 'Closed', color: '#ef4444' }
    : { label: 'Active', color: '#4ade80' };

  return (
    <div className="theater-container" style={{ paddingTop: 0, paddingBottom: 40, fontFamily: 'var(--font-sans)' }}>
      {/* HEADER: COMPACT NAVIGATION & ACTIONS */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 24 }}>
          <button
            onClick={() => navigate('/dashboard/requests')}
            style={{
              background: 'none', border: 'none', color: 'white',
              fontSize: '0.85rem', letterSpacing: 'normal', fontWeight: 600,
              opacity: 0.3, cursor: 'pointer',
              transition: 'opacity 0.3s',
              fontFamily: 'var(--font-sans)',
              padding: 0
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '0.3'}
          >
            ← Back
          </button>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <button
              onClick={() => navigate(`/dashboard/requests/${id}/edit`)}
              className="btn-portal-primary"
              style={{ padding: '12px 28px', fontSize: '0.65rem' }}
            >
              Update Request
            </button>
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 800px), 1fr))',
        gap: 32,
        marginTop: 0,
        alignItems: 'start'
      }}>

        {/* LEFT: INFORMATION LEDGER */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* SECTION 1: GENERAL INFORMATION */}
          <div className="portal-panel" style={{ padding: '32px', borderTop: '4px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white', marginBottom: 32, opacity: 0.4 }}>General Information</h2>

            <div className="portal-data-grid-2" style={{ marginBottom: 8 }}>
              <Field label="Request ID">{request.request_number}</Field>
              <Field label="Service Type" span>{request.primary_service || request.title}</Field>
            </div>

            <div className="portal-data-grid-2">
              <Field label="Additional Services" whisper>{request.description || 'None'}</Field>
              <Field label="Client Remarks" whisper>{request.verification_remarks || 'No Remarks Recorded'}</Field>
            </div>
          </div>

          {/* SECTION 3: ADMINISTRATIVE SECTION */}
          <div className="portal-panel" style={{ padding: '32px', borderTop: '4px solid rgba(255,153,51,0.2)' }}>
            <h2 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gold)', marginBottom: 32 }}>Administrative Section</h2>

            <div className="portal-data-grid-2" style={{ marginBottom: 8 }}>
              <Field label="Priority">{request.priority || 'Standard'}</Field>
              <Field label="Assigned To" span>{request.assigned_to || 'Partner Pending'}</Field>
            </div>

            <div className="portal-data-grid-2">
              <Field label="Verification Status">
                <span style={{
                  color: request.verification_status === 'Verified' ? '#22c55e' : (request.verification_status === 'Rejected' ? '#ef4444' : 'var(--gold)'),
                  fontWeight: 700, fontSize: '1rem', fontFamily: 'var(--font-sans)'
                }}>
                  {request.verification_status || 'Pending'}
                </span>
              </Field>
              <Field label="Verification Remarks" whisper>{request.verification_remarks || 'None Recorded'}</Field>
            </div>
          </div>



        </div>

        {/* RIGHT: PERSISTENT REGISTRY SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* CARD 1: ACCOUNT REGISTRY */}
          <div className="portal-panel" style={{ padding: 24, borderLeft: '4px solid var(--gold)' }}>
            <div className="firm-intel-tag" style={{ marginBottom: 16, opacity: 0.6, fontFamily: 'var(--font-sans)', fontSize: '0.75rem' }}>Account Registry</div>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '1.2rem', color: 'white', lineHeight: 1.1, marginBottom: 6, fontWeight: 700 }}>{account?.account_name}</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 600, fontFamily: 'var(--font-sans)' }}>Authorized Registry Object</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: 8 }}>
                <span style={{ fontSize: '0.85rem', opacity: 0.7, fontWeight: 400, color: 'var(--gold)', fontFamily: 'var(--font-sans)' }}>Pan Identifier</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white', fontFamily: 'var(--font-sans)' }}>{account?.pan_number || '—'}</span>
              </div>
              {(user?.role === 'admin' || user?.role === 'employee') && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: 8 }}>
                  <span style={{ fontSize: '0.85rem', opacity: 0.7, fontWeight: 400, color: 'var(--gold)', fontFamily: 'var(--font-sans)' }}>Litigation Scan</span>
                  <span style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: account?.litigation_scan === 'FLAGGED' || account?.litigation_scan === 'SEVERE' ? '#ef4444' : (account?.litigation_scan === 'PENDING' ? 'var(--gold)' : '#22c55e'),
                    fontFamily: 'var(--font-sans)'
                  }}>
                    {account?.litigation_scan || 'Clean'}
                  </span>
                </div>
              )}

            </div>
          </div>

          {/* CARD 2: STATUS TELEMETRY */}
          <div className="portal-panel" style={{ padding: 24 }}>
            <div className="firm-intel-tag" style={{ marginBottom: 16, opacity: 0.6, fontFamily: 'var(--font-sans)', fontSize: '0.75rem' }}>Status Telemetry</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', opacity: 0.7, fontWeight: 400, color: 'var(--gold)', fontFamily: 'var(--font-sans)' }}>Request Status</span>
                <span style={{
                  fontSize: '0.65rem', fontWeight: 600,
                  color: status.color, background: `${status.color}10`,
                  padding: '4px 12px', borderRadius: 4, border: '1px solid currentColor', fontFamily: 'var(--font-sans)'
                }}>
                  {status.label}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', opacity: 0.7, fontWeight: 400, color: 'var(--gold)', fontFamily: 'var(--font-sans)' }}>Days Active</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'white', fontFamily: 'var(--font-sans)' }}>
                  {Math.floor((new Date().getTime() - new Date(request.created_at).getTime()) / (1000 * 60 * 60 * 24))} Days
                </span>
              </div>
            </div>
          </div>
          <div className="portal-panel" style={{ padding: 32, background: 'rgba(255,153,51,0.01)', border: '1px solid rgba(255,153,51,0.05)' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.3, marginBottom: 24, color: 'var(--gold)' }}>System Information</h3>
            <div className="portal-data-grid-2">
              <div>
                <p style={{ fontSize: '0.65rem', fontWeight: 600, opacity: 0.3, marginBottom: 8 }}>Created Date</p>
                <p style={{ fontSize: '0.9rem', color: 'white', opacity: 0.6 }}>{request.created_at ? new Date(request.created_at).toLocaleString() : '—'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.65rem', fontWeight: 600, opacity: 0.3, marginBottom: 8 }}>Created By</p>
                <p style={{ fontSize: '0.9rem', color: 'white', opacity: 0.6 }}>{request.created_by_name || 'System'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.65rem', fontWeight: 600, opacity: 0.3, marginBottom: 8 }}>Last Modified Date</p>
                <p style={{ fontSize: '0.9rem', color: 'white', opacity: 0.6 }}>{request.updated_at ? new Date(request.updated_at).toLocaleString() : '—'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.65rem', fontWeight: 600, opacity: 0.3, marginBottom: 8 }}>Last Modified By</p>
                <p style={{ fontSize: '0.9rem', color: 'white', opacity: 0.6 }}>{request.updated_by_name || 'System'}</p>
              </div>
            </div>
          </div>

          {/* CARD 3: HISTORICAL PULSE */}
          <div className="portal-panel" style={{ padding: 24 }}>
            <div className="firm-intel-tag" style={{ marginBottom: 16, opacity: 0.6, fontFamily: 'var(--font-sans)', fontSize: '0.75rem' }}>Historical Pulse</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {history.slice(0, 3).map(log => (
                <div key={log.id} style={{ borderLeft: '2px solid rgba(255,153,51,0.2)', paddingLeft: 12, paddingBottom: 4 }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white', fontFamily: 'var(--font-sans)' }}>
                    {(log.field_name || 'Data').split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')} {log.action === 'CREATE' ? 'Created' : log.action === 'UPDATE' ? 'Updated' : log.action}
                  </p>
                  <p style={{ fontSize: '0.75rem', opacity: 0.4, marginTop: 2, fontFamily: 'var(--font-sans)' }}>{fmt(log.created_at)}</p>
                </div>
              ))}
              <button
                onClick={() => navigate(`/dashboard/requests/${id}/history`)}
                style={{
                  width: '100%', padding: '10px 0', background: 'none', border: '1px solid rgba(255,255,255,0.05)',
                  color: 'var(--gold)', fontSize: '0.75rem', fontWeight: 600,
                  cursor: 'pointer', borderRadius: 4,
                  transition: 'all 0.3s', marginTop: 8, fontFamily: 'var(--font-sans)'
                }}
              >
                View Full Audit
              </button>
            </div>
          </div>

          {/* CARD 4: EVIDENCE VAULT — TABLE LAYOUT */}
          {(request.attached_file || (request.attached_files && request.attached_files.length > 0)) && (() => {
            // Merge legacy single file + multi-file array into one deduplicated list
            const allFiles: Array<{ name: string; size: number; type?: string; url: string; date: string }> = [];

            if (request.attached_files?.length) {
              request.attached_files.forEach(f => allFiles.push({ ...f, date: request.updated_at || request.created_at }));
            }
            // Only add legacy file if it's not already in the array
            if (request.attached_file && !allFiles.some(f => f.url === request.attached_file?.url)) {
              allFiles.push({ ...request.attached_file, date: request.created_at });
            }

            if (!allFiles.length) return null;

            return (
              <div className="portal-panel" style={{ padding: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,153,51,0.2)' }}>
                <div className="firm-intel-tag" style={{ marginBottom: 20, opacity: 0.6, fontFamily: 'var(--font-sans)', fontSize: '0.75rem' }}
                >Evidence Vault
                  <span style={{ marginLeft: 8, background: 'rgba(255,153,51,0.15)', color: 'var(--gold)', borderRadius: 20, padding: '1px 8px', fontSize: '0.6rem', fontWeight: 700 }}>
                    {allFiles.length} File{allFiles.length > 1 ? 's' : ''}
                  </span>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem', fontFamily: 'var(--font-sans)' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--gold)', fontWeight: 600, opacity: 0.6, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>File Name</th>
                      <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--gold)', fontWeight: 600, opacity: 0.6, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>Upload Date</th>
                      <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--gold)', fontWeight: 600, opacity: 0.6, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Size</th>
                      <th style={{ textAlign: 'center', padding: '6px 8px', color: 'var(--gold)', fontWeight: 600, opacity: 0.6, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Download</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allFiles.map((file, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: idx < allFiles.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                          transition: 'background 0.2s'
                        }}
                        onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                        onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* File Name */}
                        <td style={{ padding: '10px 8px', maxWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              width: 26, height: 26, borderRadius: 4, flexShrink: 0,
                              background: 'rgba(255,153,51,0.1)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'var(--gold)'
                            }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                                <polyline points="13 2 13 9 20 9" />
                              </svg>
                            </div>
                            <span style={{
                              color: 'white', fontWeight: 500,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              display: 'block'
                            }} title={file.name}>
                              {file.name}
                            </span>
                          </div>
                        </td>

                        {/* Upload Date */}
                        <td style={{ padding: '10px 8px', whiteSpace: 'nowrap', opacity: 0.45, color: 'white' }}>
                          {file.date ? new Date(file.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                        </td>

                        {/* File Size */}
                        <td style={{ padding: '10px 8px', textAlign: 'right', whiteSpace: 'nowrap', opacity: 0.45, color: 'white' }}>
                          {file.size >= 1024 * 1024
                            ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
                            : `${(file.size / 1024).toFixed(0)} KB`}
                        </td>

                        {/* Download */}
                        <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleDownload(file.url, file.name)}
                            title={`Download ${file.name}`}
                            style={{
                              background: 'rgba(255,153,51,0.08)',
                              border: '1px solid rgba(255,153,51,0.2)',
                              borderRadius: 6,
                              color: 'var(--gold)',
                              cursor: 'pointer',
                              padding: '5px 10px',
                              fontSize: '0.6rem',
                              fontWeight: 700,
                              letterSpacing: '0.05em',
                              fontFamily: 'var(--font-sans)',
                              transition: 'all 0.2s',
                              whiteSpace: 'nowrap'
                            }}
                            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,153,51,0.18)'; e.currentTarget.style.borderColor = 'rgba(255,153,51,0.5)'; }}
                            onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,153,51,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,153,51,0.2)'; }}
                          >
                            ↓ Save
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}


        </div>
      </div>
    </div>
  );
};

export default MandateDetail;
