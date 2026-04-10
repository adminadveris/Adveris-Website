import { useEffect, useState } from 'react';
import { mockApi } from '../lib/mockApi';

const RecordsList = () => {
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    mockApi.getRecords().then(setRecords);
  }, []);

  return (
    <div className="portal-content-wide">
      {/* Header */}
      <div className="portal-page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-sm)', background: 'var(--saffron-pale)', border: '1px solid var(--saffron-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--saffron)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <h1>Service <em>Portfolio</em></h1>
            </div>
            <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)', fontWeight: 300 }}>
              Manage and track all active firm mandates.
            </p>
          </div>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search ADV-ID or mandate..."
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1.5px solid rgba(255,255,255,0.08)',
                borderRadius: 'var(--radius-sm)',
                padding: '11px 18px 11px 40px',
                color: 'white',
                fontSize: '0.88rem',
                outline: 'none',
                width: 280,
                fontFamily: 'var(--font-sans)',
                transition: 'border-color 0.3s ease'
              }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="portal-panel">
        <div className="portal-table-wrap">
          <table className="portal-table">
            <thead>
              <tr>
                <th>Record ID</th>
                <th>Client Mandate</th>
                <th>Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.length > 0 ? records.map(record => (
                <tr key={record.id}>
                  <td>
                    <span className="portal-record-id">{record.request_number}</span>
                  </td>
                  <td>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', color: 'white', marginBottom: 4 }}>
                      {record.primary_service}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
                      {record.opted_sub_services?.slice(0, 2).join(' · ')}{record.opted_sub_services?.length > 2 ? ' ...' : ''}
                    </div>
                  </td>
                  <td style={{ fontWeight: 400, color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
                    {new Date(record.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <span className="portal-badge portal-badge--pending portal-badge--dot">
                      {record.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button style={{
                      fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer',
                      transition: 'color 0.2s ease', display: 'inline-flex', alignItems: 'center', gap: 6
                    }}>
                      View Details
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '80px 24px' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" style={{ margin: '0 auto 20px', display: 'block' }}>
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                    <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'rgba(255,255,255,0.2)', fontSize: '1.1rem' }}>
                      No records found. Start by creating a New Request.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RecordsList;
