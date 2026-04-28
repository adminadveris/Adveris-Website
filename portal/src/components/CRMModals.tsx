import React, { useState } from 'react';
import { mockApi } from '../lib/mockApi';
import type { Account } from '../types';

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
export const AccountModal = ({ account, onClose, onSaved }: { account?: Account; onClose: () => void; onSaved: () => void }) => {
  const [data, setData] = useState({
    account_name: account?.account_name || '',
    cin_number: account?.cin_number || '',
    pan_number: account?.pan_number || '',
    gstin_number: account?.gstin_number || '',
    industry: account?.industry || '',
    // Expanded Address Fields
    house_no: account?.house_no || '',
    street_1: account?.street_1 || '',
    street_2: account?.street_2 || '',
    street_3: account?.street_3 || '',
    landmark: account?.landmark || '',
    city: account?.city || '',
    state: account?.state || '',
    country: account?.country || '',
    pincode: account?.pincode || ''
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
    <ModalShell title={account ? <>Update <em>Entity</em></> : <>New <em>Account</em></>} sub="ACCOUNT REGISTRATION" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {error && (
          <div style={{ padding: '14px 20px', background: 'rgba(255, 71, 87, 0.1)', border: '1px solid rgba(255, 71, 87, 0.2)', borderRadius: 12, color: '#ff4757', fontSize: '0.8rem', fontWeight: 600, marginBottom: 24 }}>
            {error}
          </div>
        )}
        
        <div className="portal-panel" style={{ padding: 24, marginBottom: 24, background: 'rgba(255,255,255,0.02)' }}>
          <div className="firm-intel-tag" style={{ marginBottom: 24 }}>CORE REGISTRY DATA</div>
          <FormField label="Account Name">
            <input className="portal-form-control" value={data.account_name} onChange={e => setData({...data, account_name: e.target.value})} placeholder="e.g. Adveris Advisors LLP" />
          </FormField>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <FormField label="Registration (CIN/LLPIN)">
              <input className="portal-form-control font-mono" value={data.cin_number} onChange={e => setData({...data, cin_number: e.target.value})} placeholder="U1234..." />
            </FormField>
            <FormField label="Industry / Sector">
              <input className="portal-form-control" value={data.industry} onChange={e => setData({...data, industry: e.target.value})} placeholder="e.g. Finance & Banking" />
            </FormField>
            <FormField label="PAN Number">
              <input className="portal-form-control font-mono" value={data.pan_number} onChange={e => setData({...data, pan_number: e.target.value})} placeholder="ABCDE1234F" />
            </FormField>
            <FormField label="GSTIN Number">
              <input className="portal-form-control font-mono" value={data.gstin_number} onChange={e => setData({...data, gstin_number: e.target.value})} placeholder="29XXXXX..." />
            </FormField>
          </div>
        </div>

        <div className="portal-panel" style={{ padding: 24, background: 'rgba(255,153,51,0.02)', border: '1px solid rgba(255,153,51,0.05)' }}>
          <div className="firm-intel-tag" style={{ marginBottom: 24 }}>ADMINISTRATIVE ADDRESS GRID</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px' }}>
            <FormField label="House no">
              <input className="portal-form-control" value={data.house_no} onChange={e => setData({...data, house_no: e.target.value})} />
            </FormField>
            <FormField label="Landmark">
              <input className="portal-form-control" value={data.landmark} onChange={e => setData({...data, landmark: e.target.value})} />
            </FormField>
            <div style={{ gridColumn: 'span 2' }}>
              <FormField label="Street 1">
                <input className="portal-form-control" value={data.street_1} onChange={e => setData({...data, street_1: e.target.value})} />
              </FormField>
            </div>
            <FormField label="Street 2">
              <input className="portal-form-control" value={data.street_2} onChange={e => setData({...data, street_2: e.target.value})} />
            </FormField>
            <FormField label="Street 3">
              <input className="portal-form-control" value={data.street_3} onChange={e => setData({...data, street_3: e.target.value})} />
            </FormField>
            <FormField label="City">
              <input className="portal-form-control" value={data.city} onChange={e => setData({...data, city: e.target.value})} />
            </FormField>
            <FormField label="State">
              <input className="portal-form-control" value={data.state} onChange={e => setData({...data, state: e.target.value})} />
            </FormField>
            <FormField label="Country">
              <input className="portal-form-control" value={data.country} onChange={e => setData({...data, country: e.target.value})} />
            </FormField>
            <FormField label="Pincode">
              <input className="portal-form-control font-mono" value={data.pincode} onChange={e => setData({...data, pincode: e.target.value})} />
            </FormField>
          </div>
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

