import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockApi } from '../lib/mockApi';

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
        fontSize: '1rem', // UNIFIED SIZE
        textTransform: 'none', 
        letterSpacing: 'normal',
        color: 'var(--gold)',
        fontWeight: 400,
        fontFamily: 'var(--font-sans)'
    }}>
       {label}
    </p>
    <div style={{ 
        fontSize: '1rem', // UNIFIED SIZE
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

  const [record, setRecord] = useState<any>(null);
  const [account, setAccount] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [, allRecs] = await Promise.all([mockApi.getProfile(), mockApi.getRecords()]);
    const rec = allRecs.find((r: any) => r.id === id);
    if (!rec) { navigate('/dashboard/records'); return; }

    const [acc, hist] = await Promise.all([
      mockApi.getAccountById(rec.account_id),
      mockApi.getHistoryByRecord(id!)
    ]);

    setRecord(rec);
    setAccount(acc);
    setHistory(hist);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return null;

  const status = STATUSES_MAP[record.status] || { label: record.status, color: 'var(--saffron)' };

  return (
    <div className="theater-container" style={{ paddingTop: 0, paddingBottom: 40, fontFamily: 'var(--font-sans)' }}>
      {/* HEADER: COMPACT NAVIGATION & ACTIONS */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            onClick={() => navigate('/dashboard/records')} 
            style={{ 
              background: 'none', border: 'none', color: 'white', 
              fontSize: '0.85rem', letterSpacing: 'normal', fontWeight: 600, 
              opacity: 0.3, cursor: 'pointer',
              transition: 'opacity 0.3s',
              fontFamily: 'var(--font-sans)'
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '0.3'}
          >
            ← Back
          </button>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <button 
              onClick={() => navigate(`/dashboard/records/${id}/edit`)} 
              className="btn-portal-primary"
              style={{ padding: '12px 28px', fontSize: '0.65rem' }}
            >
              Update Request
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: 40, marginTop: 0, alignItems: 'start' }}>
        
        {/* LEFT: INFORMATION LEDGER */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* SECTION 1: GENERAL INFORMATION */}
          <div className="portal-panel" style={{ padding: '32px', borderTop: '4px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ fontSize: '0.8rem', letterSpacing: '0.3rem', fontWeight: 800, color: 'white', marginBottom: 32, opacity: 0.4 }}>GENERAL INFORMATION</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 8 }}>
              <Field label="Request ID">{record.request_number}</Field>
              <Field label="Service Type" span>{record.primary_service || record.title}</Field>
            </div>

            {/* Sub-services handling */}
            {(record.sub_services || record.sub_service) && (
              <div style={{ marginBottom: 20 }}>
                <p className="portal-form-label" style={{ marginBottom: 12, opacity: 0.7, fontSize: '1rem', color: 'var(--gold)', fontFamily: 'var(--font-sans)' }}>Opted Sub-Services</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(Array.isArray(record.sub_services) ? record.sub_services : (record.sub_service?.split(',') || [])).map((s: string) => (
                    <span key={s} style={{ fontSize: '0.85rem', padding: '8px 16px', background: 'rgba(255,153,51,0.05)', borderRadius: 4, letterSpacing: '0.05em', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,153,51,0.1)', fontFamily: 'var(--font-sans)' }}>
                      {s.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <Field label="Additional Services" whisper>{record.description || 'None'}</Field>
              <Field label="Client Remarks" whisper>{record.client_comms || record.client_remarks || 'No remarks recorded'}</Field>
            </div>
          </div>

          {/* SECTION 2: SUPPORTING DOCUMENTATION */}
          {record.attached_file && (
            <div className="portal-panel" style={{ padding: '24px 32px', background: 'rgba(255,153,51,0.02)', borderLeft: '4px solid var(--gold)' }}>
              <h2 style={{ fontSize: '0.7rem', letterSpacing: '0.2rem', fontWeight: 800, color: 'var(--gold)', marginBottom: 20 }}>ATTACHMENT</h2>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '12px 20px', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                  <div>
                    <p style={{ color: 'white', fontSize: '1rem', fontWeight: 500, fontFamily: 'var(--font-sans)' }}>{record.attached_file.name}</p>
                    <p style={{ fontSize: '0.75rem', opacity: 0.3, fontFamily: 'var(--font-sans)' }}>{(record.attached_file.size / (1024 * 1024)).toFixed(2)} MB &mdash; {record.attached_file.type}</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = record.attached_file.url;
                    link.download = record.attached_file.name;
                    link.click();
                  }}
                  className="btn-batch btn-batch--approve"
                  style={{ padding: '8px 20px', height: 'auto', fontSize: '0.75rem' }}
                >
                  DOWNLOAD ASSET
                </button>
              </div>
            </div>
          )}

          {/* SECTION 3: ADMINISTRATIVE SECTION */}
          <div className="portal-panel" style={{ padding: '32px', borderTop: '4px solid rgba(255,153,51,0.2)' }}>
            <h2 style={{ fontSize: '0.8rem', letterSpacing: '0.3rem', fontWeight: 800, color: 'var(--gold)', marginBottom: 32 }}>ADMINISTRATIVE SECTION</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 8 }}>
              <Field label="Priority">{record.priority || 'Standard'}</Field>
              <Field label="Target Milestone Due">{record.due_date ? fmt(record.due_date) : 'Pending'}</Field>
              <Field label="Assigned To" span>{record.assigned_to || 'Partner Pending'}</Field>
            </div>

            <div style={{ padding: 20, background: 'rgba(255,153,51,0.03)', borderRadius: 8, marginBottom: 24, border: '1px solid rgba(255,153,51,0.08)' }}>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  <Field label="Approved Date">{record.approved_date ? fmt(record.approved_date) : 'Awaiting'}</Field>
                  <Field label="No of Days Left">{record.days_left || '-'}</Field>
                  <Field label="No of Hours Consumed" span>{record.hours_consumed || '0'}</Field>
               </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <Field label="Document Verification Status">
                  <span style={{ 
                    color: record.verification_status === 'Approved' ? '#22c55e' : (record.verification_status === 'Reject' ? '#ef4444' : 'var(--gold)'), 
                    fontWeight: 700, fontSize: '1rem', fontFamily: 'var(--font-sans)'
                  }}>
                    {record.verification_status || 'PENDING'}
                  </span>
              </Field>
              <Field label="Document Verification Remarks" whisper>{record.verification_remarks || 'None recorded'}</Field>
            </div>

            {record.internal_notes && (
               <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <Field label="Internal Notes" whisper>{record.internal_notes}</Field>
               </div>
            )}
          </div>

          <div className="portal-panel" style={{ padding: 32, background: 'rgba(255,153,51,0.01)', border: '1px solid rgba(255,153,51,0.05)' }}>
            <h3 style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.15em', opacity: 0.3, marginBottom: 24, color: 'var(--gold)' }}>SYSTEM INFORMATION</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px 48px' }}>
              <div>
                <p style={{ fontSize: '0.6rem', fontWeight: 700, opacity: 0.3, marginBottom: 8 }}>CREATED DATE</p>
                <p style={{ fontSize: '0.9rem', color: 'white', opacity: 0.6 }}>{record.created_at ? new Date(record.created_at).toLocaleString() : '—'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.6rem', fontWeight: 700, opacity: 0.3, marginBottom: 8 }}>CREATED BY</p>
                <p style={{ fontSize: '0.9rem', color: 'white', opacity: 0.6 }}>{record.created_by_name || 'System'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.6rem', fontWeight: 700, opacity: 0.3, marginBottom: 8 }}>LAST MODIFIED DATE</p>
                <p style={{ fontSize: '0.9rem', color: 'white', opacity: 0.6 }}>{record.updated_at ? new Date(record.updated_at).toLocaleString() : '—'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.6rem', fontWeight: 700, opacity: 0.3, marginBottom: 8 }}>LAST MODIFIED BY</p>
                <p style={{ fontSize: '0.9rem', color: 'white', opacity: 0.6 }}>{record.updated_by_name || 'System'}</p>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT: PERSISTENT REGISTRY SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          
          {/* CARD 1: ACCOUNT REGISTRY */}
          <div className="portal-panel" style={{ padding: 24, borderLeft: '4px solid var(--gold)' }}>
            <div className="firm-intel-tag" style={{ marginBottom: 16, opacity: 0.6, fontFamily: 'var(--font-sans)', fontSize: '0.7rem' }}>ACCOUNT REGISTRY</div>
            <div style={{ marginBottom: 24 }}>
               <p style={{ fontFamily: 'var(--font-sans)', fontSize: '1.2rem', color: 'white', lineHeight: 1.1, marginBottom: 6, fontWeight: 700 }}>{account?.account_name}</p>
               <p style={{ fontSize: '0.6rem', letterSpacing: '0.3em', color: 'var(--gold)', fontWeight: 800, fontFamily: 'var(--font-sans)' }}>AUTHORIZED REGISTRY OBJECT</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: 8 }}>
                  <span style={{ fontSize: '0.85rem', opacity: 0.7, fontWeight: 400, color: 'var(--gold)', fontFamily: 'var(--font-sans)' }}>PAN Identifier</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white', fontFamily: 'var(--font-sans)' }}>{record.pan_number || account?.pan_number}</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: 8 }}>
                  <span style={{ fontSize: '0.85rem', opacity: 0.7, fontWeight: 400, color: 'var(--gold)', fontFamily: 'var(--font-sans)' }}>Litigation Scan</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#22c55e', fontFamily: 'var(--font-sans)' }}>CLEAN</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: 8 }}>
                  <span style={{ fontSize: '0.85rem', opacity: 0.7, fontWeight: 400, color: 'var(--gold)', fontFamily: 'var(--font-sans)' }}>Record Type</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white', fontFamily: 'var(--font-sans)' }}>INSTITUTIONAL</span>
               </div>
            </div>
          </div>

          {/* CARD 2: STATUS TELEMETRY */}
          <div className="portal-panel" style={{ padding: 24 }}>
            <div className="firm-intel-tag" style={{ marginBottom: 16, opacity: 0.6, fontFamily: 'var(--font-sans)', fontSize: '0.7rem' }}>STATUS TELEMETRY</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', opacity: 0.7, fontWeight: 400, color: 'var(--gold)', fontFamily: 'var(--font-sans)' }}>MANDATE STATUS</span>
                <span style={{ 
                    fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.15em', 
                    color: status.color, background: `${status.color}10`, 
                    padding: '4px 12px', borderRadius: 4, border: '1px solid currentColor', fontFamily: 'var(--font-sans)' 
                }}>
                    {status.label.toUpperCase()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', opacity: 0.7, fontWeight: 400, color: 'var(--gold)', fontFamily: 'var(--font-sans)' }}>DAYS ACTIVE</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'white', fontFamily: 'var(--font-sans)' }}>
                   {Math.floor((new Date().getTime() - new Date(record.created_at).getTime()) / (1000 * 60 * 60 * 24))} Days
                </span>
              </div>
            </div>
          </div>

          {/* CARD 3: HISTORICAL PULSE */}
          <div className="portal-panel" style={{ padding: 24 }}>
            <div className="firm-intel-tag" style={{ marginBottom: 16, opacity: 0.6, fontFamily: 'var(--font-sans)', fontSize: '0.7rem' }}>HISTORICAL PULSE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {history.slice(0, 3).map(log => (
                <div key={log.id} style={{ borderLeft: '2px solid rgba(255,153,51,0.2)', paddingLeft: 12, paddingBottom: 4 }}>
                   <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white', fontFamily: 'var(--font-sans)' }}>{log.field_name?.toUpperCase() || 'DATA'} {log.action}</p>
                   <p style={{ fontSize: '0.75rem', opacity: 0.4, marginTop: 2, fontFamily: 'var(--font-sans)' }}>{fmt(log.created_at)}</p>
                </div>
              ))}
              <button 
                onClick={() => navigate(`/dashboard/records/${id}/history`)}
                style={{ 
                  width: '100%', padding: '10px 0', background: 'none', border: '1px solid rgba(255,255,255,0.05)', 
                  color: 'var(--gold)', fontSize: '0.65rem', fontWeight: 800, 
                  letterSpacing: '0.2em', cursor: 'pointer', borderRadius: 4,
                  transition: 'all 0.3s', marginTop: 8, fontFamily: 'var(--font-sans)'
                }}
              >
                VIEW FULL AUDIT
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MandateDetail;
