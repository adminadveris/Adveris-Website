import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import Pagination from '../components/Pagination';
import type { Request, AuditLog } from '../types';

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

const HistoryRegistry = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<Request | null>(null);
  const [history, setHistory] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setLoading(true);
      const [recs, hist] = await Promise.all([
        api.getRecords(),
        api.getHistoryByRecord(id)
      ]);
      const rec = recs.find((r: Request) => r.id === id);
      if (!rec) { navigate('/dashboard/requests'); return; }
      
      setRequest(rec);
      setHistory(hist);
      setLoading(false);
    };
    loadData();
  }, [id, navigate]);

  const paginatedHistory = history.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (loading || !request) return (
    <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="portal-loader" />
    </div>
  );

  return (
    <div className="theater-container" style={{ paddingTop: 0, paddingBottom: 100, fontFamily: 'var(--font-sans)' }}>
      {/* HEADER: COMPACT & ELEGANT */}
      <div style={{ marginBottom: 32 }}>
        <button 
            onClick={() => navigate(`/dashboard/requests/${id}`)} 
            style={{ 
                background: 'none', border: 'none', color: 'white', 
                fontSize: '0.75rem', fontWeight: 600, 
                opacity: 0.3, marginBottom: 16, cursor: 'pointer',
                transition: 'opacity 0.3s',
                fontFamily: 'var(--font-sans)'
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '0.3'}
        >
            ← Back
        </button>
        
        <h1 style={{ fontSize: '2.4rem', color: 'white', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4, fontFamily: 'var(--font-sans)' }}>
           Account History
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.4)', fontWeight: 300, fontFamily: 'var(--font-sans)' }}>
            {request.request_number} — <span style={{ color: 'var(--gold)', fontWeight: 500 }}>{request.title || request.primary_service}</span>
        </p>
      </div>

      {/* REGISTRY TABLE: HIGH DENSITY */}
      <div className="portal-panel" style={{ padding: 0 }}>
        <div className="portal-table-wrap">
          <table className="portal-table-v2">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ width: 160, fontSize: '0.75rem' }}>Timestamp</th>
                <th style={{ width: 120, fontSize: '0.75rem' }}>Action</th>
                <th style={{ fontSize: '0.75rem' }}>Event Type</th>
                <th style={{ fontSize: '0.75rem' }}>Previous State</th>
                <th style={{ fontSize: '0.75rem' }}>Refined State</th>
                <th style={{ textAlign: 'right', fontSize: '0.75rem' }}>Executed By</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: '0.85rem' }}>
               {paginatedHistory.map(log => (
                <tr key={log.id}>
                  <td style={{ opacity: 0.4, fontWeight: 300 }}>{fmt(log.created_at)}</td>
                  <td>
                    <span style={{ 
                      fontSize: '0.65rem', fontWeight: 600,
                      color: log.action === 'CREATE' ? '#22c55e' : 'var(--gold)',
                      background: log.action === 'CREATE' ? 'rgba(34,197,94,0.05)' : 'rgba(255,153,51,0.05)',
                      padding: '4px 10px', borderRadius: 4, border: '1px solid currentColor',
                      display: 'inline-block'
                    }}>
                      {log.action === 'CREATE' ? 'Created' : log.action === 'UPDATE' ? 'Updated' : log.action}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500, color: 'white' }}>
                    {(log.field_name || '').split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                  </td>
                  <td style={{ opacity: 0.3, fontStyle: 'italic' }}>{log.old_value ||'—'}</td>
                  <td style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{log.new_value || '—'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 500, opacity: 0.5, color: 'var(--gold)' }}>{log.changed_by_name}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 80, opacity: 0.1, fontStyle: 'italic' }}>No Audit Telemetry Indexed For This Request.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination 
          currentPage={currentPage}
          totalItems={history.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
        />
      </div>
    </div>
  );
};

export default HistoryRegistry;
