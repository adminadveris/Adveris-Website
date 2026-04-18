import { useEffect, useState } from 'react';
import { mockApi } from '../lib/mockApi';

const actionStyles: Record<string, { color: string; bg: string; border: string }> = {
  CREATE_RECORD: { color: 'var(--saffron)', bg: 'var(--saffron-pale)', border: 'var(--saffron-border)' },
  LOG_TIME: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.25)' },
  LOG_EXPENSE: { color: 'var(--gold)', bg: 'rgba(201,168,76,0.1)', border: 'rgba(201,168,76,0.25)' },
};

const AuditLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    mockApi.getAuditLogs().then(setLogs);
  }, []);

  return (
    <div className="portal-content">
      <div className="portal-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-sm)', background: 'var(--saffron-pale)', border: '1px solid var(--saffron-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--saffron)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <h1>Intelligence <em>Audit</em></h1>
        </div>
        <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)', fontWeight: 300 }}>
          Immutable chronological record of all firm operations.
        </p>
      </div>

      {logs.length > 0 ? (
        <div className="portal-timeline">
          {logs.map(log => {
            const style = actionStyles[log.action] || { color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' };
            return (
              <div key={log.id} className="portal-timeline-item">
                <div className="portal-panel" style={{ padding: '24px 28px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '3px 12px', borderRadius: 'var(--radius-pill)',
                          fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.18em',
                          textTransform: 'uppercase', color: style.color,
                          background: style.bg, border: `1px solid ${style.border}`
                        }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)', fontFamily: 'Courier New, monospace' }}>
                          {log.record_id?.substring(0, 14)}…
                        </span>
                      </div>

                      <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.8)', marginBottom: 14, lineHeight: 1.5 }}>
                        "{log.details}"
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,153,51,0.5)" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                          </svg>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
                            {log.user_name}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontStyle: 'italic', color: 'var(--saffron)', marginBottom: 4 }}>
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', fontWeight: 500, letterSpacing: '0.08em' }}>
                        {new Date(log.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="portal-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 40px', textAlign: 'center', opacity: 0.3 }}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: 24 }}>
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.4rem' }}>
            Awaiting system activity.
          </p>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
