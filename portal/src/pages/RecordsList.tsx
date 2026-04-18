import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockApi } from '../lib/mockApi';
import Pagination from '../components/Pagination';

const RecordsList = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([mockApi.getRecords(), mockApi.getAccounts()]).then(([recs, accs]) => {
      setRecords(recs);
      setAccounts(accs);
    });
  }, []);

  const paginatedRecords = records.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="theater-container" style={{ paddingTop: 0, paddingBottom: 40 }}>
      <div style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ paddingBottom: 0 }}>
           <span style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.45em', opacity: 0.2, textTransform: 'uppercase' }}>
             {records.length} ACTIVE RECORDS
           </span>
        </div>
      </div>

      {/* TABLE SECTION — Standardized High-Density UI */}
      <div className="portal-panel" style={{ padding: 0, overflow: 'visible' }}>
        <table className="portal-table-v2">
          <thead>
            <tr>
              <th style={{ paddingLeft: 60, width: 100 }}>Firm ID</th>
              <th>Account Mandate</th>
              <th>Account Name</th>
              <th>Created By</th>
              <th style={{ width: 90 }}>Priority</th>
              <th style={{ width: 140 }}>Document Verification Status</th>
              <th style={{ textAlign: 'right', paddingRight: 60, width: 90 }}>Status</th>
              <th style={{ textAlign: 'right', paddingRight: 60, width: 100 }}>Created Date</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRecords.length > 0 ? paginatedRecords.map(record => {
              const account = accounts.find(a => a.id === record.account_id);
              return (
                <tr 
                  key={record.id} 
                  onClick={() => navigate(`/dashboard/records/${record.id}`)} 
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ paddingLeft: 60 }}>
                    <span style={{ opacity: 0.4 }}>{record.request_number}</span>
                  </td>
                  <td>
                    <div style={{ color: 'white', fontWeight: 500 }}>
                      {record.title || record.primary_service}
                    </div>
                  </td>
                  <td>
                     <div style={{ color: 'var(--gold)', opacity: 0.6, fontWeight: 300 }}>
                       {account?.account_name || 'Individual Identity'}
                     </div>
                  </td>
                  <td>
                     <div style={{ opacity: 0.4, fontStyle: 'italic', fontSize: '0.75rem' }}>
                       {record.submitted_by_name || 'System'}
                     </div>
                  </td>
                  <td>
                     <span style={{ 
                        fontWeight: 400, opacity: 0.5, fontSize: '0.7rem',
                        color: record.priority === 'Critical' ? '#ef4444' : 'inherit'
                     }}>
                        {record.priority?.toUpperCase() || 'STANDARD'}
                     </span>
                  </td>
                  <td>
                     <span style={{ opacity: 0.3, fontSize: '0.7rem' }}>
                        {record.verification_status || 'PENDING'}
                     </span>
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: 60 }}>
                    <span style={{ 
                      fontWeight: 500, 
                      color: 'var(--saffron)', opacity: 0.8
                    }}>
                      {record.status?.toUpperCase() || 'ACTIVE'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: 60 }}>
                    <span style={{ opacity: 0.4, fontSize: '0.75rem' }}>
                      {new Date(record.created_at).toLocaleDateString()}
                    </span>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '160px 0', opacity: 0.1 }}>
                  <p className="serif-title" style={{ fontSize: '1.8rem', fontStyle: 'italic' }}>Operational ledger is empty...</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        <Pagination 
          currentPage={currentPage}
          totalItems={records.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
        />
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
