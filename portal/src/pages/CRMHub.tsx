import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { AccountModal } from '../components/CRMModals';
import Pagination from '../components/Pagination';
import type { Account, Client } from '../types';

interface ColDef<T> {
  header: string;
  key: string;
  render?: (row: T) => React.ReactNode;
  width?: string | number;
}

const DataTable = <T extends { id?: string }>({
  cols,
  rows,
  onRowClick,
  q,
}: {
  cols: ColDef<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  q: string;
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const filtered = useMemo(() => {
    let items = [...rows];
    if (q) {
      const lq = q.toLowerCase();
      items = items.filter(row => Object.values(row).some(value => String(value ?? '').toLowerCase().includes(lq)));
    }

    if (sortConfig !== null) {
      items.sort((a: any, b: any) => {
        const aVal = String(a[sortConfig.key] ?? '').toLowerCase();
        const bVal = String(b[sortConfig.key] ?? '').toLowerCase();
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [rows, q, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig?.key !== column) return <span className="sort-indicator">↕</span>;
    return <span className="sort-indicator active">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="crm-table-block">
      <div className="portal-panel crm-table-panel">
        <table className="portal-table-v2">
          <thead>
            <tr>
              {cols.map(col => (
                <th 
                  key={col.key} 
                  style={{ width: col.width }}
                  className={`sortable ${sortConfig?.key === col.key ? 'active' : ''}`}
                  onClick={() => requestSort(col.key)}
                >
                  {col.header} <SortIcon column={col.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((row, index) => (
              <tr key={row.id ?? index} onClick={() => onRowClick?.(row)} style={{ cursor: onRowClick ? 'pointer' : 'default' }}>
                {cols.map(col => (
                  <td key={col.key}>
                    {col.render ? col.render(row) : <span className="crm-muted-value">{(row as any)[col.key] ?? '-'}</span>}
                  </td>
                ))}
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={cols.length} className="crm-empty-cell">No records found</td>
              </tr>
            )}
          </tbody>
        </table>

        <Pagination
          currentPage={currentPage}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      </div>
    </div>
  );
};

type Tab = 'accounts' | 'clients';

const CRMHub = () => {
  const [tab, setTab] = useState<Tab>('accounts');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    const [accs, clis] = await Promise.all([api.getAccounts(), api.getClients()]);
    setAccounts(accs);
    setClients(clis);
  };

  useEffect(() => {
    load();
  }, []);

  const accountCols: ColDef<Account>[] = [
    {
      header: 'Account Name',
      key: 'account_name',
      render: row => <div className="crm-primary-cell">{row.account_name}</div>,
    },
    {
      header: 'Industry / Sector',
      key: 'industry',
      render: row => <span className="crm-muted-value">{row.industry || 'General'}</span>,
    },
    {
      header: 'PAN Number',
      key: 'pan_number',
      render: row => <span className="crm-muted-value">{row.pan_number || '-'}</span>,
    },
    {
      header: 'Registration (CIN / LLPIN)',
      key: 'cin_number',
      render: row => <span className="crm-muted-value">{row.cin_number || '-'}</span>,
    },
    {
      header: 'GSTIN Number',
      key: 'gstin_number',
      render: row => <span className="crm-muted-value">{row.gstin_number || '-'}</span>,
    },
  ];

  const clientCols: ColDef<Client>[] = [
    {
      header: 'Client Name',
      key: 'client_name',
      render: row => <div className="crm-primary-cell">{row.client_name}</div>,
    },
    {
      header: 'Designation',
      key: 'designation',
      render: row => <span className="crm-muted-value">{row.designation || 'Officer'}</span>,
    },
    {
      header: 'Primary Email',
      key: 'email_1',
      render: row => <span className="crm-muted-value">{row.email_1 || '-'}</span>,
    },
    {
      header: 'Primary Phone',
      key: 'phone_1',
      render: row => <span className="crm-muted-value">{row.phone_1 || '-'}</span>,
    },
  ];

  return (
    <div className="theater-container crm-page" style={{ paddingTop: 0, paddingBottom: 40 }}>
      {showAccountModal && <AccountModal onClose={() => setShowAccountModal(false)} onSaved={load} />}

      <div className="enterprise-toolbar crm-toolbar">
        <div>
          <div className="enterprise-eyebrow">System Overview</div>
          <h1>Accounts & Clients</h1>
        </div>
        <div className="enterprise-toolbar__actions">
          <button
            onClick={() => {
              if (tab === 'accounts') setShowAccountModal(true);
              else navigate('/dashboard/crm/clients/new');
            }}
            className="btn-portal-primary"
            style={{ width: 'auto', whiteSpace: 'nowrap' }}
          >
            {tab === 'accounts' ? 'New Account' : 'New Client'}
          </button>
        </div>
      </div>

      <div className="crm-metrics-row">
        <div className="portal-panel crm-metric-card">
          <span>Total Accounts</span>
          <strong>{accounts.length}</strong>
        </div>
        <div className="portal-panel crm-metric-card">
          <span>Total Clients</span>
          <strong>{clients.length}</strong>
        </div>
        <div className="portal-panel crm-metric-card">
          <span>Current View</span>
          <strong>{tab === 'accounts' ? 'Accounts' : 'Clients'}</strong>
        </div>
      </div>

      <section className="portal-panel crm-workspace">
        <div className="crm-control-row">
          <div className="crm-segmented-tabs" role="tablist" aria-label="CRM view">
            {(['accounts', 'clients'] as Tab[]).map(item => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setTab(item);
                  setQ('');
                }}
                className={tab === item ? 'active' : ''}
              >
                {item === 'accounts' ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <polyline points="16 11 18 13 22 9" />
                  </svg>
                )}
                {item === 'accounts' ? 'Accounts' : 'Clients'}
              </button>
            ))}
          </div>

          <div className="crm-search-wrap">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              value={q}
              onChange={event => setQ(event.target.value)}
              placeholder={tab === 'accounts' ? 'Search accounts...' : 'Search clients...'}
            />
          </div>
        </div>

        <div className="crm-view-title">
          <div>
            <h2>{tab === 'accounts' ? 'Account Directory' : 'Client Directory'}</h2>
            <p>{tab === 'accounts' ? 'Registered client entities and statutory identifiers.' : 'Stakeholder contacts linked to managed accounts.'}</p>
          </div>
        </div>

        <div key={tab} className="crm-table-host">
          {tab === 'accounts'
            ? <DataTable cols={accountCols} rows={accounts} q={q} onRowClick={row => navigate(`/dashboard/crm/accounts/${row.id}`)} />
            : <DataTable cols={clientCols} rows={clients} q={q} onRowClick={row => navigate(`/dashboard/crm/clients/${row.id}`)} />
          }
        </div>
      </section>
    </div>
  );
};

export default CRMHub;
