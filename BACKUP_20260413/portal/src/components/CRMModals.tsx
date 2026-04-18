import React, { useState } from 'react';
import { mockApi } from '../lib/mockApi';

/* ─── Shared UI Components ─── */
const ModalShell = ({ title, sub, onClose, children }: { title: React.ReactNode; sub?: string; onClose: () => void; children: React.ReactNode }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 3000,
    background: 'rgba(5, 10, 25, 0.88)', backdropFilter: 'blur(14px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
  }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div 
      style={{
        background: 'rgba(13,27,62,0.85)', border: '1.5px solid rgba(255,255,255,0.1)',
        borderRadius: 24, padding: 48, width: '100%', maxWidth: 640,
        backdropFilter: 'blur(20px)', boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
        maxHeight: '90vh', overflowY: 'auto'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
        <div>
          {sub && <div className="firm-intel-tag" style={{ marginBottom: 12 }}><span className="tag-line" /> {sub}</div>}
          <h2 className="serif-title" style={{ fontSize: '2.2rem', color: 'white' }}>{title}</h2>
        </div>
        <button onClick={onClose} className="btn-portal-record-dots" style={{ width: 40, height: 40, fontSize: '1.5rem', background: 'rgba(255,255,255,0.05)' }}>×</button>
      </div>
      {children}
    </div>
  </div>
);

const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="portal-form-group" style={{ marginBottom: 20 }}>
    <label className="portal-form-label">{label}</label>
    {children}
  </div>
);

/* ─── ACCOUNT MODAL ─── */
export const AccountModal = ({ account, onClose, onSaved }: { account?: any; onClose: () => void; onSaved: () => void }) => {
  const [data, setData] = useState({
    account_name: account?.account_name || '',
    cin_number: account?.cin_number || '',
    pan_number: account?.pan_number || '',
    gstin_number: account?.gst_number || account?.gstin_number || '',
    industry: account?.industry || ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!data.account_name) return;
    setError(null);
    setSaving(true);
    try {
      if (account?.id) await mockApi.updateAccount(account.id, data);
      else await mockApi.createAccount(data);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally { setSaving(false); }
  };

  return (
    <ModalShell title={account ? <>Update <em>Entity</em></> : <>New <em>Account</em></>} sub="INSTITUTIONAL REGISTRATION" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {error && (
          <div style={{ padding: '14px 20px', background: 'rgba(255, 71, 87, 0.1)', border: '1px solid rgba(255, 71, 87, 0.2)', borderRadius: 12, color: '#ff4757', fontSize: '0.8rem', fontWeight: 600, marginBottom: 24 }}>
            {error}
          </div>
        )}
        <FormField label="Full Legal Entity Name">
          <input className="portal-form-control" value={data.account_name} onChange={e => setData({...data, account_name: e.target.value})} placeholder="e.g. Adveris Advisors LLP" />
        </FormField>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <FormField label="Registration (CIN/LLPIN)">
            <input className="portal-form-control font-mono" value={data.cin_number} onChange={e => setData({...data, cin_number: e.target.value})} placeholder="U1234..." />
          </FormField>
          <FormField label="Industry / Sector">
            <input className="portal-form-control" value={data.industry} onChange={e => setData({...data, industry: e.target.value})} placeholder="e.g. Finance & Banking" />
          </FormField>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <FormField label="PAN Number (Strict Unique)">
            <input className="portal-form-control font-mono" value={data.pan_number} onChange={e => setData({...data, pan_number: e.target.value})} placeholder="ABCDE1234F" />
          </FormField>
          <FormField label="GSTIN Number">
            <input className="portal-form-control font-mono" value={data.gstin_number} onChange={e => setData({...data, gstin_number: e.target.value})} placeholder="29XXXXX..." />
          </FormField>
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 32 }}>
          <button onClick={onClose} className="btn-portal-outline" style={{ flex: 1 }}>CANCEL</button>
          <button onClick={handleSave} disabled={saving || !data.account_name} className="btn-portal-primary" style={{ flex: 2 }}>
            {saving ? 'PROCESSING...' : account ? 'SAVE CHANGES' : 'CREATE ACCOUNT'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

