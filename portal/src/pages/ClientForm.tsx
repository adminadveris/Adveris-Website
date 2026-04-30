import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import type { Account } from '../types';

const ClientForm = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);

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
    house_no: '',
    street_1: '',
    street_2: '',
    street_3: '',
    landmark: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
  });

  const loadData = async () => {
    const accs = await api.getAccounts();
    setAccounts(accs);

    if (isEdit) {
      const client = await api.getClientById(id);
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
          house_no: client.house_no || '',
          street_1: client.street_1 || '',
          street_2: client.street_2 || '',
          street_3: client.street_3 || '',
          landmark: client.landmark || '',
          city: client.city || '',
          state: client.state || '',
          country: client.country || '',
          pincode: client.pincode || '',
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

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.client_name || !formData.account_id) {
      alert('Client Name and Parent Account association are mandatory.');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await api.updateClient(id, formData);
      } else {
        await api.createClient(formData);
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
             ← Abort & Return
          </button>
          <div className="firm-intel-tag">
            <span className="tag-line" /> {isEdit ? 'User Privileged Refinement' : 'Account Onboarding'}
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        
        {/* SECTION 1: IDENTITY */}
        <div className="portal-panel" style={{ padding: 48 }}>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.4, marginBottom: 32 }}>
            Personal Identification
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            <div className="portal-form-group">
              <label className="portal-form-label">Client Name</label>
              <input 
                value={formData.client_name}
                onChange={e => setFormData({ ...formData, client_name: e.target.value })}
                className="portal-form-control"
                placeholder="e.g. Vikram Malhotra"
                required
              />
            </div>
            <div className="portal-form-group">
              <label className="portal-form-label">Designation</label>
              <input 
                value={formData.designation}
                onChange={e => setFormData({ ...formData, designation: e.target.value })}
                className="portal-form-control"
                placeholder="e.g. Managing Director"
              />
            </div>
            <div className="portal-form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="portal-form-label">Parent Account</label>
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
                   Account linkage is locked for this operation.
                 </p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 2: COMMUNICATION GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          
          <div className="portal-panel" style={{ padding: 40 }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.4, marginBottom: 32 }}>
              Digital Channels (Email)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="portal-form-group">
                <label className="portal-form-label">Primary Email</label>
                <input 
                  type="email"
                  value={formData.email_1}
                  onChange={e => setFormData({ ...formData, email_1: e.target.value })}
                  className="portal-form-control"
                  placeholder="primary@firm.com"
                />
              </div>
              <div className="portal-form-group">
                <label className="portal-form-label">Secondary Email</label>
                <input 
                  type="email"
                  value={formData.email_2}
                  onChange={e => setFormData({ ...formData, email_2: e.target.value })}
                  className="portal-form-control"
                  placeholder="secondary@firm.com"
                />
              </div>
              <div className="portal-form-group">
                <label className="portal-form-label">Alternate Email</label>
                <input 
                  type="email"
                  value={formData.email_3}
                  onChange={e => setFormData({ ...formData, email_3: e.target.value })}
                  className="portal-form-control"
                  placeholder="alternate@firm.com"
                />
              </div>
            </div>
          </div>

          <div className="portal-panel" style={{ padding: 40 }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.4, marginBottom: 32 }}>
              Telephonic Channels (Phone)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="portal-form-group">
                <label className="portal-form-label">Primary Phone</label>
                <input 
                  type="tel"
                  value={formData.phone_1}
                  onChange={e => setFormData({ ...formData, phone_1: e.target.value })}
                  className="portal-form-control"
                  placeholder="+91 00000 00000"
                />
              </div>
              <div className="portal-form-group">
                <label className="portal-form-label">Secondary Phone</label>
                <input 
                  type="tel"
                  value={formData.phone_2}
                  onChange={e => setFormData({ ...formData, phone_2: e.target.value })}
                  className="portal-form-control"
                  placeholder="+91 00000 00000"
                />
              </div>
              <div className="portal-form-group">
                <label className="portal-form-label">Alternate Phone</label>
                <input 
                  type="tel"
                  value={formData.phone_3}
                  onChange={e => setFormData({ ...formData, phone_3: e.target.value })}
                  className="portal-form-control"
                  placeholder="+91 00000 00000"
                />
              </div>
            </div>
          </div>

        </div>

        {/* SECTION 3: ADDRESS */}
        <div className="portal-panel" style={{ padding: 48 }}>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.4, marginBottom: 32 }}>
             Administrative Address Grid
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 32px' }}>
            <div className="portal-form-group">
              <label className="portal-form-label">House No</label>
              <input className="portal-form-control" value={formData.house_no} onChange={e => setFormData({...formData, house_no: e.target.value})} />
            </div>
            <div className="portal-form-group">
              <label className="portal-form-label">Landmark</label>
              <input className="portal-form-control" value={formData.landmark} onChange={e => setFormData({...formData, landmark: e.target.value})} />
            </div>
            <div className="portal-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="portal-form-label">Street 1</label>
              <input className="portal-form-control" value={formData.street_1} onChange={e => setFormData({...formData, street_1: e.target.value})} />
            </div>
            <div className="portal-form-group">
              <label className="portal-form-label">Street 2</label>
              <input className="portal-form-control" value={formData.street_2} onChange={e => setFormData({...formData, street_2: e.target.value})} />
            </div>
            <div className="portal-form-group">
              <label className="portal-form-label">Street 3</label>
              <input className="portal-form-control" value={formData.street_3} onChange={e => setFormData({...formData, street_3: e.target.value})} />
            </div>
            <div className="portal-form-group">
              <label className="portal-form-label">City</label>
              <input className="portal-form-control" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
            </div>
            <div className="portal-form-group">
              <label className="portal-form-label">State</label>
              <input className="portal-form-control" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} />
            </div>
            <div className="portal-form-group">
              <label className="portal-form-label">Country</label>
              <input className="portal-form-control" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} />
            </div>
            <div className="portal-form-group">
              <label className="portal-form-label">Pincode</label>
              <input className="portal-form-control" value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} />
            </div>
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
            Discard Changes
          </button>
          <button 
            type="submit" 
            disabled={saving}
            className="btn-portal-primary"
            style={{ width: 'auto', padding: '14px 60px' }}
          >
            {saving ? 'Processing...' : (isEdit ? 'Authorize Refinement' : 'Authorize Onboarding')}
          </button>
        </div>

      </form>
    </div>
  );
};

export default ClientForm;
