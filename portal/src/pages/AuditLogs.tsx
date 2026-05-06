import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import Pagination from '../components/Pagination';
import ExportDropdown from '../components/ExportDropdown';
import type { UIHistoryItem } from '../types';

const actionStyles: Record<string, { color: string; bg: string; border: string }> = {
  CREATE_RECORD: { color: 'var(--saffron)', bg: 'var(--saffron-pale)', border: 'var(--saffron-border)' },
  UPDATE_RECORD: { color: 'var(--saffron)', bg: 'rgba(255,153,51,0.05)', border: 'rgba(255,153,51,0.2)' },
  LOG_TIME: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.25)' },
  APPROVE_TIMESHEETS: { color: '#4ade80', bg: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.25)' },
  REJECT_TIMESHEETS: { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)' },
  UPDATE_TIMESHEETS_STATUS: { color: 'var(--gold)', bg: 'rgba(201,168,76,0.1)', border: 'rgba(201,168,76,0.25)' },
  LOG_EXPENSE: { color: 'var(--gold)', bg: 'rgba(201,168,76,0.1)', border: 'rgba(201,168,76,0.25)' },
  APPROVE_EXPENSES: { color: '#4ade80', bg: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.25)' },
  REJECT_EXPENSES: { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)' },
  UPDATE_EXPENSES_STATUS: { color: 'var(--gold)', bg: 'rgba(201,168,76,0.1)', border: 'rgba(201,168,76,0.25)' },
  CREATE_ACCOUNT: { color: '#c084fc', bg: 'rgba(192,132,252,0.1)', border: 'rgba(192,132,252,0.25)' },
  UPDATE_ACCOUNT: { color: '#c084fc', bg: 'rgba(192,132,252,0.05)', border: 'rgba(192,132,252,0.1)' },
  UPDATE_PROFILE: { color: '#fb923c', bg: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.25)' },
};

const AuditLogs = () => {
  const [logs, setLogs] = useState<UIHistoryItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    api.getAuditLogs().then(setLogs);
  }, []);

  const paginatedLogs = logs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="portal-content">
      <div style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button 
          onClick={() => window.history.back()} 
          style={{ background: 'none', border: 'none', color: 'white', opacity: 0.3, fontSize: '0.85rem', cursor: 'pointer' }}
        >
          ← Back
        </button>
        <ExportDropdown 
          data={logs} 
          filename="Adveris_Registry_Backup" 
          label="Export Logs" 
          dateField="timestamp" 
        />
      </div>

      <div className="portal-panel" style={{ padding: 0, overflow: 'visible' }}>
        <table className="portal-table-v2">
          <thead>
            <tr>
              <th style={{ paddingLeft: 60, width: 100 }}>Log UUID</th>
              <th style={{ width: 120 }}>Source Table</th>
              <th style={{ width: 120 }}>Record Reference</th>
              <th style={{ width: 140 }}>Event Type</th>
              <th>Operational Details</th>
              <th>Authorized By</th>
              <th style={{ textAlign: 'right', paddingRight: 60, width: 120 }}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLogs.length > 0 ? paginatedLogs.map(log => {
              const style = actionStyles[log.action] || { color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' };
              return (
                <tr key={log.id}>
                  <td style={{ paddingLeft: 60 }}>
                    <span style={{ opacity: 0.15, fontSize: '0.65rem', fontFamily: 'monospace' }}>{log.id.substring(0,8)}</span>
                  </td>
                  <td>
                    <span style={{ opacity: 0.4, fontSize: '0.7rem', fontWeight: 500 }}>
                      {(log.table_name || 'System').split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 700 }}>{log.record_ref}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '4px 12px', borderRadius: 4,
                        fontSize: '0.65rem', fontWeight: 600,
                        color: style.color,
                        background: style.bg, border: `1px solid ${style.border}`
                      }}>
                        {log.action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ color: 'white', fontWeight: 400 }}>{log.details}</div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,153,51,0.3)', marginTop: 4 }}>{log.record_id?.substring(0, 16)}…</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: 'rgba(255,255,255,0.6)' }}>{log.user_name}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: 60 }}>
                    <div style={{ color: 'white', fontWeight: 500 }}>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.25 }}>{new Date(log.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '160px 0', opacity: 0.1 }}>
                  <p className="serif-title" style={{ fontSize: '1.8rem', fontStyle: 'italic', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Account Registry Is Empty...</p>
                </td>
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
  );
};

export default AuditLogs;
