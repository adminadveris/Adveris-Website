import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { Request, Account, AuditLog } from '../types';

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

const fmtDateTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

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

        if (user.role === 'client' && rec.account_id !== user.account_id) {
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
      } catch (err: any) {
        console.error('MANDATE_DETAIL: Load failure', err);
        setError(err.message || 'Request could not be loaded.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, user]);

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
              <DetailField label="Assigned To" value={request.assigned_to || 'Partner pending'} />
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
              <DetailField label="Created By" value={request.created_by_name || request.submitted_by_name || 'System'} />
              <DetailField label="Created Date" value={fmtDateTime(request.created_at)} />
              <DetailField label="Last Modified By" value={request.updated_by_name || 'System'} />
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
                  <div>{normalize(log.field_name || log.action)}</div>
                  <span>{fmtDate(log.created_at)}</span>
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
