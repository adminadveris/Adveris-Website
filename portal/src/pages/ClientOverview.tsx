import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { Request } from '../types';

const ClientOverview = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<Request[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    api.getRecords().then(recs => {
      setRecords(recs.filter((r: Request) => r.account_id === user.account_id || r.submitted_by === user.id));
    });
  }, [user]);

  if (!user) return null;

  return (
    <div className="theater-container" style={{ paddingTop: 80, paddingBottom: 150 }}>
      <div style={{ marginBottom: 40 }}>
        <div className="firm-intel-tag">
           <span className="tag-line" /> Client Portal
        </div>
      </div>

      <div className="portal-panel" style={{ padding: 0, overflow: 'visible' }}>
        <div className="portal-panel-header" style={{ padding: '24px 40px', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
          <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Your <em>Mandates</em></h2>
        </div>
        <div className="portal-panel-body">
          {records.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>No Mandates Submitted Yet.</p>
          ) : (
            records.map((r: Request) => (
              <div 
                key={r.id} 
                onClick={() => navigate(`/dashboard/requests/${r.id}`)}
                style={{ cursor: 'pointer', padding: '48px 60px', borderBottom: '1px solid rgba(255,255,255,0.015)', transition: 'all 0.8s var(--ease)' }}
                className="portal-list-item-elegant"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: 600 }}>{r.request_number} — {r.primary_service}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ 
                      fontSize: '0.65rem', padding: '4px 12px', borderRadius: 'var(--radius-pill)', 
                      background: 'rgba(255,153,51,0.15)', color: 'var(--saffron)', fontWeight: 600 
                    }}>
                      {r.status.charAt(0).toUpperCase() + r.status.slice(1).toLowerCase()}
                    </span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ opacity: 0.3 }}><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{r.description}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientOverview;
