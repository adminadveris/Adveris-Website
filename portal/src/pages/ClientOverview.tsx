import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockApi } from '../lib/mockApi';
import { useAuth } from '../contexts/AuthContext';
import type { ServiceRecord } from '../types';

const ClientOverview = () => {
  const { profile } = useAuth();
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile) return;
    mockApi.getRecords().then(recs => {
      setRecords(recs.filter((r: ServiceRecord) => r.account_id === profile.account_id || r.submitted_by === profile.id));
    });
  }, [profile]);

  if (!profile) return null;

  return (
    <div className="theater-container" style={{ paddingTop: 80, paddingBottom: 150 }}>
      <div style={{ marginBottom: 40 }}>
        <div className="firm-intel-tag">
           <span className="tag-line" /> CLIENT PORTAL
        </div>
      </div>

      <div className="portal-panel" style={{ padding: 0, overflow: 'visible' }}>
        <div className="portal-panel-header" style={{ padding: '24px 40px', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
          <h2 className="serif-title" style={{ fontSize: '1.8rem' }}>Your <em>Mandates</em></h2>
        </div>
        <div className="portal-panel-body">
          {records.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>No mandates submitted yet.</p>
          ) : (
            records.map((r: ServiceRecord) => (
              <div 
                key={r.id} 
                onClick={() => navigate(`/dashboard/records/${r.id}`)}
                style={{ cursor: 'pointer', padding: '48px 60px', borderBottom: '1px solid rgba(255,255,255,0.015)', transition: 'all 0.8s var(--ease)' }}
                className="portal-list-item-elegant"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: 600 }}>{r.request_number} — {r.primary_service}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '0.7rem', padding: '3px 10px', borderRadius: 'var(--radius-pill)', background: 'rgba(255,153,51,0.15)', color: 'var(--saffron)', fontWeight: 700, textTransform: 'uppercase' }}>{r.status}</span>
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
