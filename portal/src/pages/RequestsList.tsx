import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import Pagination from '../components/Pagination';
import type { Request, Account } from '../types';

const RequestsList = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    Promise.all([api.getRecords(), api.getAccounts()]).then(([requestsData, accs]) => {
      let filteredRequests = requestsData;
      if (user.role === 'client') {
        filteredRequests = requestsData.filter(r => r.account_id === user.account_id);
      } else if (user.role === 'employee') {
        const expertise = user.expertise_tags || [];
        if (expertise.includes('ALL (Global Access)')) {
          filteredRequests = requestsData;
        } else {
          filteredRequests = requestsData.filter(r => expertise.includes(r.primary_service));
        }
      }
      setRequests(filteredRequests);
      setAccounts(accs);
    });
  }, [user]);

  const paginatedRequests = requests.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="theater-container" style={{ paddingTop: 0, paddingBottom: 40 }}>
      <div style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ paddingBottom: 0 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 500, opacity: 0.3 }}>
              {requests.length} Active Requests
            </span>
        </div>
      </div>

      {/* TABLE SECTION — Standardized High-Density UI */}
      <div className="portal-panel" style={{ padding: 0, overflow: 'visible' }}>
        <table className="portal-table-v2">
          <thead>
            <tr>
              <th style={{ paddingLeft: 60, width: 100 }}>Firm ID</th>
              <th>Service Request</th>
              <th>Account Name</th>
              <th>Created By</th>
              <th style={{ width: 90 }}>Priority</th>
              <th style={{ width: 140 }}>Verification</th>
              <th style={{ textAlign: 'right', paddingRight: 60, width: 90 }}>Status</th>
              <th style={{ textAlign: 'right', paddingRight: 60, width: 100, whiteSpace: 'nowrap' }}>Created Date</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRequests.length > 0 ? paginatedRequests.map(record => {
              const account = accounts.find(a => a.id === record.account_id);
              return (
                <tr 
                  key={record.id} 
                  onClick={() => navigate(`/dashboard/requests/${record.id}`)} 
                  style={{ cursor: 'pointer' }}
                >
                  <td data-label="Firm ID" style={{ paddingLeft: 60 }}>
                    <span style={{ opacity: 0.4 }}>{record.request_number}</span>
                  </td>
                  <td data-label="Service Request">
                    <div style={{ color: 'white', fontWeight: 500 }}>
                      {record.title || record.primary_service}
                    </div>
                  </td>
                  <td data-label="Account Name">
                     <div style={{ color: 'var(--gold)', opacity: 0.6, fontWeight: 300 }}>
                       {account?.account_name || 'Individual Identity'}
                     </div>
                  </td>
                  <td data-label="Created By">
                     <div style={{ opacity: 0.4, fontStyle: 'italic', fontSize: '0.75rem' }}>
                       {record.submitted_by_name || 'System'}
                     </div>
                  </td>
                  <td data-label="Priority">
                     <span style={{ 
                        fontWeight: 400, opacity: 0.5, fontSize: '0.75rem',
                        color: record.priority === 'Urgent' ? '#ef4444' : 'inherit'
                     }}>
                        {record.priority || 'Standard'}
                     </span>
                  </td>
                  <td data-label="Verification">
                     <span style={{ opacity: 0.3, fontSize: '0.75rem' }}>
                        {record.verification_status || 'Pending'}
                     </span>
                  </td>
                  <td data-label="Status" style={{ textAlign: 'right', paddingRight: 60 }}>
                    <span style={{ 
                      fontWeight: 600, 
                      fontSize: '0.65rem',
                      color: (record.status === 'rejected' || record.status === 'closed') ? '#ef4444' : '#4ade80',
                      background: (record.status === 'rejected' || record.status === 'closed') ? 'rgba(239,68,68,0.1)' : 'rgba(74,222,128,0.1)',
                      padding: '4px 12px',
                      borderRadius: 4,
                      border: `1px solid ${(record.status === 'rejected' || record.status === 'closed') ? 'rgba(239,68,68,0.2)' : 'rgba(74,222,128,0.2)'}`,
                      display: 'inline-block'
                    }}>
                      {(record.status === 'rejected' || record.status === 'closed') ? 'Closed' : 'Active'}
                    </span>
                  </td>
                  <td data-label="Date" style={{ textAlign: 'right', paddingRight: 60, whiteSpace: 'nowrap' }}>
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
          totalItems={requests.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
        />
      </div>

      {/* FOOTER NOTE */}
      <div style={{ marginTop: 60, textAlign: 'center' }}>
         <p style={{ fontSize: '0.8rem', opacity: 0.15, fontWeight: 200, letterSpacing: '0.05em' }}>
            All requests are time-stamped and governed by the Adveris Professional Protocol. Proprietary intellectual asset tracking enabled.
         </p>
      </div>
    </div>
  );
};

export default RequestsList;
