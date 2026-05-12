import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { Client, Account, AuditLog } from '../types/index';

const ClientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [history, setHistory] = useState<AuditLog[]>([]);
  const [showAllHistory] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const c = await api.getClientById(id);
    if (!c) { navigate('/dashboard/crm'); return; }

    const [acc, hist] = await Promise.all([
      api.getAccountById(c.account_id),
      api.getHistoryByRecord(id)
    ]);

    setClient(c);
    setAccount(acc);
    setHistory(hist);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  if (loading || !client) return (
    <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="portal-loader" />
    </div>
  );

  const ContactBlock = ({ emails, phones }: { emails: (string | undefined)[]; phones: (string | undefined)[] }) => (
    <div className="portal-panel" style={{ padding: 32 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
        <div>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.3, marginBottom: 24 }}>Email Distribution Hub</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 500, opacity: 0.4 }}>Primary Email</span>
              <span style={{ fontSize: '1rem', color: 'white' }}>{emails[0] || '—'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 500, opacity: 0.4 }}>Secondary Email</span>
              <span style={{ fontSize: '1rem', color: 'white' }}>{emails[1] || '—'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 500, opacity: 0.4 }}>Alternate Email</span>
              <span style={{ fontSize: '1rem', color: 'white' }}>{emails[2] || '—'}</span>
            </div>
          </div>
        </div>
        <div>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.3, marginBottom: 24 }}>Telephonic Grid</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 500, opacity: 0.4 }}>Primary Phone</span>
              <span style={{ fontSize: '1rem', color: 'white' }}>{phones[0] || '—'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 500, opacity: 0.4 }}>Secondary Phone</span>
              <span style={{ fontSize: '1rem', color: 'white' }}>{phones[1] || '—'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 500, opacity: 0.4 }}>Alternate Phone</span>
              <span style={{ fontSize: '1rem', color: 'white' }}>{phones[2] || '—'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="portal-content">
      <div className="portal-page-header-row">
        <div className="portal-page-header" style={{ border: 'none', padding: 0 }}>
          <button onClick={() => navigate('/dashboard/crm')} className="btn-portal-outline" style={{ padding: '6px 12px', fontSize: '0.65rem', marginBottom: 16, width: 'auto', textAlign: 'left' }}>
             ← Back To Hub
          </button>
           <h1 className="serif-title" style={{ fontSize: '2.2rem', marginBottom: 8, fontFamily: 'var(--font-sans)', fontWeight: 600 }}>{client.client_name}</h1>
           <p className="subtitle" style={{ fontSize: '1rem', fontWeight: 300, fontFamily: 'var(--font-sans)', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
            {client.designation || 'Key Representative'} @ 
            <span 
              onClick={() => navigate(`/dashboard/crm/accounts/${account?.id}`)} 
              style={{ color: 'var(--gold)', cursor: 'pointer', marginLeft: 6, textDecoration: 'underline' }}
            >
              {account?.account_name || 'Individual Entity'}
            </span>
          </p>
        </div>
        <button onClick={() => navigate(`/dashboard/crm/clients/${id}/edit`)} className="btn-portal-primary" style={{ width: 'auto' }}>
           Edit User
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 24, marginTop: 24, alignItems: 'start' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <ContactBlock 
            emails={[client.email_1, client.email_2, client.email_3]} 
            phones={[client.phone_1, client.phone_2, client.phone_3]}
          />

          <div className="portal-panel" style={{ padding: 32 }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.3, marginBottom: 24 }}>Administrative Address</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px 48px' }}>
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 500, opacity: 0.4, marginBottom: 8 }}>House No</p>
                <p style={{ color: 'white' }}>{client.house_no || '—'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 500, opacity: 0.4, marginBottom: 8 }}>Landmark</p>
                <p style={{ color: 'white' }}>{client.landmark || '—'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 500, opacity: 0.4, marginBottom: 8 }}>Street 1</p>
                <p style={{ color: 'white' }}>{client.street_1 || '—'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 500, opacity: 0.4, marginBottom: 8 }}>Street 2</p>
                <p style={{ color: 'white' }}>{client.street_2 || '—'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 500, opacity: 0.4, marginBottom: 8 }}>Street 3</p>
                <p style={{ color: 'white' }}>{client.street_3 || '—'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 500, opacity: 0.4, marginBottom: 8 }}>City</p>
                <p style={{ color: 'white' }}>{client.city || '—'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 500, opacity: 0.4, marginBottom: 8 }}>State</p>
                <p style={{ color: 'white' }}>{client.state || '—'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 500, opacity: 0.4, marginBottom: 8 }}>Country</p>
                <p style={{ color: 'white' }}>{client.country || '—'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 500, opacity: 0.4, marginBottom: 8 }}>Pincode</p>
                <p className="font-mono" style={{ color: 'white' }}>{client.pincode || '—'}</p>
              </div>
            </div>
          </div>

          <div className="portal-panel" style={{ padding: 32, background: 'rgba(255,153,51,0.01)', border: '1px solid rgba(255,153,51,0.05)' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.3, marginBottom: 24, color: 'var(--gold)' }}>System Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px 48px' }}>
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 500, opacity: 0.4, marginBottom: 8 }}>Created Date</p>
                <p style={{ fontSize: '1rem', color: 'white', opacity: 0.6 }}>{client.created_at ? new Date(client.created_at).toLocaleString() : '—'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 500, opacity: 0.4, marginBottom: 8 }}>Created By</p>
                <p style={{ fontSize: '1rem', color: 'white', opacity: 0.6 }}>{client.created_by?.full_name || client.created_by_name || 'System'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 500, opacity: 0.4, marginBottom: 8 }}>Last Modified Date</p>
                <p style={{ fontSize: '1rem', color: 'white', opacity: 0.6 }}>{client.updated_at ? new Date(client.updated_at).toLocaleString() : '—'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 500, opacity: 0.4, marginBottom: 8 }}>Last Modified By</p>
                <p style={{ fontSize: '1rem', color: 'white', opacity: 0.6 }}>{client.updated_by?.full_name || client.updated_by_name || 'System'}</p>
              </div>
            </div>
          </div>

          <div className="portal-panel" style={{ padding: 32 }}>
             <h3 style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.4, marginBottom: 24 }}>Modification Log</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(showAllHistory ? history : history.slice(0, 5)).map(log => (
                   <div key={log.id} style={{ display: 'flex', gap: 16, padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'white' }}>
                          {(log.field_name || 'Client').split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')} {log.action === 'CREATE' ? 'Created' : log.action === 'UPDATE' ? 'Updated' : log.action}
                        </span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.4 }}>{new Date(log.created_at).toLocaleDateString()}</span>
                      </div>
                      <div style={{ marginTop: 8 }}>
                         {log.old_value && (
                           <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>
                             <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '2px 6px', borderRadius: 4, marginRight: 8 }}>Prev: {log.old_value}</span>
                             <span style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '2px 6px', borderRadius: 4 }}>New: {log.new_value}</span>
                           </p>
                         )}
                         <p style={{ fontSize: '0.7rem', opacity: 0.4, fontStyle: 'italic' }}>Modified By {log.changed_by_user?.full_name || log.changed_by_name || 'System'}</p>
                      </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Right Card: Relationship Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="portal-panel" style={{ padding: 32 }}>
             <h4 style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.3, marginBottom: 24 }}>Account Context</h4>
             <div style={{ padding: 24, background: 'rgba(255,153,51,0.05)', borderRadius: 16, border: '1px solid rgba(255,153,51,0.1)' }}>
                <p style={{ fontSize: '0.65rem', fontWeight: 600, opacity: 0.5, marginBottom: 8 }}>Legal Entity</p>
                <p style={{ fontSize: '1.1rem', color: 'white', fontWeight: 600 }}>{account?.account_name || 'Individual Entity'}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--gold)', marginTop: 4 }}>{account?.industry || 'General'}</p>
                <button 
                  onClick={() => navigate(`/dashboard/crm/accounts/${account?.id}`)}
                  className="btn-portal-outline" 
                  style={{ marginTop: 20, width: '100%', fontSize: '0.65rem' }}
                >
                  View Account
                </button>
             </div>
          </div>
          
          <div style={{ padding: 32, borderRadius: 12, border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>
             <p style={{ fontSize: '0.75rem', opacity: 0.2, lineHeight: 1.6 }}>
               User Synchronization Enabled. Contact Details Are Verified For Secure Client-Professional Communication Within The Adveris Ecosystem.
             </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ClientDetail;
