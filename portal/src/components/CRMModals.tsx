import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Account } from '../types';

/* ─── DRAWER STYLES ─── */
const drawerStyles = `
  @keyframes drawerSlideIn {
    from { transform: translateX(100%); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
  }
  @keyframes backdropFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .crm-drawer-backdrop {
    position: fixed;
    inset: 0;
    z-index: 2000;
    background: rgba(5, 8, 22, 0.6);
    backdrop-filter: blur(60px);
    -webkit-backdrop-filter: blur(60px);
    animation: backdropFadeIn 0.25s ease;
  }
  .crm-drawer {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 560px;
    max-width: 95vw;
    z-index: 2001;
    background: rgba(10, 18, 45, 0.97);
    border-left: 1px solid rgba(255,255,255,0.08);
    box-shadow: -40px 0 80px rgba(0,0,0,0.5);
    display: flex;
    flex-direction: column;
    animation: drawerSlideIn 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  }
  .crm-drawer-header {
    padding: 28px 36px 24px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
    background: rgba(255,153,51,0.02);
  }
  .crm-drawer-body {
    flex: 1;
    overflow-y: auto;
    padding: 32px 36px;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,153,51,0.2) transparent;
  }
  .crm-drawer-body::-webkit-scrollbar { width: 4px; }
  .crm-drawer-body::-webkit-scrollbar-track { background: transparent; }
  .crm-drawer-body::-webkit-scrollbar-thumb { background: rgba(255,153,51,0.2); border-radius: 4px; }
  .crm-drawer-footer {
    padding: 20px 36px;
    border-top: 1px solid rgba(255,255,255,0.06);
    display: flex;
    gap: 12px;
    flex-shrink: 0;
    background: rgba(0,0,0,0.2);
  }
  .crm-drawer-close {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.5);
    font-size: 1.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    line-height: 1;
  }
  .crm-drawer-close:hover {
    background: rgba(239,68,68,0.1);
    border-color: rgba(239,68,68,0.3);
    color: #ef4444;
  }
  .crm-section-label {
    font-size: 0.58rem;
    font-weight: 800;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: rgba(255,153,51,0.5);
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255,153,51,0.08);
  }
`;

const StyleInjector = () => {
  useEffect(() => {
    const id = 'crm-drawer-styles';
    if (!document.getElementById(id)) {
      const el = document.createElement('style');
      el.id = id;
      el.textContent = drawerStyles;
      document.head.appendChild(el);
    }
  }, []);
  return null;
};

const FF = ({ label, children, span }: { label: string; children: React.ReactNode; span?: boolean }) => (
  <div style={{ gridColumn: span ? '1 / -1' : undefined, marginBottom: 16 }}>
    <label className="portal-form-label" style={{ fontSize: '0.6rem', marginBottom: 6 }}>{label}</label>
    {children}
  </div>
);

/* ─── ACCOUNT MODAL (Drawer) ─── */
export const AccountModal = ({
  account,
  onClose,
  onSaved,
}: {
  account?: Account;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [data, setData] = useState({
    account_name: account?.account_name || '',
    cin_number:   account?.cin_number   || '',
    pan_number:   account?.pan_number   || '',
    gstin_number: account?.gstin_number || '',
    industry:     account?.industry     || '',
    house_no:     account?.house_no     || '',
    street_1:     account?.street_1     || '',
    street_2:     account?.street_2     || '',
    street_3:     account?.street_3     || '',
    landmark:     account?.landmark     || '',
    city:         account?.city         || '',
    state:        account?.state        || '',
    country:      account?.country      || 'India',
    pincode:      account?.pincode      || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: string, val: string) => setData(d => ({ ...d, [key]: val }));

  const handleSave = async () => {
    if (!data.account_name.trim()) {
      setError('Account Name Is Required.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      if (account?.id) await api.updateAccount(account.id, data);
      else await api.createAccount(data);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An Unexpected Error Occurred. Please Try Again.');
    } finally {
      setSaving(false);
    }
  };

  // Lock body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <>
      <StyleInjector />
      {/* Backdrop */}
      <div className="crm-drawer-backdrop" onClick={onClose} />

      {/* Drawer */}
      <div className="crm-drawer">

        {/* Header */}
        <div className="crm-drawer-header">
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(255,153,51,0.5)', marginBottom: 6 }}>
              Account Registration
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 400, color: 'white', lineHeight: 1.1 }}>
              {account ? <>Update <em style={{ fontStyle: 'italic', color: 'var(--saffron)' }}>Entity</em></> : <>New <em style={{ fontStyle: 'italic', color: 'var(--saffron)' }}>Account</em></>}
            </h2>
          </div>
          <button className="crm-drawer-close" onClick={onClose}>×</button>
        </div>

        {/* Scrollable Body */}
        <div className="crm-drawer-body">

          {error && (
            <div style={{
              padding: '12px 16px', marginBottom: 24, borderRadius: 8,
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#ef4444', fontSize: '0.8rem', fontWeight: 500
            }}>
              {error}
            </div>
          )}

          {/* Section 1: Core Registry */}
          <div className="crm-section-label">Core Registry Data</div>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <FF label="Account / Entity Name" span>
              <input
                className="portal-form-control"
                value={data.account_name}
                onChange={e => set('account_name', e.target.value)}
                placeholder="e.g. Adveris Advisors LLP"
                style={{ fontSize: '0.9rem' }}
              />
            </FF>
            <FF label="Registration (Cin / Llpin)">
              <input className="portal-form-control font-mono" value={data.cin_number} onChange={e => set('cin_number', e.target.value)} placeholder="U12345MH2020..." />
            </FF>
            <FF label="Industry / Sector">
              <input className="portal-form-control" value={data.industry} onChange={e => set('industry', e.target.value)} placeholder="e.g. Finance & Banking" />
            </FF>
            <FF label="Pan Number">
              <input className="portal-form-control font-mono" value={data.pan_number} onChange={e => set('pan_number', e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} />
            </FF>
            <FF label="Gstin Number">
              <input className="portal-form-control font-mono" value={data.gstin_number} onChange={e => set('gstin_number', e.target.value.toUpperCase())} placeholder="29AAAAA0000A1Z5" />
            </FF>
          </div>

          {/* Section 2: Address */}
          <div className="crm-section-label" style={{ marginTop: 28 }}>Administrative Address</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <FF label="House / Flat No">
              <input className="portal-form-control" value={data.house_no} onChange={e => set('house_no', e.target.value)} placeholder="e.g. 404B" />
            </FF>
            <FF label="Landmark">
              <input className="portal-form-control" value={data.landmark} onChange={e => set('landmark', e.target.value)} placeholder="Near Metro Station..." />
            </FF>
            <FF label="Street / Road 1" span>
              <input className="portal-form-control" value={data.street_1} onChange={e => set('street_1', e.target.value)} placeholder="Primary Street Address" />
            </FF>
            <FF label="Street / Area 2">
              <input className="portal-form-control" value={data.street_2} onChange={e => set('street_2', e.target.value)} placeholder="Area / Colony" />
            </FF>
            <FF label="Street / Locality 3">
              <input className="portal-form-control" value={data.street_3} onChange={e => set('street_3', e.target.value)} placeholder="Sub-Locality" />
            </FF>
            <FF label="City / Town">
              <input className="portal-form-control" value={data.city} onChange={e => set('city', e.target.value)} placeholder="Mumbai" />
            </FF>
            <FF label="State">
              <input className="portal-form-control" value={data.state} onChange={e => set('state', e.target.value)} placeholder="Maharashtra" />
            </FF>
            <FF label="Pincode">
              <input className="portal-form-control font-mono" value={data.pincode} onChange={e => set('pincode', e.target.value)} placeholder="400001" maxLength={6} />
            </FF>
            <FF label="Country">
              <input className="portal-form-control" value={data.country} onChange={e => set('country', e.target.value)} />
            </FF>
          </div>

        </div>

        {/* Pinned Footer */}
        <div className="crm-drawer-footer">
          <button onClick={onClose} className="btn-portal-outline" style={{ flex: 1, fontSize: '0.65rem' }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !data.account_name.trim()}
            className="btn-portal-primary"
            style={{ flex: 2, fontSize: '0.65rem', opacity: (!data.account_name.trim() || saving) ? 0.5 : 1 }}
          >
            {saving ? 'Processing...' : account ? 'Save Changes' : 'Create Account'}
          </button>
        </div>

      </div>
    </>
  );
};
