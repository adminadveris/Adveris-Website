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
const Field = ({ label, children, span, whisper, serif }: { label: string; children: React.ReactNode; span?: boolean, whisper?: boolean, serif?: boolean }) => (
  <div style={{ gridColumn: span ? '1 / -1' : undefined, marginBottom: 40 }}>
    <p className="firm-intel-tag" style={{ marginBottom: 14, opacity: 0.25, fontSize: '0.52rem' }}>
       {label}
    </p>
    <div style={{ 
        fontSize: serif ? '1.6rem' : (whisper ? '0.9rem' : '1.1rem'), 
        color: 'white', 
        lineHeight: 1.6, 
        fontWeight: whisper ? 200 : 300,
        fontFamily: serif ? 'var(--font-serif)' : 'var(--font-sans)'
    }}>
        {children}
    </div>
  </div>
);

const Section = ({ title, children, icon }: { title: string; children: React.ReactNode; icon?: React.ReactNode }) => (
  <div className="portal-panel" style={{ padding: 80, marginBottom: 60 }}>
    <div className="firm-intel-tag" style={{ marginBottom: 48, opacity: 0.5 }}>
       {icon && <span style={{ opacity: 0.6 }}>{icon}</span>}
       {title}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px 80px' }}>
      {children}
    </div>
  </div>
);

const MandateDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [record, setRecord] = useState<any>(null);
  const [account, setAccount] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [, allRecs] = await Promise.all([mockApi.getProfile(), mockApi.getRecords()]);
    const rec = allRecs.find((r: any) => r.id === id);
    if (!rec) { navigate('/dashboard/records'); return; }

    const [acc, clis, hist] = await Promise.all([
      mockApi.getAccountById(rec.account_id),
      mockApi.getClientsByAccount(rec.account_id),
      mockApi.getHistoryByRecord(id!)
    ]);

    setRecord(rec);
    setAccount(acc);
    setClients(clis);
    setHistory(hist);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return null;

  const status = STATUSES_MAP[record.status] || { label: record.status, color: 'var(--saffron)' };

  return (
    <div className="theater-container" style={{ paddingTop: 0, paddingBottom: 150 }}>
      {/* HEADER */}
      <div style={{ marginBottom: 100 }}>
        <button 
            onClick={() => navigate('/dashboard/records')} 
            style={{ 
                background: 'none', border: 'none', color: 'white', 
                fontSize: '0.6rem', letterSpacing: '0.4em', fontWeight: 800, 
                opacity: 0.2, marginBottom: 40, cursor: 'pointer',
                transition: 'opacity 0.3s'
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '0.2'}
        >
            ← RETURN TO REGISTRY
        </button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
                <div className="firm-intel-tag" style={{ marginBottom: 16 }}>
                    <span className="tag-line" /> {record.request_number} — {record.primary_service?.toUpperCase()}
                </div>
                <h1 className="serif-title" style={{ fontSize: '5rem', marginBottom: 12 }}>{record.title || record.primary_service}</h1>
                <p style={{ fontSize: '1.4rem', color: 'rgba(255,255,255,0.25)', fontWeight: 200, fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
                    {account?.account_name} — Institutional Mandate
                </p>
            </div>
            <div style={{ marginBottom: 12 }}>
                <span style={{ 
                    fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.4em', 
                    color: status.color, background: `${status.color}05`, 
                    padding: '16px 32px', border: `1px solid ${status.color}20` 
                }}>
                    {status.label.toUpperCase()}
                </span>
            </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '6.5fr 3.5fr', gap: 120, alignItems: 'start' }}>
        
        {/* LEFT: STRATEGIC BLUEPRINT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 60 }}>
          <Section title="Strategic Blueprint" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>}>
            <Field label="PRIMARY DOMAIN" span serif>
               {record.primary_service}
            </Field>
            
            <Field label="PRIORITY VECTOR">
                <span style={{ color: record.priority === 'Critical' ? 'var(--saffron)' : 'white' }}>{record.priority || 'Standard'}</span>
            </Field>
            <Field label="OPERATIONAL LEAD">
                <span style={{ fontStyle: 'italic', fontWeight: 200 }}>{record.assigned_to || 'Pending Partner Assignment'}</span>
            </Field>
            <Field label="TARGET MILESTONE">
                {record.due_date ? fmt(record.due_date) : 'Pending Assessment'}
            </Field>
            <Field label="INITIALIZED ON">
                {fmt(record.created_at)}
            </Field>

            <Field label="OPERATIONAL BRIEF" span whisper>
                <p style={{ opacity: 0.6, lineHeight: 2, fontSize: '1rem' }}>{record.description || 'No detailed brief recorded for this institutional mandate.'}</p>
            </Field>

            {record.client_comms && (
              <Field label="CLIENT COMMUNICATIONS CONTEXT" span whisper>
                <p style={{ opacity: 0.5, lineHeight: 2, fontSize: '0.95rem' }}>{record.client_comms}</p>
              </Field>
            )}

            {record.internal_notes && (
              <div style={{ gridColumn: '1 / -1', padding: 50, background: 'rgba(255,153,51,0.01)', border: '1px solid rgba(255,153,51,0.05)', borderRadius: 2 }}>
                <Field label="INTERNAL GOVERNANCE NOTES (CONFIDENTIAL)" span whisper>
                  <p style={{ opacity: 0.5, fontStyle: 'italic' }}>{record.internal_notes}</p>
                </Field>
              </div>
            )}
          </Section>

          <Section title="Institutional Audit Trail" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}>
             <div style={{ gridColumn: '1 / -1' }}>
                {history.length > 0 ? history.slice(0, 5).map(log => (
                  <div key={log.id} style={{ display: 'flex', gap: 24, padding: '40px 0', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 300, color: 'white' }}>{log.field_name?.toUpperCase()} {log.action}</span>
                        <span style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.2em', opacity: 0.15 }}>{fmt(log.created_at)}</span>
                      </div>
                      <p style={{ fontSize: '0.6rem', opacity: 0.25, marginTop: 12, letterSpacing: '0.3em' }}>PROCESSED BY {log.changed_by_name?.toUpperCase()}</p>
                    </div>
                  </div>
                )) : <p style={{ opacity: 0.1, fontSize: '1rem', fontStyle: 'italic', fontWeight: 200, padding: '40px 0' }}>No telemetry recorded for this mandate.</p>}
             </div>
          </Section>
        </div>

        {/* RIGHT: ACCOUNT & IDENTITY REGISTRY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 60 }}>
           <div className="portal-panel" style={{ padding: 60 }}>
              <div className="firm-intel-tag" style={{ marginBottom: 48, opacity: 0.4 }}>ENTITY ARCHIVE</div>
              
              <div style={{ marginBottom: 60 }}>
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: '2.4rem', color: 'white', lineHeight: 1.1, marginBottom: 12 }}>{account?.account_name}</p>
                  <p style={{ fontSize: '0.6rem', color: 'var(--gold)', fontWeight: 800, letterSpacing: '0.35em' }}>{account?.industry?.toUpperCase() || 'INSTITUTIONAL'}</p>
              </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 60 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: 16 }}>
                     <span style={{ fontSize: '0.55rem', letterSpacing: '0.2em', opacity: 0.3, fontWeight: 800 }}>PAN ID</span>
                     <span style={{ fontSize: '0.95rem', fontWeight: 300 }}>{account?.pan_number}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: 16 }}>
                     <span style={{ fontSize: '0.55rem', letterSpacing: '0.2em', opacity: 0.3, fontWeight: 800 }}>STATUS</span>
                     <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#22c55e' }}>VERIFIED</span>
                  </div>
               </div>

               <button onClick={() => navigate(`/dashboard/crm/accounts/${account?.id}`)} className="btn-portal-primary" style={{ width: '100%', padding: '16px 0', fontSize: '0.6rem' }}>OPEN ENTITY PROFILE</button>
           </div>

           <div className="portal-panel" style={{ padding: 60 }}>
              <div className="firm-intel-tag" style={{ marginBottom: 48, opacity: 0.4 }}>PRIMARY STAKEHOLDERS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                 {clients.map(cli => (
                   <div key={cli.id} 
                     onClick={() => navigate(`/dashboard/crm/clients/${cli.id}`)}
                     style={{ padding: 32, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.025)', borderRadius: 2, cursor: 'pointer', transition: 'all 0.6s var(--ease)' }}
                     className="stakeholder-card-hover"
                   >
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <p style={{ fontSize: '1.2rem', color: 'white', fontWeight: 300, fontFamily: 'var(--font-serif)' }}>{cli.client_name}</p>
                          <p style={{ fontSize: '0.65rem', letterSpacing: '0.15em', opacity: 0.3, marginTop: 8, textTransform: 'uppercase' }}>{cli.designation}</p>
                        </div>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.1, marginTop: 4 }}><polyline points="9 18 15 12 9 6"/></svg>
                     </div>
                   </div>
                 ))}
                 {clients.length === 0 && <p style={{ opacity: 0.1, fontSize: '0.9rem', textAlign: 'center', fontStyle: 'italic', padding: '40px 0' }}>No stakeholders indexed.</p>}
              </div>
           </div>

           <div className="portal-panel" style={{ padding: 60, background: 'rgba(255,255,255,0.005)', borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.05)' }}>
             <p style={{ fontSize: '0.8rem', opacity: 0.2, lineHeight: 2, fontWeight: 200 }}>
               This mandate is governed under the institutional framework for {account?.account_name}. Operational coordinates are automatically synchronized with the firm's global registry.
             </p>
           </div>
        </div>

      </div>
    </div>
  );
};

export default MandateDetail;
