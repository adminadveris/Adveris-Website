import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockApi } from '../lib/mockApi';

const RecordsList = () => {
  const [records, setRecords] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    mockApi.getRecords().then(setRecords);
  }, []);

  return (
    <div className="theater-container" style={{ paddingTop: 0, paddingBottom: 150 }}>
      {/* HEADER SECTION */}
      <div style={{ marginBottom: 100 }}>
        <div className="firm-intel-tag" style={{ marginBottom: 20 }}>
          <span className="tag-line" /> OPERATIONAL PORTFOLIO
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 className="serif-title" style={{ fontSize: '5rem', marginBottom: 16 }}>
              Institutional <em>History</em>
            </h1>
            <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.3)', fontWeight: 200, maxWidth: '700px', lineHeight: 1.8 }}>
               A centralized ledger of active strategic mandates, compliance filings, and professional service history across the Adveris ecosystem.
            </p>
          </div>
          <div style={{ paddingBottom: 12 }}>
             <span style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.45em', opacity: 0.2, textTransform: 'uppercase' }}>
               {records.length} ACTIVE RECORDS
             </span>
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="portal-panel" style={{ padding: 0, overflow: 'visible' }}>
        <table className="portal-table-v2">
          <thead>
            <tr>
              <th style={{ paddingLeft: 60 }}>FIRM ID</th>
              <th>INSTITUTIONAL MANDATE</th>
              <th>CLIENT ENTITY</th>
              <th>STATUS</th>
              <th style={{ textAlign: 'right', paddingRight: 60 }}>LOGS</th>
            </tr>
          </thead>
          <tbody>
            {records.length > 0 ? records.map(record => (
              <tr 
                key={record.id} 
                onClick={() => navigate(`/dashboard/records/${record.id}`)} 
                style={{ cursor: 'pointer' }}
              >
                <td style={{ paddingLeft: 60 }}>
                  <span style={{ color: 'var(--gold)', fontWeight: 800, fontSize: '0.65rem', letterSpacing: '0.1em' }}>{record.request_number}</span>
                </td>
                <td>
                  <div style={{ fontFamily: 'var(--font-serif)', color: 'white', fontWeight: 400, fontSize: '1.6rem', lineHeight: 1.1 }}>
                    {record.title || record.primary_service}
                  </div>
                  <div style={{ fontSize: '0.55rem', opacity: 0.25, textTransform: 'uppercase', letterSpacing: '0.4em', marginTop: 12 }}>
                    {record.primary_service}
                  </div>
                </td>
                <td>
                   <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', fontWeight: 300 }}>
                     {record.account_name || 'Individual Identity'}
                   </div>
                </td>
                <td>
                  <span style={{ 
                    fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.3em', 
                    color: 'var(--saffron)', background: 'rgba(255,153,51,0.05)', 
                    padding: '8px 16px', borderRadius: 2 
                  }}>
                    {record.status?.toUpperCase()}
                  </span>
                </td>
                <td style={{ textAlign: 'right', paddingRight: 60 }}>
                  <span style={{ fontSize: '1rem', opacity: 0.1, transition: 'opacity 0.3s' }}>•••</span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '160px 0', opacity: 0.1 }}>
                  <p className="serif-title" style={{ fontSize: '1.8rem', fontStyle: 'italic' }}>Institutional registry is empty...</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER NOTE */}
      <div style={{ marginTop: 60, textAlign: 'center' }}>
         <p style={{ fontSize: '0.8rem', opacity: 0.15, fontWeight: 200, letterSpacing: '0.05em' }}>
            All records are time-stamped and governed by the Adveris Professional Protocol. Proprietary intellectual asset tracking enabled.
         </p>
      </div>
    </div>
  );
};

export default RecordsList;
