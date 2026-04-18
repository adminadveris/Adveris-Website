import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockApi } from '../lib/mockApi';
import { AccountModal } from '../components/CRMModals';
import Pagination from '../components/Pagination';

// ——— ADVERIS PREMIUM ACCOUNT HYPER-AESTHETIC TABLE ———
interface ColDef {
  header: string;
  key: string;
  render?: (row: any) => React.ReactNode;
  width?: string | number;
}

const DataTable = ({
  cols, rows, onRowClick, q,
}: {
  cols: ColDef[];
  rows: any[];
  onRowClick?: (row: any) => void;
  q: string;
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    if (!q) return rows;
    const lq = q.toLowerCase();
    return rows.filter(r => Object.values(r).some(v => String(v ?? '').toLowerCase().includes(lq)));
  }, [rows, q]);

  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div style={{ marginTop: 40 }}>
      <div className="portal-panel" style={{ padding: 0, overflow: 'visible' }}>
        <table className="portal-table-v2">
          <thead>
            <tr>
              {cols.map((col, idx) => (
                <th key={col.key} style={{ paddingLeft: idx === 0 ? 60 : 24, width: col.width }}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((row, i) => (
              <tr key={row.id ?? i} onClick={() => onRowClick?.(row)} style={{ cursor: onRowClick ? 'pointer' : 'default' }}>
                {cols.map((col, idx) => (
                  <td key={col.key} style={{ paddingLeft: idx === 0 ? 60 : 24 }}>
                    {col.render ? col.render(row) : (
                       <span style={{ fontWeight: 300, color: 'rgba(255,255,255,0.6)' }}>{row[col.key] ?? '—'}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={cols.length} style={{ padding: 80, textAlign: 'center', opacity: 0.1 }}>
                   <p className="serif-title" style={{ fontStyle: 'italic', fontSize: '1.8rem' }}>No account objects found...</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <Pagination 
          currentPage={currentPage}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
        />
      </div>
    </div>
  );
};

type Tab = 'accounts' | 'clients';

const CRMHub = () => {
  const [tab, setTab] = useState<Tab>('accounts');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    const [accs, clis] = await Promise.all([mockApi.getAccounts(), mockApi.getClients()]);
    setAccounts(accs);
    setClients(clis);
  };

  useEffect(() => { load(); }, []);

  const accountCols: ColDef[] = [
    {
      header: 'Account Name', key: 'account_name',
      render: r => (
        <div style={{ color: 'white', fontWeight: 500 }}>{r.account_name}</div>
      )
    },
    { header: 'Industry / Sector', key: 'industry', render: r => <span style={{ opacity: 0.4, fontWeight: 300 }}>{r.industry || 'General'}</span> },
    { header: 'PAN Number', key: 'pan_number', render: r => <span style={{ opacity: 0.4, fontWeight: 300 }}>{r.pan_number || '—'}</span> },
    { header: 'Registration (CIN/LLPIN)', key: 'cin_number', render: r => <span style={{ opacity: 0.4, fontWeight: 300, fontSize: '0.8rem' }}>{r.cin_number || '—'}</span> },
    { header: 'GSTIN Number', key: 'gstin_number', render: r => <span style={{ opacity: 0.4, fontWeight: 300, fontSize: '0.8rem' }}>{r.gstin_number || '—'}</span> },
  ];

  const clientCols: ColDef[] = [
    {
      header: 'Client Name', key: 'client_name',
      render: r => <div style={{ color: 'white', fontWeight: 500 }}>{r.client_name}</div>
    },
    { header: 'Designation', key: 'designation', render: r => <span style={{ opacity: 0.4, fontWeight: 300 }}>{r.designation || 'Officer'}</span> },
    { header: 'Primary Email', key: 'email_1', render: r => <span style={{ opacity: 0.4, fontSize: '0.8rem' }}>{r.email_1 || '—'}</span> },
    { header: 'Primary Phone', key: 'phone_1', render: r => <span style={{ opacity: 0.4, fontSize: '0.8rem' }}>{r.phone_1 || '—'}</span> },
  ];

  return (
    <div className="theater-container" style={{ paddingTop: 0, paddingBottom: 40 }}>
      {showAccountModal && <AccountModal onClose={() => setShowAccountModal(false)} onSaved={load} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
        <div />
        <div style={{ paddingBottom: 0 }}>
          <button 
            onClick={() => {
              if (tab === 'accounts') setShowAccountModal(true);
              else navigate('/dashboard/crm/clients/new');
            }}
            className="btn-portal-primary"
            style={{ width: 'auto', whiteSpace: 'nowrap', padding: '16px 40px' }}
          >
            NEW CLIENT
          </button>
        </div>
      </div>

      <div style={{ marginTop: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 40 }}>
          {/* Account Tabs — Flow Aesthetic V4 */}
          <div className="portal-tab-group" style={{ marginBottom: 0, border: 'none' }}>
            {(['accounts', 'clients'] as Tab[]).map(t => (
              <button 
                key={t} 
                onClick={() => setTab(t)} 
                className={`portal-tab-item ${tab === t ? 'active' : ''}`}
              >
                {t === 'accounts' ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                    MANAGE ACCOUNTS
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><polyline points="16 11 18 13 22 9"></polyline></svg>
                    MANAGE CLIENTS
                  </>
                )}
              </button>
            ))}
          </div>

          <div style={{ paddingBottom: 10, width: 320 }}>
             <input 
               value={q} 
               onChange={e => setQ(e.target.value)} 
               placeholder={tab === 'accounts' ? "Search accounts..." : "Search stakeholders..."}
               className="portal-form-control"
               style={{ border: 'none', borderBottom: '1px solid rgba(255,153,51,0.2)', borderRadius: 0, padding: '4px 0', fontSize: '0.85rem', background: 'none' }}
             />
          </div>
        </div>

        <div key={tab}>
          {tab === 'accounts'
            ? <DataTable cols={accountCols} rows={accounts} q={q} onRowClick={r => navigate(`/dashboard/crm/accounts/${r.id}`)} />
            : <DataTable cols={clientCols} rows={clients} q={q} onRowClick={r => navigate(`/dashboard/crm/clients/${r.id}`)} />
          }
        </div>
      </div>
    </div>
  );
};

export default CRMHub;
