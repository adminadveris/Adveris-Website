import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Request, Account, AuditLog, RequestMessage } from '../types';

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

const fmtDateTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

const fmtTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';

const normalize = (value?: string) =>
  value ? value.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') : '-';

const DetailField = ({ label, value, span, muted }: { label: string; value?: React.ReactNode; span?: boolean; muted?: boolean }) => (
  <div className={`record-field ${span ? 'record-field--wide' : ''}`}>
    <div className="record-field__label">{label}</div>
    <div className={`record-field__value ${muted ? 'record-field__value--muted' : ''}`}>{value || '-'}</div>
  </div>
);

const statusMeta = (status?: string) => {
  if (status === 'rejected' || status === 'completed' || status === 'closed') {
    return { label: 'Closed', tone: 'danger' };
  }
  if (status === 'on_hold' || status === 'clarification_required') {
    return { label: 'On Hold', tone: 'warning' };
  }
  return { label: 'Active', tone: 'success' };
};

const roleBadgeStyle = (role: string) => {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    admin: { bg: 'rgba(255,153,51,0.12)', color: '#ff9933', label: 'Admin' },
    employee: { bg: 'rgba(96,165,250,0.12)', color: '#60a5fa', label: 'Staff' },
    client: { bg: 'rgba(74,222,128,0.12)', color: '#4ade80', label: 'Client' },
  };
  return styles[role] || { bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', label: role };
};

const MandateDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [request, setRequest] = useState<Request | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [history, setHistory] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- CHATTER STATE ---
  const [messages, setMessages] = useState<RequestMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatterError, setChatterError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleDownload = async (fileUrl: string, fileName: string) => {
    if (fileUrl.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    try {
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
      window.open(fileUrl, '_blank');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!id || !user) return;
      setLoading(true);
      setError(null);

      try {
        const allRecs = await api.getRecords();
        const rec = allRecs.find((r: Request) => r.id === id || r.id === `seed-mand-${id}`);

        if (!rec) {
          setError('Request not found.');
          return;
        }

        if (user.role === 'client' && rec.account_id !== user.account_id && rec.submitted_by !== user.id) {
          setError('Access denied for this request.');
          return;
        }

        const [acc, hist] = await Promise.all([
          api.getAccountById(rec.account_id),
          api.getHistoryByRecord(rec.id)
        ]);

        setRequest(rec);
        setAccount(acc);
        setHistory(hist);

        // Load chatter messages
        try {
          const msgs = await api.getRequestMessages(rec.id);
          setMessages(msgs);
        } catch (err) {
          console.warn('Chatter: Could not load messages (table may not exist yet)', err);
          setChatterError('Chatter unavailable — database table not configured yet.');
        }
      } catch (err: any) {
        console.error('MANDATE_DETAIL: Load failure', err);
        setError(err.message || 'Request could not be loaded.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, user]);

  // --- REALTIME SUBSCRIPTION FOR CHATTER ---
  useEffect(() => {
    if (!request?.id) return;

    const channel = supabase
      .channel(`chatter-${request.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'request_messages',
          filter: `request_id=eq.${request.id}`
        },
        (payload) => {
          setMessages(prev => {
            const newMsg = payload.new as RequestMessage;
            // Avoid duplicates
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [request?.id]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !request?.id || sendingMessage) return;

    setSendingMessage(true);
    try {
      const msg = await api.sendRequestMessage(request.id, newMessage.trim());
      // Optimistic add (realtime will also deliver it, but dedup handles this)
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
      setNewMessage('');
      setChatterError(null);
    } catch (err: any) {
      setChatterError(err.message || 'Failed to send message.');
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="record-empty-state">
        <div className="intelligence-pulse">Loading request record...</div>
      </div>
    );
  }

  if (!request || error) {
    return (
      <div className="record-empty-state">
        <h1 className="serif-title">Request unavailable</h1>
        <p>{error || 'The selected request could not be retrieved.'}</p>
        <button onClick={() => navigate('/dashboard/requests')} className="btn-portal-outline">Back to Requests</button>
      </div>
    );
  }

  const files: Array<{ name: string; size: number; type?: string; url: string; date: string }> = [];
  if (request.attached_files?.length) {
    request.attached_files.forEach(file => files.push({ ...file, date: request.updated_at || request.created_at }));
  }
  if (request.attached_file && !files.some(file => file.url === request.attached_file?.url)) {
    files.push({ ...request.attached_file, date: request.created_at });
  }

  const status = statusMeta(request.status);
  const daysActive = Math.max(0, Math.floor((new Date().getTime() - new Date(request.created_at).getTime()) / 86400000));

  return (
    <div className="enterprise-page record-detail-page">
      <div className="enterprise-toolbar">
        <div>
          <button onClick={() => navigate('/dashboard/requests')} className="enterprise-link-button">Back to Requests</button>
          <div className="enterprise-eyebrow">Request Record</div>
          <h1>{request.title || request.primary_service || 'Service Request'}</h1>
        </div>
        <div className="enterprise-toolbar__actions">
          <span className={`enterprise-status enterprise-status--${status.tone}`}>{status.label}</span>
          <button onClick={() => navigate(`/dashboard/requests/${id}/edit`)} className="btn-portal-primary">Update Request</button>
        </div>
      </div>

      <section className="record-summary-card">
        <DetailField label="Request ID" value={request.request_number} />
        <DetailField label="Account" value={account?.account_name || request.account_name || 'Individual Identity'} />
        <DetailField label="Service" value={request.primary_service || request.title} />
        <DetailField label="Created" value={fmtDate(request.created_at)} />
      </section>

      <div className="record-layout">
        <main className="record-main">
          <section className="portal-panel record-section">
            <div className="record-section__header">
              <h2>General Information</h2>
              <span>{request.request_number}</span>
            </div>
            <div className="record-field-grid">
              <DetailField label="Service Type" value={request.primary_service || request.title} />
              <DetailField label="Priority" value={request.priority || 'Standard'} />
              <DetailField label="Additional Services" value={request.description || 'None'} span muted />
              <DetailField label="Client Remarks" value={request.verification_remarks || 'No remarks recorded'} span muted />
            </div>
          </section>

          <section className="portal-panel record-section">
            <div className="record-section__header">
              <h2>Administrative Review</h2>
              <span>Governance</span>
            </div>
            <div className="record-field-grid">
              <DetailField label="Assigned To" value={request.assigned_user?.full_name || request.assigned_to || 'Partner pending'} />
              <DetailField
                label="Verification"
                value={<span className={`enterprise-status enterprise-status--${request.verification_status === 'Verified' ? 'success' : request.verification_status === 'Rejected' ? 'danger' : 'warning'}`}>{request.verification_status || 'Pending'}</span>}
              />
              <DetailField label="Verification Remarks" value={request.verification_remarks || 'None recorded'} span muted />
            </div>
          </section>

          {files.length > 0 && (
            <section className="portal-panel record-section">
              <div className="record-section__header">
                <h2>Documents</h2>
                <span>{files.length} file{files.length > 1 ? 's' : ''}</span>
              </div>
              <div className="record-file-list">
                {files.map((file, index) => (
                  <div key={`${file.url}-${index}`} className="record-file-row">
                    <div className="record-file-row__icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                        <polyline points="13 2 13 9 20 9" />
                      </svg>
                    </div>
                    <div>
                      <div className="record-file-row__name" title={file.name}>{file.name}</div>
                      <div className="record-file-row__meta">
                        {fmtDate(file.date)} · {file.size >= 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`}
                      </div>
                    </div>
                    <button onClick={() => handleDownload(file.url, file.name)} className="enterprise-icon-button" title={`Download ${file.name}`}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* === CHATTER / MESSAGES SECTION === */}
          <section className="portal-panel record-section" style={{ overflow: 'hidden' }}>
            <div className="record-section__header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                Chatter
              </h2>
              <span style={{ fontSize: '0.7rem', opacity: 0.4 }}>{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
            </div>

            {chatterError ? (
              <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>{chatterError}</p>
                <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.15)', marginTop: 8 }}>Run the SQL migration to enable chatter.</p>
              </div>
            ) : (
              <>
                {/* Messages List */}
                <div style={{ maxHeight: 400, overflowY: 'auto', padding: '16px 24px' }} className="custom-scrollbar">
                  {messages.length === 0 ? (
                    <div style={{ padding: '40px 0', textAlign: 'center' }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" style={{ margin: '0 auto 16px', display: 'block' }}>
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <p style={{ fontSize: '0.8rem', opacity: 0.15, fontStyle: 'italic' }}>No messages yet. Start a conversation.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {messages.map(msg => {
                        const isOwn = msg.sender_id === user?.id;
                        const badge = roleBadgeStyle(msg.sender_role);
                        return (
                          <div key={msg.id} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isOwn ? 'flex-end' : 'flex-start',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                              <div style={{
                                width: 28, height: 28, borderRadius: '50%',
                                background: isOwn ? 'var(--gold)' : 'rgba(255,255,255,0.08)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: isOwn ? 'var(--navy)' : 'white',
                                fontSize: '0.65rem', fontWeight: 700
                              }}>
                                {msg.sender_name?.charAt(0).toUpperCase()}
                              </div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'white' }}>{msg.sender_name}</span>
                              <span style={{
                                fontSize: '0.6rem', fontWeight: 700, padding: '2px 8px',
                                borderRadius: 100, background: badge.bg, color: badge.color,
                                textTransform: 'uppercase', letterSpacing: '0.05em'
                              }}>{badge.label}</span>
                              <span style={{ fontSize: '0.65rem', opacity: 0.3 }}>{fmtTime(msg.created_at)}</span>
                            </div>
                            <div style={{
                              maxWidth: '80%', padding: '12px 18px', borderRadius: 14,
                              background: isOwn ? 'rgba(255,153,51,0.08)' : 'rgba(255,255,255,0.03)',
                              border: `1px solid ${isOwn ? 'rgba(255,153,51,0.12)' : 'rgba(255,255,255,0.05)'}`,
                              borderTopLeftRadius: isOwn ? 14 : 4,
                              borderTopRightRadius: isOwn ? 4 : 14,
                            }}>
                              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                {msg.message}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatEndRef} />
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div style={{
                  padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex', gap: 12, alignItems: 'flex-end',
                  background: 'rgba(255,255,255,0.01)'
                }}>
                  <textarea
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                    rows={1}
                    style={{
                      flex: 1, resize: 'none', background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
                      padding: '12px 16px', color: 'white', fontSize: '0.85rem',
                      fontFamily: 'var(--font-ui)', minHeight: 44, maxHeight: 120,
                      transition: 'border-color 0.3s'
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(255,153,51,0.3)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    style={{
                      background: newMessage.trim() ? 'var(--saffron)' : 'rgba(255,255,255,0.05)',
                      border: 'none', borderRadius: 12, width: 44, height: 44,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                      transition: 'all 0.3s', flexShrink: 0
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={newMessage.trim() ? 'var(--navy)' : 'rgba(255,255,255,0.2)'} strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </section>
        </main>

        <aside className="record-side">
          <section className="portal-panel record-section">
            <div className="record-section__header">
              <h2>Account Registry</h2>
            </div>
            <div className="record-stack">
              <DetailField label="Account Name" value={account?.account_name || '-'} />
              <DetailField label="PAN Identifier" value={account?.pan_number || '-'} />
              {(user?.role === 'admin' || user?.role === 'employee') && (
                <DetailField label="Litigation Scan" value={account?.litigation_scan || 'Clean'} />
              )}
            </div>
          </section>

          <section className="portal-panel record-section">
            <div className="record-section__header">
              <h2>Record Facts</h2>
            </div>
            <div className="record-stack">
              <DetailField label="Days Active" value={`${daysActive} days`} />
              <DetailField label="Created By" value={request.created_by?.full_name || request.created_by_name || request.submitted_by_name || 'System'} />
              <DetailField label="Created Date" value={fmtDateTime(request.created_at)} />
              <DetailField label="Last Modified By" value={request.updated_by?.full_name || request.updated_by_name || 'System'} />
              <DetailField label="Last Modified Date" value={fmtDateTime(request.updated_at)} />
            </div>
          </section>

          <section className="portal-panel record-section">
            <div className="record-section__header">
              <h2>Recent History</h2>
              <button onClick={() => navigate(`/dashboard/requests/${id}/history`)} className="enterprise-link-button">View All</button>
            </div>
            <div className="record-history-list">
              {history.slice(0, 4).map(log => (
                <div key={log.id} className="record-history-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>{normalize(log.field_name || log.action)}</div>
                    <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{fmtDate(log.created_at)}</span>
                  </div>
                  <div style={{ fontSize: '0.65rem', opacity: 0.4, fontStyle: 'italic', marginTop: 2 }}>
                    by {log.changed_by_user?.full_name || log.changed_by_name || 'System'}
                  </div>
                </div>
              ))}
              {history.length === 0 && <div className="record-muted">No audit history yet.</div>}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default MandateDetail;
