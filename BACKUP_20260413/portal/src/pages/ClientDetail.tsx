import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockApi } from '../lib/mockApi';

const ClientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<any>(null);
  const [account, setAccount] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [showAllHistory] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const c = await mockApi.getClientById(id);
    if (!c) { navigate('/dashboard/crm'); return; }

    const [acc, hist] = await Promise.all([
      mockApi.getAccountById(c.account_id),
      mockApi.getHistoryByRecord(id)
    ]);

    setClient(c);
    setAccount(acc);
    setHistory(hist);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return (
    <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="portal-loader" />
    </div>
  );

  const ContactBlock = ({ label, emails, phones }: { label: string; emails: string[]; phones: string[] }) => (
    <div className="portal-panel" style={{ padding: 40 }}>
      <h3 style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.15em', opacity: 0.4, marginBottom: 32 }}>{label}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
        <div>
          <p style={{ fontSize: '0.6rem', fontWeight: 700, opacity: 0.3, marginBottom: 16 }}>COMMUNICATION CHANNELS (EMAIL)</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {emails.map((e, idx) => e && (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--gold)', opacity: 0.5 }}>#{idx+1}</span>
                <span style={{ fontSize: '0.95rem', color: 'white' }}>{e}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p style={{ fontSize: '0.6rem', fontWeight: 700, opacity: 0.3, marginBottom: 16 }}>TELEPHONIC CHANNELS</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {phones.map((p, idx) => p && (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--gold)', opacity: 0.5 }}>#{idx+1}</span>
                <span style={{ fontSize: '0.95rem', color: 'white' }}>{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="portal-content">
      <div className="portal-page-header-row">
        <div className="portal-page-header" style={{ border: 'none', padding: 0 }}>
          <button onClick={() => navigate('/dashboard/crm')} className="btn-portal-outline" style={{ padding: '6px 12px', fontSize: '0.65rem', marginBottom: 16 }}>
             ← BACK TO HUB
          </button>
          <div className="firm-intel-tag"><span className="tag-line" /> STAKEHOLDER PROFILE</div>
          <h1 className="serif-title" style={{ fontSize: '3rem' }}>{client.client_name}</h1>
          <p className="subtitle">
            {client.designation || 'Key Representative'} @ 
            <span 
              onClick={() => navigate(`/dashboard/crm/accounts/${account?.id}`)} 
              style={{ color: 'var(--gold)', cursor: 'pointer', marginLeft: 6, textDecoration: 'underline' }}
            >
              {account?.account_name}
            </span>
          </p>
        </div>
        <button onClick={() => navigate(`/dashboard/crm/clients/${id}/edit`)} className="btn-portal-primary" style={{ width: 'auto' }}>
           EDIT PROFILE
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 40, marginTop: 40, alignItems: 'start' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <ContactBlock 
            label="PROFESSIONAL INTELLIGENCE" 
            emails={[client.email_1, client.email_2, client.email_3]} 
            phones={[client.phone_1, client.phone_2, client.phone_3]}
          />

          <div className="portal-panel" style={{ padding: 40 }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.15em', opacity: 0.4, marginBottom: 20 }}>PHYSICAL MANDATE OFFICE</h3>
            <p style={{ fontSize: '1.1rem', color: 'white', lineHeight: 1.6 }}>{client.address || 'Administrative address not specified.'}</p>
          </div>

          <div className="portal-panel" style={{ padding: 40 }}>
             <h3 style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.15em', opacity: 0.4, marginBottom: 24 }}>RECORD CHANGE LOG</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(showAllHistory ? history : history.slice(0, 5)).map(log => (
                  <div key={log.id} style={{ display: 'flex', gap: 16, padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'white' }}>{log.field_name?.toUpperCase() || 'STAKEHOLDER'} {log.action}</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.4 }}>{new Date(log.created_at).toLocaleDateString()}</span>
                      </div>
                      <p style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: 4 }}>Processed by {log.changed_by_name}</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Right Card: Relationship Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="portal-panel" style={{ padding: 32 }}>
             <h4 style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.3, letterSpacing: '0.15em', marginBottom: 24 }}>INSTITUTIONAL CONTEXT</h4>
             <div style={{ padding: 24, background: 'rgba(255,153,51,0.05)', borderRadius: 16, border: '1px solid rgba(255,153,51,0.1)' }}>
                <p style={{ fontSize: '0.6rem', fontWeight: 800, opacity: 0.5, marginBottom: 8 }}>LEGAL ENTITY</p>
                <p style={{ fontSize: '1.1rem', color: 'white', fontWeight: 600 }}>{account?.account_name}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--gold)', marginTop: 4 }}>{account?.industry}</p>
                <button 
                  onClick={() => navigate(`/dashboard/crm/accounts/${account?.id}`)}
                  className="btn-portal-outline" 
                  style={{ marginTop: 20, width: '100%', fontSize: '0.65rem' }}
                >
                  VIEW ACCOUNT
                </button>
             </div>
          </div>
          
          <div style={{ padding: 32, borderRadius: 12, border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>
             <p style={{ fontSize: '0.75rem', opacity: 0.2, lineHeight: 1.6 }}>
               Profile synchronization enabled. Contact details are verified for secure client-professional communication within the Adveris ecosystem.
             </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ClientDetail;
