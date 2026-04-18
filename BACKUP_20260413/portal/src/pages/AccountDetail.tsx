import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockApi } from '../lib/mockApi';
import { AccountModal } from '../components/CRMModals';
import { AnimatePresence } from 'framer-motion';

const AccountDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [account, setAccount] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [mandates, setMandates] = useState<any[]>([]);
  
  const [showAllHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAccountEdit, setShowAccountEdit] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const [acc, clis, hist, allT, allE, allM] = await Promise.all([
      mockApi.getAccountById(id),
      mockApi.getClientsByAccount(id),
      mockApi.getHistoryByRecord(id),
      mockApi.getTimesheets(),
      mockApi.getExpenses(),
      mockApi.getRecords()
    ]);
    
    if (!acc) { navigate('/dashboard/crm'); return; }
    
    setAccount(acc);
    setClients(clis);
    setHistory(hist);
    
    // Filter institutional data
    setTimesheets(allT.filter((t: any) => t.account_id === id));
    setExpenses(allE.filter((e: any) => e.account_id === id));
    setMandates(allM.filter((m: any) => m.account_id === id));
    
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const stats = useMemo(() => {
    const totalHours = timesheets.reduce((sum, t) => sum + (Number(t.hours) || 0), 0);
    const totalExp = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    return { totalHours, totalExp, mandateCount: mandates.length };
  }, [timesheets, expenses, mandates]);

  if (loading) return (
    <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="portal-loader" />
    </div>
  );

  return (
    <div className="portal-content">
      <AnimatePresence>
        {showAccountEdit && <AccountModal account={account} onClose={() => setShowAccountEdit(false)} onSaved={load} />}
      </AnimatePresence>

      {/* Header Area */}
      <div className="portal-page-header-row">
        <div className="portal-page-header" style={{ border: 'none', padding: 0 }}>
          <button onClick={() => navigate('/dashboard/crm')} className="btn-portal-outline" style={{ padding: '6px 12px', fontSize: '0.65rem', marginBottom: 16 }}>
             ← BACK TO HUB
          </button>
          <div className="firm-intel-tag"><span className="tag-line" /> INSTITUTIONAL PROFILE</div>
          <h1 className="serif-title" style={{ fontSize: '3rem' }}>{account.account_name}</h1>
          <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
             <span style={{ fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 700 }}>{account.industry?.toUpperCase()}</span>
             <span style={{ fontSize: '0.8rem', opacity: 0.4 }}>ID: {account.id.split('-')[0].toUpperCase()}</span>
          </div>
        </div>
        <button onClick={() => setShowAccountEdit(true)} className="btn-portal-primary" style={{ width: 'auto' }}>
           UPDATE ENTITY
        </button>
      </div>

      {/* Fiscal Pulse / Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, margin: '40px 0' }}>
        <div className="portal-panel" style={{ padding: 24, borderLeft: '3px solid var(--gold)' }}>
           <p style={{ fontSize: '0.6rem', fontWeight: 800, opacity: 0.4, letterSpacing: '0.15em' }}>TOTAL PROFESSIONAL HOURS</p>
           <h2 className="serif-title" style={{ fontSize: '2rem', marginTop: 8, color: 'white' }}>{stats.totalHours}<em style={{ fontSize: '0.9rem', marginLeft: 6 }}>HRS</em></h2>
        </div>
        <div className="portal-panel" style={{ padding: 24, borderLeft: '3px solid var(--emerald)' }}>
           <p style={{ fontSize: '0.6rem', fontWeight: 800, opacity: 0.4, letterSpacing: '0.15em' }}>AMOUNT DISBURSED</p>
           <h2 className="serif-title" style={{ fontSize: '2rem', marginTop: 8, color: 'white' }}><em style={{ fontSize: '0.9rem', marginRight: 6 }}>₹</em>{stats.totalExp.toLocaleString('en-IN')}</h2>
        </div>
        <div className="portal-panel" style={{ padding: 24, borderLeft: '3px solid var(--saffron)' }}>
           <p style={{ fontSize: '0.6rem', fontWeight: 800, opacity: 0.4, letterSpacing: '0.15em' }}>ACTIVE MANDATES</p>
           <h2 className="serif-title" style={{ fontSize: '2rem', marginTop: 8, color: 'white' }}>{stats.mandateCount}<em style={{ fontSize: '0.9rem', marginLeft: 6 }}>RECORDS</em></h2>
        </div>
      </div>

      {/* Main 60/40 Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '6fr 4fr', gap: 40, alignItems: 'start' }}>
        
        {/* Left: Detailed Intelligence (60%) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div className="portal-panel" style={{ padding: 40 }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.15em', opacity: 0.4, marginBottom: 32 }}>REGULATORY PROFILE</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px 48px' }}>
              <div>
                <p style={{ fontSize: '0.6rem', fontWeight: 700, opacity: 0.3, marginBottom: 8 }}>REGISTRATION (CIN/LLPIN)</p>
                <p className="font-mono" style={{ fontSize: '1.1rem', color: 'white' }}>{account.cin_number || '—'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.6rem', fontWeight: 700, opacity: 0.3, marginBottom: 8 }}>PAN NUMBER</p>
                <p className="font-mono" style={{ fontSize: '1.1rem', color: 'white' }}>{account.pan_number || '—'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.6rem', fontWeight: 700, opacity: 0.3, marginBottom: 8 }}>GSTIN NUMBER</p>
                <p className="font-mono" style={{ fontSize: '1.1rem', color: 'white' }}>{account.gstin_number || '—'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.6rem', fontWeight: 700, opacity: 0.3, marginBottom: 8 }}>SECTOR CATEGORY</p>
                <p style={{ fontSize: '1.1rem', color: 'white' }}>{account.industry || 'General Corporate'}</p>
              </div>
            </div>
          </div>

          <div className="portal-panel" style={{ padding: 40 }}>
             <h3 style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.15em', opacity: 0.4, marginBottom: 24 }}>INSTITUTIONAL CHANGE LOG</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(showAllHistory ? history : history.slice(0, 5)).map(log => (
                  <div key={log.id} style={{ display: 'flex', gap: 16, padding: '16px', background: 'rgba(255,153,51,0.03)', border: '1px solid rgba(255,153,51,0.05)', borderRadius: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'white' }}>{log.field_name?.toUpperCase() || 'RECORD'} {log.action}</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.4 }}>{new Date(log.created_at).toLocaleDateString()}</span>
                      </div>
                      <p style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: 4 }}>
                        {log.action === 'UPDATE' ? `Modified by ${log.changed_by_name}` : `Entity established in system by ${log.changed_by_name}`}
                      </p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Right: Stakeholders & Contacts (40%) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div className="portal-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.15em', opacity: 0.4 }}>RELATED STAKEHOLDERS</h3>
              <button 
                onClick={() => navigate(`/dashboard/crm/clients/new?account_id=${account.id}`)}
                className="btn-portal-primary" 
                style={{ padding: '6px 16px', fontSize: '0.65rem', width: 'auto' }}
              >
                + ADD CLIENT
              </button>
            </div>
            
            <div style={{ padding: 8 }}>
              {clients.length > 0 ? clients.map(cli => (
                <div 
                  key={cli.id} 
                  onClick={() => navigate(`/dashboard/crm/clients/${cli.id}`)}
                  style={{ padding: '24px 32px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.8s var(--ease)' }}
                  className="portal-list-item-elegant"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>{cli.client_name}</p>
                      <p style={{ fontSize: '0.75rem', opacity: 0.4, marginTop: 2 }}>{cli.designation || 'Representative'}</p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ opacity: 0.2 }}>
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>
              )) : (
                <div style={{ padding: 48, textAlign: 'center', opacity: 0.3 }}>
                   <p style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>No stakeholders linked yet.</p>
                </div>
              )}
            </div>
          </div>

          <div style={{ padding: 32, borderRadius: 12, border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>
             <p style={{ fontSize: '0.75rem', opacity: 0.4, lineHeight: 1.6 }}>
               This entity is a recognized Legal Entity within the firm's CRM. Professional hours and disbursements are tracked for regulatory audit and transparency.
             </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AccountDetail;
