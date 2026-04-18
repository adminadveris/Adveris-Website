import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { mockApi } from '../lib/mockApi';

const ClientForm = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    client_name: '',
    designation: '',
    account_id: '',
    email_1: '',
    email_2: '',
    email_3: '',
    phone_1: '',
    phone_2: '',
    phone_3: '',
    address: '',
  });

  const loadData = async () => {
    const accs = await mockApi.getAccounts();
    setAccounts(accs);

    if (isEdit) {
      const client = await mockApi.getClientById(id);
      if (client) {
        setFormData({
          client_name: client.client_name || '',
          designation: client.designation || '',
          account_id: client.account_id || '',
          email_1: client.email_1 || '',
          email_2: client.email_2 || '',
          email_3: client.email_3 || '',
          phone_1: client.phone_1 || '',
          phone_2: client.phone_2 || '',
          phone_3: client.phone_3 || '',
          address: client.address || '',
        });
      }
    } else {
      // Check for fixed account context from URL
      const fixedAcc = searchParams.get('account_id');
      if (fixedAcc) {
        setFormData(prev => ({ ...prev, account_id: fixedAcc }));
      }
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_name || !formData.account_id) {
      alert('Stakeholder Name and Legal Entity association are mandatory.');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await mockApi.updateClient(id, formData);
      } else {
        await mockApi.createClient(formData);
      }
      navigate(formData.account_id ? `/dashboard/crm/accounts/${formData.account_id}` : '/dashboard/crm');
    } catch (err) {
      alert('Efficiency check: Verification failed. Please ensure data integrity.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="portal-loader" />
    </div>
  );

  return (
    <div className="portal-content" style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* HEADER */}
      <div className="portal-page-header-row" style={{ marginBottom: 48 }}>
        <div className="portal-page-header" style={{ border: 'none', padding: 0 }}>
          <button 
            type="button" 
            onClick={() => navigate(-1)} 
            className="btn-portal-outline" 
            style={{ padding: '6px 12px', fontSize: '0.65rem', marginBottom: 16 }}
          >
             ← ABORT & RETURN
          </button>
          <div className="firm-intel-tag">
            <span className="tag-line" /> {isEdit ? 'PROFILE PRIVILEGED REFINEMENT' : 'INSTITUTIONAL ONBOARDING'}
          </div>
          <h1 className="serif-title" style={{ fontSize: '3.5rem' }}>
            {isEdit ? 'Refine' : 'Add'} Stakeholder
          </h1>
          <p className="subtitle">Configuring professional identification and communication channels.</p>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        
        {/* SECTION 1: IDENTITY */}
        <div className="portal-panel" style={{ padding: 48 }}>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.15em', opacity: 0.4, marginBottom: 32, textTransform: 'uppercase' }}>
            Personal Identification
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            <div className="portal-form-group">
              <label className="portal-form-label">FULL LEGAL NAME</label>
              <input 
                value={formData.client_name}
                onChange={e => setFormData({ ...formData, client_name: e.target.value })}
                className="portal-form-control"
                placeholder="e.g. Vikram Malhotra"
                required
              />
            </div>
            <div className="portal-form-group">
              <label className="portal-form-label">OFFICIAL DESIGNATION</label>
              <input 
                value={formData.designation}
                onChange={e => setFormData({ ...formData, designation: e.target.value })}
                className="portal-form-control"
                placeholder="e.g. Managing Director"
              />
            </div>
            <div className="portal-form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="portal-form-label">ASSOCIATED LEGAL ENTITY (ACCOUNT)</label>
              <select 
                value={formData.account_id}
                onChange={e => setFormData({ ...formData, account_id: e.target.value })}
                className="portal-form-control"
                style={{ appearance: 'none', cursor: 'pointer' }}
                disabled={isEdit || !!searchParams.get('account_id')}
                required
              >
                <option value="">Select Entity...</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.account_name}</option>
                ))}
              </select>
              {(isEdit || !!searchParams.get('account_id')) && (
                 <p style={{ fontSize: '0.7rem', color: 'var(--gold)', marginTop: 8, opacity: 0.6 }}>
                   Institutional linkage is locked for this operation.
                 </p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 2: COMMUNICATION GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          
          <div className="portal-panel" style={{ padding: 40 }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.15em', opacity: 0.4, marginBottom: 32, textTransform: 'uppercase' }}>
              Digital Channels (Email)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {[1, 2, 3].map(idx => (
                <div key={idx} className="portal-form-group">
                  <label className="portal-form-label">EMAIL ADDRESS #{idx}</label>
                  <input 
                    type="email"
                    value={(formData as any)[`email_${idx}`]}
                    onChange={e => setFormData({ ...formData, [`email_${idx}`]: e.target.value })}
                    className="portal-form-control"
                    placeholder={`channel_${idx}@firm.com`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="portal-panel" style={{ padding: 40 }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.15em', opacity: 0.4, marginBottom: 32, textTransform: 'uppercase' }}>
              Telephonic Channels (Phone)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {[1, 2, 3].map(idx => (
                <div key={idx} className="portal-form-group">
                  <label className="portal-form-label">PHONE NUMBER #{idx}</label>
                  <input 
                    type="tel"
                    value={(formData as any)[`phone_${idx}`]}
                    onChange={e => setFormData({ ...formData, [`phone_${idx}`]: e.target.value })}
                    className="portal-form-control"
                    placeholder="+91 00000 00000"
                  />
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* SECTION 3: ADDRESS */}
        <div className="portal-panel" style={{ padding: 40 }}>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.15em', opacity: 0.4, marginBottom: 32, textTransform: 'uppercase' }}>
            Operational Location
          </h3>
          <div className="portal-form-group">
            <label className="portal-form-label">ADMISTRATIVE ADDRESS</label>
            <textarea 
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className="portal-form-control"
              style={{ minHeight: 120, resize: 'vertical' }}
              placeholder="Full physical coordinates..."
            />
          </div>
        </div>

        {/* CONTROLS */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 20, marginTop: 20 }}>
          <button 
            type="button" 
            onClick={() => navigate(-1)} 
            className="btn-portal-outline" 
            style={{ width: 'auto', padding: '14px 40px' }}
          >
            DISCARD CHANGES
          </button>
          <button 
            type="submit" 
            disabled={saving}
            className="btn-portal-primary"
            style={{ width: 'auto', padding: '14px 60px' }}
          >
            {saving ? 'PROCESSING...' : (isEdit ? 'AUTHORIZE REFINEMENT' : 'AUTHORIZE ONBOARDING')}
          </button>
        </div>

      </form>
    </div>
  );
};

export default ClientForm;
