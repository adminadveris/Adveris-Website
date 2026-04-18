import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockApi } from '../lib/mockApi';
import { AccountModal } from '../components/CRMModals';

// ——— ADVERIS PREMIUM INSTITUTIONAL HYPER-AESTHETIC TABLE ———
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

  const filtered = useMemo(() => {
    if (!q) return rows;
    const lq = q.toLowerCase();
    return rows.filter(r => Object.values(r).some(v => String(v ?? '').toLowerCase().includes(lq)));
  }, [rows, q]);

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
            {filtered.map((row, i) => (
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
            {filtered.length === 0 && (
              <tr>
                <td colSpan={cols.length} style={{ padding: 160, textAlign: 'center', opacity: 0.1 }}>
                   <p className="serif-title" style={{ fontStyle: 'italic', fontSize: '1.8rem' }}>No institutional objects found...</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
      header: 'LEGAL ENTITY', key: 'account_name',
      render: r => (
        <div style={{ fontFamily: 'var(--font-serif)', color: 'white', fontWeight: 400, fontSize: '1.6rem', lineHeight: 1.1 }}>{r.account_name}</div>
      )
    },
    { header: 'INDUSTRY', key: 'industry', render: r => <span style={{ opacity: 0.3, fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.3em' }}>{r.industry?.toUpperCase() || 'GENERAL'}</span> },
    { header: 'PAN ID', key: 'pan_number', render: r => <span style={{ opacity: 0.4, fontSize: '0.9rem', fontWeight: 200 }}>{r.pan_number || '—'}</span> },
    {
      header: '', key: '__action',
      render: () => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: 40 }}>
          <span style={{ fontSize: '1rem', opacity: 0.1 }}>•••</span>
        </div>
      )
    },
  ];

  const clientCols: ColDef[] = [
    {
      header: 'STAKEHOLDER', key: 'client_name',
      render: r => <div style={{ fontFamily: 'var(--font-serif)', color: 'white', fontWeight: 400, fontSize: '1.6rem', lineHeight: 1.1 }}>{r.client_name}</div>
    },
    { header: 'DESIGNATION', key: 'designation', render: r => <span style={{ opacity: 0.3, fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.3em' }}>{r.designation?.toUpperCase() || 'OFFICER'}</span> },
    {
      header: 'INSTITUTIONAL PARENT', key: 'account_id',
      render: r => {
        const acc = accounts.find(a => a.id === r.account_id);
        return <span style={{ color: 'var(--gold)', opacity: 0.6, fontWeight: 300, fontSize: '0.95rem' }}>{acc?.account_name || '—'}</span>;
      }
    },
    {
      header: '', key: '__action',
      render: () => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: 40 }}>
          <span style={{ fontSize: '1rem', opacity: 0.1 }}>•••</span>
        </div>
      )
    },
  ];

  return (
    <div className="theater-container" style={{ paddingTop: 0, paddingBottom: 150 }}>
      {showAccountModal && <AccountModal onClose={() => setShowAccountModal(false)} onSaved={load} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 100 }}>
        <div>
          <div className="firm-intel-tag" style={{ marginBottom: 20 }}>
            <span className="tag-line" /> RELATIONSHIP GOVERNANCE
          </div>
          <h1 className="serif-title" style={{ fontSize: '5rem', marginBottom: 16 }}>CRM <em>Registry</em></h1>
          <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.25)', fontWeight: 200, maxWidth: 650, lineHeight: 1.8 }}>Internal ledger of institutional entities and mapped stakeholders under Adveris Advisors management.</p>
        </div>
        <div style={{ paddingBottom: 12 }}>
          <button 
            onClick={() => {
              if (tab === 'accounts') setShowAccountModal(true);
              else navigate('/dashboard/crm/clients/new');
            }}
            className="btn-portal-primary"
            style={{ width: 'auto', whiteSpace: 'nowrap', padding: '16px 40px' }}
          >
            RECORD NEW {tab === 'accounts' ? 'ACCOUNT' : 'STAKEHOLDER'}
          </button>
        </div>
      </div>

      <div style={{ marginTop: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 40 }}>
          {/* Institutional Tabs — Flow Aesthetic V4 */}
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
                    Authorized Entities
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><polyline points="16 11 18 13 22 9"></polyline></svg>
                    Stakeholder Map
                  </>
                )}
              </button>
            ))}
            <span className="portal-tab-item disabled">Archive Protocol</span>
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
