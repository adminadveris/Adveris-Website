import { useEffect, useState } from 'react';
import { mockApi } from '../lib/mockApi';
import Pagination from '../components/Pagination';
import ExportDropdown from '../components/ExportDropdown';

const actionStyles: Record<string, { color: string; bg: string; border: string }> = {
  CREATE_RECORD: { color: 'var(--saffron)', bg: 'var(--saffron-pale)', border: 'var(--saffron-border)' },
  LOG_TIME: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.25)' },
  LOG_EXPENSE: { color: 'var(--gold)', bg: 'rgba(201,168,76,0.1)', border: 'rgba(201,168,76,0.25)' },
};

const AuditLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    mockApi.getAuditLogs().then(setLogs);
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
          ← BACK
        </button>
        <ExportDropdown 
          data={logs} 
          filename="Adveris_Registry_Backup" 
          label="EXPORT LOGS" 
          dateField="timestamp" 
        />
      </div>

      <div className="portal-panel" style={{ padding: 0, overflow: 'visible' }}>
        <table className="portal-table-v2">
          <thead>
            <tr>
              <th style={{ paddingLeft: 60, width: 100 }}>LOG_UUID</th>
              <th style={{ width: 120 }}>SOURCE_TABLE</th>
              <th style={{ width: 120 }}>RECORD_REF</th>
              <th style={{ width: 140 }}>EVENT TYPE</th>
              <th>OPERATIONAL DETAILS</th>
              <th>AUTHORIZED BY</th>
              <th style={{ textAlign: 'right', paddingRight: 60, width: 120 }}>TIMESTAMP</th>
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
                    <span style={{ opacity: 0.4, fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{log.table_name || 'SYSTEM'}</span>
                  </td>
                  <td>
                    <span style={{ opacity: 0.15, fontSize: '0.65rem', fontFamily: 'monospace' }}>{log.record_id?.substring(0,8) || 'N/A'}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '4px 12px', borderRadius: 4,
                        fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em',
                        textTransform: 'uppercase', color: style.color,
                        background: style.bg, border: `1px solid ${style.border}`
                      }}>
                        {log.action.replace(/_/g, ' ')}
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
                <td colSpan={4} style={{ textAlign: 'center', padding: '160px 0', opacity: 0.1 }}>
                  <p className="serif-title" style={{ fontSize: '1.8rem', fontStyle: 'italic' }}>Account registry is empty...</p>
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
