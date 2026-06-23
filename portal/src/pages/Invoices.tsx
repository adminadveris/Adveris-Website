import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { Invoice, PaymentMethod, InvoiceSender } from '../types';
import Pagination from '../components/Pagination';

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

const statusStyle = (status: string) => {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    draft: { bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: 'rgba(255,255,255,0.1)' },
    sent: { bg: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: 'rgba(96,165,250,0.2)' },
    paid: { bg: 'rgba(74,222,128,0.1)', color: '#4ade80', border: 'rgba(74,222,128,0.2)' },
    cancelled: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.2)' },
  };
  return map[status] || map.draft;
};

const Invoices = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Payment Method management state
  const [showPaymentMethodsModal, setShowPaymentMethodsModal] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [pmLoading, setPmLoading] = useState(false);
  const [editingPm, setEditingPm] = useState<Partial<PaymentMethod> | null>(null);
  const [pmSaving, setPmSaving] = useState(false);
  const [pmError, setPmError] = useState<string | null>(null);

  // Invoice Senders (billing companies) management state
  const [showSendersModal, setShowSendersModal] = useState(false);
  const [senders, setSenders] = useState<InvoiceSender[]>([]);
  const [sendersLoading, setSendersLoading] = useState(false);
  const [editingSender, setEditingSender] = useState<Partial<InvoiceSender> | null>(null);
  const [senderSaving, setSenderSaving] = useState(false);
  const [senderError, setSenderError] = useState<string | null>(null);

  const loadSenders = async () => {
    setSendersLoading(true);
    try {
      const data = await api.getInvoiceSenders();
      setSenders(data);
    } catch (err) {
      console.error('Failed to load invoice senders', err);
    } finally {
      setSendersLoading(false);
    }
  };

  useEffect(() => {
    if (showSendersModal) {
      loadSenders();
    }
  }, [showSendersModal]);

  const handleSaveSender = async () => {
    if (!editingSender?.name || !editingSender?.address_line_1 || !editingSender?.city || !editingSender?.state_province || !editingSender?.zip_postal_code || !editingSender?.country) {
      setSenderError('Please fill in Name, Address Line 1, City, State/Province, ZIP/Postal Code, and Country.');
      return;
    }
    setSenderSaving(true);
    setSenderError(null);
    try {
      if (editingSender.id) {
        await api.updateInvoiceSender(editingSender.id, editingSender);
      } else {
        await api.createInvoiceSender(editingSender);
      }
      setEditingSender(null);
      loadSenders();
    } catch (err: any) {
      setSenderError(err.message || 'Failed to save sender company.');
    } finally {
      setSenderSaving(false);
    }
  };

  const handleDeleteSender = async (id: string) => {
    if (!window.confirm('Are you sure you want to deactivate this company entity?')) return;
    try {
      await api.deleteInvoiceSender(id);
      loadSenders();
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate sender company.');
    }
  };

  const loadPaymentMethods = async () => {
    setPmLoading(true);
    try {
      const data = await api.getPaymentMethods();
      setPaymentMethods(data);
    } catch (err) {
      console.error('Failed to load payment methods', err);
    } finally {
      setPmLoading(false);
    }
  };

  useEffect(() => {
    if (showPaymentMethodsModal) {
      loadPaymentMethods();
    }
  }, [showPaymentMethodsModal]);

  const handleSavePm = async () => {
    if (!editingPm?.name || !editingPm?.account_number || !editingPm?.bank_name_branch || !editingPm?.ifsc_code) {
      setPmError('Please fill in Name, Account Number, Bank Name & Branch, and IFSC Code.');
      return;
    }
    setPmSaving(true);
    setPmError(null);
    try {
      if (editingPm.id) {
        await api.updatePaymentMethod(editingPm.id, editingPm);
      } else {
        await api.createPaymentMethod(editingPm);
      }
      setEditingPm(null);
      loadPaymentMethods();
    } catch (err: any) {
      setPmError(err.message || 'Failed to save payment method.');
    } finally {
      setPmSaving(false);
    }
  };

  const handleDeletePm = async (id: string) => {
    if (!window.confirm('Are you sure you want to deactivate this payment method?')) return;
    try {
      await api.deletePaymentMethod(id);
      loadPaymentMethods();
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate payment method.');
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        let data: Invoice[];
        if (user?.role === 'client' && user?.account_id) {
          // Clients only see invoices for their account
          data = await api.getInvoicesByAccount(user.account_id);
        } else {
          data = await api.getInvoices();
        }
        setInvoices(data);
      } catch (err: any) {
        console.warn('Invoices: Could not load (table may not exist)', err);
        setLoadError('Invoice module unavailable — database table not configured yet.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const filteredInvoices = invoices.filter(inv => {
    const matchSearch = (inv.invoice_number + inv.account_name + (inv.contact_name || '')).toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'All' || inv.status === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);

  if (loading) return <div className="portal-loader-container"><div className="portal-loader" /></div>;

  if (loadError) {
    return (
      <div className="theater-container" style={{ paddingTop: 0, paddingBottom: 40 }}>
        <div className="enterprise-toolbar">
          <div>
            <div className="enterprise-eyebrow">Finance</div>
            <h1>Invoices</h1>
          </div>
        </div>
        <div className="portal-panel" style={{ padding: '80px 40px', textAlign: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" style={{ margin: '0 auto 24px', display: 'block' }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>{loadError}</p>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.15)' }}>Run the SQL migration in your Supabase dashboard to enable invoicing.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="theater-container" style={{ paddingTop: 0, paddingBottom: 40 }}>
      <div className="enterprise-toolbar">
        <div>
          <div className="enterprise-eyebrow">Finance</div>
          <h1>Invoices</h1>
        </div>
        <div className="enterprise-toolbar__actions">
          <span className="enterprise-status enterprise-status--warning" style={{ marginRight: 12 }}>
            ₹{totalAmount.toLocaleString('en-IN')} total
          </span>
          {(user?.role === 'admin' || user?.role === 'employee') && (
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowSendersModal(true)}
                className="btn-portal-outline"
                style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                🏢 Companies
              </button>
              <button
                onClick={() => setShowPaymentMethodsModal(true)}
                className="btn-portal-outline"
                style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                🏦 Banks
              </button>
              <button onClick={() => navigate('/dashboard/invoices/new')} className="btn-portal-primary" style={{ width: 'auto' }}>
                + Create Invoice
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="enterprise-filterbar" style={{ marginBottom: 40, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flex: 1, maxWidth: 800 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
                padding: '12px 16px 12px 40px', color: 'white', fontSize: '0.85rem',
                fontFamily: 'var(--font-ui)'
              }}
            />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8, padding: '12px 16px', color: 'white', fontSize: '0.85rem',
              minWidth: 140, fontFamily: 'var(--font-ui)'
            }}
          >
            <option>All</option>
            <option>Draft</option>
            <option>Sent</option>
            <option>Paid</option>
            <option>Cancelled</option>
          </select>
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 500, opacity: 0.3, fontFamily: 'var(--font-ui)' }}>
          {filteredInvoices.length} Invoices
        </span>
      </div>

      <div className="portal-panel" style={{ padding: 0, overflow: 'visible' }}>
        <table className="portal-table-v2">
          <thead>
            <tr>
              <th style={{ paddingLeft: 60 }}>Invoice #</th>
              <th>From</th>
              <th>Account</th>
              <th>Contact</th>
              <th>Date</th>
              <th>Amount</th>
              <th style={{ textAlign: 'right', paddingRight: 60 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedInvoices.length > 0 ? paginatedInvoices.map(inv => {
              const style = statusStyle(inv.status);
              return (
                <tr key={inv.id} onClick={() => navigate(`/dashboard/invoices/${inv.id}`)} style={{ cursor: 'pointer' }}>
                  <td style={{ paddingLeft: 60 }}>
                    <span style={{ opacity: 0.5, fontFamily: 'monospace' }}>{inv.invoice_number}</span>
                  </td>
                  <td>
                    <span style={{ opacity: 0.8, fontSize: '0.85rem', color: 'white', fontWeight: 500 }}>
                      {inv.sender_details?.name || '-'}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: 'var(--gold)', fontWeight: 500 }}>{inv.account_name}</span>
                  </td>
                  <td>
                    <span style={{ opacity: 0.4, fontSize: '0.8rem' }}>{inv.contact_name || '-'}</span>
                  </td>
                  <td>
                    <span style={{ opacity: 0.4, fontSize: '0.8rem' }}>{fmtDate(inv.invoice_date)}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: 'white' }}>₹{Number(inv.total).toLocaleString('en-IN')}</span>
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: 60 }}>
                    <span style={{
                      fontWeight: 600, fontSize: '0.65rem', padding: '4px 12px',
                      borderRadius: 4, display: 'inline-block',
                      background: style.bg, color: style.color, border: `1px solid ${style.border}`,
                      textTransform: 'capitalize'
                    }}>
                      {inv.status}
                    </span>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '120px 0', opacity: 0.1 }}>
                  <p style={{ fontSize: '1.2rem', fontFamily: 'var(--font-ui)', fontWeight: 600 }}>No Invoices Created Yet...</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <Pagination
          currentPage={currentPage}
          totalItems={filteredInvoices.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
        />
      </div>

      {/* PAYMENT METHODS MANAGEMENT MODAL */}
      {showPaymentMethodsModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(3, 5, 12, 0.85)', backdropFilter: 'blur(10px)'
        }}>
          <div className="portal-panel" style={{
            width: 'min(90vw, 680px)', maxHeight: '90vh', padding: 0, overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', margin: 0 }}>
                  {editingPm ? (editingPm.id ? 'Edit Bank Details' : 'Add Bank Details') : 'Manage Payment Methods'}
                </h2>
                <p style={{ fontSize: '0.72rem', opacity: 0.3, marginTop: 4 }}>
                  {editingPm ? 'Enter bank details and transfer credentials.' : 'Configure bank transfer options available on invoices.'}
                </p>
              </div>
              <button
                onClick={() => {
                  if (editingPm) {
                    setEditingPm(null);
                  } else {
                    setShowPaymentMethodsModal(false);
                  }
                }}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px 32px', overflowY: 'auto', flex: 1 }}>
              {editingPm ? (
                /* CREATE / EDIT FORM */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {pmError && <p className="error-text" style={{ margin: 0 }}>{pmError}</p>}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="portal-form-group">
                      <label className="portal-form-label">Account Name / Label *</label>
                      <input
                        className="portal-form-control"
                        value={editingPm.name || ''}
                        onChange={e => setEditingPm(prev => ({ ...prev!, name: e.target.value }))}
                        placeholder="Adveris Bank Details"
                      />
                    </div>
                    <div className="portal-form-group">
                      <label className="portal-form-label">Account Number *</label>
                      <input
                        className="portal-form-control"
                        value={editingPm.account_number || ''}
                        onChange={e => setEditingPm(prev => ({ ...prev!, account_number: e.target.value }))}
                        placeholder="362011200047393"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="portal-form-group">
                      <label className="portal-form-label">Bank Name & Branch *</label>
                      <input
                        className="portal-form-control"
                        value={editingPm.bank_name_branch || ''}
                        onChange={e => setEditingPm(prev => ({ ...prev!, bank_name_branch: e.target.value }))}
                        placeholder="AXIS Bank, Shimoga Branch"
                      />
                    </div>
                    <div className="portal-form-group">
                      <label className="portal-form-label">IFSC Code *</label>
                      <input
                        className="portal-form-control"
                        value={editingPm.ifsc_code || ''}
                        onChange={e => setEditingPm(prev => ({ ...prev!, ifsc_code: e.target.value.toUpperCase() }))}
                        placeholder="UTIB0000232"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="portal-form-group">
                      <label className="portal-form-label">PAN (Optional)</label>
                      <input
                        className="portal-form-control"
                        value={editingPm.pan || ''}
                        onChange={e => setEditingPm(prev => ({ ...prev!, pan: e.target.value.toUpperCase() }))}
                        placeholder="AWEPA2330F"
                      />
                    </div>
                    <div className="portal-form-group" style={{ display: 'flex', alignItems: 'center', height: '100%', paddingTop: 28 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.82rem', color: 'white' }}>
                        <input
                          type="checkbox"
                          checked={editingPm.is_active !== false}
                          onChange={e => setEditingPm(prev => ({ ...prev!, is_active: e.target.checked }))}
                          style={{ accentColor: 'var(--gold)', width: 16, height: 16 }}
                        />
                        Active (show as select option on Invoices)
                      </label>
                    </div>
                  </div>

                  {/* FOREIGN TRANSFER FIELDS */}
                  <div style={{ marginTop: 12, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gold)', marginBottom: 12, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                      🌐 Foreign Transfer Details (Optional)
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                      <div className="portal-form-group">
                        <label className="portal-form-label">SWIFT / BIC Code</label>
                        <input
                          className="portal-form-control"
                          value={editingPm.swift_code || ''}
                          onChange={e => setEditingPm(prev => ({ ...prev!, swift_code: e.target.value.toUpperCase() }))}
                          placeholder="UTIBINBBXXX"
                        />
                      </div>
                      <div className="portal-form-group">
                        <label className="portal-form-label">Routing / Transit Number</label>
                        <input
                          className="portal-form-control"
                          value={editingPm.routing_number || ''}
                          onChange={e => setEditingPm(prev => ({ ...prev!, routing_number: e.target.value }))}
                          placeholder="021000021"
                        />
                      </div>
                    </div>
                    <div className="portal-form-group">
                      <label className="portal-form-label">Bank Address</label>
                      <textarea
                        className="portal-form-control"
                        rows={2}
                        value={editingPm.bank_address || ''}
                        onChange={e => setEditingPm(prev => ({ ...prev!, bank_address: e.target.value }))}
                        placeholder="Shimoga Main Branch, AXIS Bank Ltd..."
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* BANK METHODS LIST */
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                      {paymentMethods.length} Registered bank account(s)
                    </span>
                    <button
                      onClick={() => setEditingPm({ is_active: true })}
                      className="btn-portal-primary"
                      style={{ width: 'auto', padding: '8px 16px', fontSize: '0.72rem' }}
                    >
                      + Add New Bank
                    </button>
                  </div>

                  {pmLoading ? (
                    <div style={{ padding: '40px 0', textAlign: 'center' }}><div className="portal-loader" style={{ margin: '0 auto' }} /></div>
                  ) : paymentMethods.length === 0 ? (
                    <div style={{ padding: '60px 0', textTransform: 'uppercase', textAlign: 'center', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>
                      No payment methods registered.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {paymentMethods.map(pm => (
                        <div
                          key={pm.id}
                          style={{
                            padding: '16px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            opacity: pm.is_active ? 1 : 0.45
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white', margin: 0 }}>{pm.name}</h4>
                              {!pm.is_active && (
                                <span style={{ fontSize: '0.6rem', background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '2px 6px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase' }}>
                                  Inactive
                                </span>
                              )}
                              {pm.is_active && (
                                <span style={{ fontSize: '0.6rem', background: 'rgba(74,222,128,0.15)', color: '#4ade80', padding: '2px 6px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase' }}>
                                  Active
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>
                              {pm.bank_name_branch} • Acc: {pm.account_number}
                            </p>
                            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', margin: '2px 0 0' }}>
                              IFSC: {pm.ifsc_code} {pm.pan ? `• PAN: ${pm.pan}` : ''}
                            </p>
                            {(pm.swift_code || pm.routing_number) && (
                              <p style={{ fontSize: '0.7rem', color: 'var(--gold)', margin: '4px 0 0', display: 'flex', gap: 8 }}>
                                <span>🌐 Foreign:</span>
                                {pm.swift_code && <span>SWIFT: {pm.swift_code}</span>}
                                {pm.routing_number && <span>Routing: {pm.routing_number}</span>}
                              </p>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              onClick={() => setEditingPm(pm)}
                              className="btn-portal-outline"
                              style={{ width: 'auto', padding: '6px 12px', fontSize: '0.7rem' }}
                            >
                              Edit
                            </button>
                            {pm.is_active && (
                              <button
                                onClick={() => handleDeletePm(pm.id)}
                                style={{
                                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
                                  borderRadius: 6, color: '#f87171', padding: '6px 12px', fontSize: '0.7rem', cursor: 'pointer'
                                }}
                              >
                                Deactivate
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '20px 32px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              {editingPm ? (
                <>
                  <button onClick={handleSavePm} disabled={pmSaving} className="btn-portal-primary" style={{ width: 'auto', padding: '10px 24px' }}>
                    {pmSaving ? 'Saving...' : 'Save Bank Details'}
                  </button>
                  <button onClick={() => setEditingPm(null)} className="btn-portal-outline" style={{ width: 'auto' }}>
                    Cancel
                  </button>
                </>
              ) : (
                <button onClick={() => setShowPaymentMethodsModal(false)} className="btn-portal-outline" style={{ width: 'auto' }}>
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SENDERS MANAGEMENT MODAL */}
      {showSendersModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(3, 5, 12, 0.85)', backdropFilter: 'blur(10px)'
        }}>
          <div className="portal-panel" style={{
            width: 'min(90vw, 680px)', maxHeight: '90vh', padding: 0, overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', margin: 0 }}>
                  {editingSender ? (editingSender.id ? 'Edit Company Profile' : 'Add Company Profile') : 'Manage Invoice Senders'}
                </h2>
                <p style={{ fontSize: '0.72rem', opacity: 0.3, marginTop: 4 }}>
                  {editingSender ? 'Enter billing company address and logo URL or reference path.' : 'Configure sender companies available on invoices.'}
                </p>
              </div>
              <button
                onClick={() => {
                  if (editingSender) {
                    setEditingSender(null);
                  } else {
                    setShowSendersModal(false);
                  }
                }}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px 32px', overflowY: 'auto', flex: 1 }}>
              {editingSender ? (
                /* CREATE / EDIT FORM */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {senderError && <p className="error-text" style={{ margin: 0 }}>{senderError}</p>}

                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
                    <div className="portal-form-group">
                      <label className="portal-form-label">Company Name *</label>
                      <input
                        className="portal-form-control"
                        value={editingSender.name || ''}
                        onChange={e => setEditingSender(prev => ({ ...prev!, name: e.target.value }))}
                        placeholder="Adveris Advisors LLP"
                      />
                    </div>
                    <div className="portal-form-group">
                      <label className="portal-form-label">Logo URL or Path *</label>
                      <input
                        className="portal-form-control"
                        value={editingSender.logo_key || ''}
                        onChange={e => setEditingSender(prev => ({ ...prev!, logo_key: e.target.value }))}
                        placeholder="https://example.com/logo.png or /favicon.svg"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="portal-form-group">
                      <label className="portal-form-label">Address Line 1 *</label>
                      <input
                        className="portal-form-control"
                        value={editingSender.address_line_1 || ''}
                        onChange={e => setEditingSender(prev => ({ ...prev!, address_line_1: e.target.value }))}
                        placeholder="Level 14 & 15, Concorde Towers"
                      />
                    </div>
                    <div className="portal-form-group">
                      <label className="portal-form-label">Address Line 2 (Optional)</label>
                      <input
                        className="portal-form-control"
                        value={editingSender.address_line_2 || ''}
                        onChange={e => setEditingSender(prev => ({ ...prev!, address_line_2: e.target.value }))}
                        placeholder="UB City, 1 Vittal Mallya Road"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                    <div className="portal-form-group">
                      <label className="portal-form-label">City *</label>
                      <input
                        className="portal-form-control"
                        value={editingSender.city || ''}
                        onChange={e => setEditingSender(prev => ({ ...prev!, city: e.target.value }))}
                        placeholder="Bengaluru"
                      />
                    </div>
                    <div className="portal-form-group">
                      <label className="portal-form-label">State / Province *</label>
                      <input
                        className="portal-form-control"
                        value={editingSender.state_province || ''}
                        onChange={e => setEditingSender(prev => ({ ...prev!, state_province: e.target.value }))}
                        placeholder="Karnataka"
                      />
                    </div>
                    <div className="portal-form-group">
                      <label className="portal-form-label">ZIP / Postal Code *</label>
                      <input
                        className="portal-form-control"
                        value={editingSender.zip_postal_code || ''}
                        onChange={e => setEditingSender(prev => ({ ...prev!, zip_postal_code: e.target.value }))}
                        placeholder="560001"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="portal-form-group">
                      <label className="portal-form-label">Country *</label>
                      <input
                        className="portal-form-control"
                        value={editingSender.country || ''}
                        onChange={e => setEditingSender(prev => ({ ...prev!, country: e.target.value }))}
                        placeholder="India"
                      />
                    </div>
                    <div className="portal-form-group" style={{ display: 'flex', alignItems: 'center', height: '100%', paddingTop: 28 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.82rem', color: 'white' }}>
                        <input
                          type="checkbox"
                          checked={editingSender.is_active !== false}
                          onChange={e => setEditingSender(prev => ({ ...prev!, is_active: e.target.checked }))}
                          style={{ accentColor: 'var(--gold)', width: 16, height: 16 }}
                        />
                        Active (show as sender options on Invoices)
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                /* SENDERS LIST */
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                      {senders.length} Registered billing company profile(s)
                    </span>
                    <button
                      onClick={() => setEditingSender({ is_active: true })}
                      className="btn-portal-primary"
                      style={{ width: 'auto', padding: '8px 16px', fontSize: '0.72rem' }}
                    >
                      + Add Company
                    </button>
                  </div>

                  {sendersLoading ? (
                    <div style={{ padding: '40px 0', textAlign: 'center' }}><div className="portal-loader" style={{ margin: '0 auto' }} /></div>
                  ) : senders.length === 0 ? (
                    <div style={{ padding: '60px 0', textTransform: 'uppercase', textAlign: 'center', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>
                      No company entities registered.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {senders.map(s => (
                        <div
                          key={s.id}
                          style={{
                            padding: '16px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            opacity: s.is_active ? 1 : 0.45
                          }}
                        >
                          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                            {s.logo_key ? (
                              <img
                                src={s.logo_key}
                                alt="logo"
                                style={{ width: 36, height: 36, objectFit: 'contain', background: 'rgba(255,255,255,0.05)', padding: 4, borderRadius: 6 }}
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            ) : (
                              <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold)' }}>
                                Co
                              </div>
                            )}
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white', margin: 0 }}>{s.name}</h4>
                                {!s.is_active && (
                                  <span style={{ fontSize: '0.6rem', background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '2px 6px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase' }}>
                                    Inactive
                                  </span>
                                )}
                                {s.is_active && (
                                  <span style={{ fontSize: '0.6rem', background: 'rgba(74,222,128,0.15)', color: '#4ade80', padding: '2px 6px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase' }}>
                                    Active
                                  </span>
                                )}
                              </div>
                              <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>
                                {s.address_line_1}{s.address_line_2 ? `, ${s.address_line_2}` : ''}
                              </p>
                              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', margin: '2px 0 0' }}>
                                {s.city}, {s.state_province} {s.zip_postal_code}, {s.country}
                              </p>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              onClick={() => setEditingSender(s)}
                              className="btn-portal-outline"
                              style={{ width: 'auto', padding: '6px 12px', fontSize: '0.7rem' }}
                            >
                              Edit
                            </button>
                            {s.is_active && (
                              <button
                                onClick={() => handleDeleteSender(s.id)}
                                style={{
                                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
                                  borderRadius: 6, color: '#f87171', padding: '6px 12px', fontSize: '0.7rem', cursor: 'pointer'
                                }}
                              >
                                Deactivate
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '20px 32px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              {editingSender ? (
                <>
                  <button onClick={handleSaveSender} disabled={senderSaving} className="btn-portal-primary" style={{ width: 'auto', padding: '10px 24px' }}>
                    {senderSaving ? 'Saving...' : 'Save Company Details'}
                  </button>
                  <button onClick={() => setEditingSender(null)} className="btn-portal-outline" style={{ width: 'auto' }}>
                    Cancel
                  </button>
                </>
              ) : (
                <button onClick={() => setShowSendersModal(false)} className="btn-portal-outline" style={{ width: 'auto' }}>
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
