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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
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

  const filteredData = requests.filter(r => {
    const matchesSearch = (r.request_number + (r.title || '') + (r.account_name || '')).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' ? true : 
                         statusFilter === 'Active' ? (r.status !== 'completed' && r.status !== 'on_hold') :
                         statusFilter === 'Closed' ? (r.status === 'completed') :
                         statusFilter === 'On Hold' ? (r.status === 'on_hold') : true;
    return matchesSearch && matchesStatus;
  });

  const paginatedRequests = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="theater-container" style={{ paddingTop: 0, paddingBottom: 40 }}>
      <div className="enterprise-toolbar">
        <div>
          <div className="enterprise-eyebrow">Workspace</div>
          <h1>All Requests</h1>
        </div>
        <div className="enterprise-toolbar__actions">
          <span className="enterprise-status enterprise-status--warning">{filteredData.length} records</span>
        </div>
      </div>

      <div className="enterprise-filterbar" style={{ marginBottom: 40, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flex: 1, maxWidth: 800 }}>
          <div style={{ position: 'relative', flex: 1 }}>
             <input 
               type="text" 
               placeholder="Search Mandates (ID, Title, Account)..." 
               value={searchQuery}
               onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
               style={{ 
                 width: '100%', 
                 background: 'rgba(255,255,255,0.03)', 
                 border: '1px solid rgba(255,255,255,0.08)', 
                 borderRadius: 8, 
                 padding: '12px 16px 12px 40px',
                 color: 'white',
                 fontSize: '0.85rem',
                 fontFamily: 'var(--font-ui)'
               }} 
             />
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }}>
               <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
             </svg>
          </div>
          
          <select 
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            style={{ 
              background: 'rgba(255,255,255,0.03)', 
              border: '1px solid rgba(255,255,255,0.08)', 
              borderRadius: 8, 
              padding: '12px 16px',
              color: 'white',
              fontSize: '0.85rem',
              minWidth: 140,
              fontFamily: 'var(--font-ui)'
            }}
          >
            <option>All</option>
            <option>Active</option>
            <option>Closed</option>
            <option>On Hold</option>
          </select>
        </div>

        <div style={{ paddingBottom: 0 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 500, opacity: 0.3, fontFamily: 'var(--font-ui)' }}>
              {filteredData.length} Indexed Requests
            </span>
        </div>
      </div>

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
                    <div style={{ color: 'white', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {record.title || record.primary_service}
                      {(() => {
                        const fileCount = (record.attached_files?.length ?? 0) + (record.attached_file && !record.attached_files?.some((f: any) => f?.url === record.attached_file?.url) ? 1 : 0);
                        return fileCount > 0 ? (
                          <span
                            title={`${fileCount} Document${fileCount > 1 ? 's' : ''} Attached`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" style={{ opacity: 0.7 }}>
                              <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                            </svg>
                            {fileCount > 1 && (
                              <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--gold)', opacity: 0.6, lineHeight: 1 }}>
                                x{fileCount}
                              </span>
                            )}
                          </span>
                        ) : null;
                      })()}
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
                      color: (record.status === 'rejected' || record.status === 'completed') ? '#ef4444' : '#4ade80',
                      background: (record.status === 'rejected' || record.status === 'completed') ? 'rgba(239,68,68,0.1)' : 'rgba(74,222,128,0.1)',
                      padding: '4px 12px',
                      borderRadius: 4,
                      border: `1px solid ${(record.status === 'rejected' || record.status === 'completed') ? 'rgba(239,68,68,0.2)' : 'rgba(74,222,128,0.2)'}`,
                      display: 'inline-block'
                    }}>
                      {(record.status === 'rejected' || record.status === 'completed') ? 'Closed' : 'Active'}
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
                <td colSpan={8} style={{ textAlign: 'center', padding: '160px 0', opacity: 0.1 }}>
                  <p style={{ fontSize: '1.2rem', fontFamily: 'var(--font-ui)', fontWeight: 600 }}>Operational Ledger Is Empty...</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        <Pagination 
          currentPage={currentPage}
          totalItems={filteredData.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
        />
      </div>

      <div className="enterprise-page-note">All requests are time-stamped and governed by the Adveris professional protocol.</div>
    </div>
  );
};

export default RequestsList;
