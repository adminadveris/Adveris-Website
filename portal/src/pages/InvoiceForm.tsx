import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import SearchableSelect from '../components/SearchableSelect';
import type { Account, Client, InvoiceLineItem, PaymentMethod, InvoiceSender } from '../types';

const emptyLine = (): InvoiceLineItem => ({ description: '', quantity: 1, rate: 0, amount: 0 });

const InvoiceForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const isInitialLoadRef = useRef(true);
  const { user } = useAuth();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [accountId, setAccountId] = useState('');
  const [accountName, setAccountName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactDesignation, setContactDesignation] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [gstType, setGstType] = useState<'gst' | 'non_gst'>('gst');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [taxRate, setTaxRate] = useState(18);
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([emptyLine()]);
  const [invoiceType, setInvoiceType] = useState('Tax Invoice');

  // Payment Method States
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPmId, setSelectedPmId] = useState('');
  const [showForeignTransfer, setShowForeignTransfer] = useState(false);
  const [swiftCode, setSwiftCode] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [bankAddress, setBankAddress] = useState('');

  // Sender Company States
  const [senders, setSenders] = useState<InvoiceSender[]>([]);
  const [selectedSenderId, setSelectedSenderId] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const [accs, pms, sndrs, inv] = await Promise.all([
          api.getAccounts(),
          api.getPaymentMethods(),
          api.getInvoiceSenders(),
          id ? api.getInvoiceById(id) : Promise.resolve(null)
        ]);
        setAccounts(accs);
        
        const activePms = pms.filter(p => p.is_active);
        setPaymentMethods(activePms);

        const activeSndrs = sndrs.filter(s => s.is_active);
        setSenders(activeSndrs);

        if (inv) {
          // Editing mode
          setAccountId(inv.account_id || '');
          setAccountName(inv.account_name || '');
          setContactName(inv.contact_name || '');
          setContactEmail(inv.contact_email || '');
          setContactPhone(inv.contact_phone || '');
          setContactDesignation(inv.contact_designation || '');
          setBillingAddress(inv.billing_address || '');
          setGstin(inv.gstin || '');
          setGstType(inv.gst_type || 'gst');
          setInvoiceType(inv.invoice_type || 'Tax Invoice');
          setInvoiceDate(inv.invoice_date || '');
          setDueDate(inv.due_date || '');
          setPaymentTerms(inv.payment_terms || 'Net 30');
          setTaxRate(inv.tax_rate ?? 18);
          setNotes(inv.notes || '');
          setLineItems(inv.line_items?.length ? inv.line_items : [emptyLine()]);
          setSelectedPmId(inv.payment_method_id || '');
          setSelectedSenderId(inv.sender_id || '');
          if (inv.payment_details) {
            setSwiftCode(inv.payment_details.swift_code || '');
            setRoutingNumber(inv.payment_details.routing_number || '');
            setBankAddress(inv.payment_details.bank_address || '');
            if (inv.payment_details.swift_code || inv.payment_details.routing_number || inv.payment_details.bank_address) {
              setShowForeignTransfer(true);
            }
          }
        } else {
          // Creating mode, set defaults
          if (activePms.length > 0) {
            setSelectedPmId(activePms[0].id);
          }
          if (activeSndrs.length > 0) {
            setSelectedSenderId(activeSndrs[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load initial data', err);
        setError('Failed to load form data.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id]);

  useEffect(() => {
    if (!loading) {
      isInitialLoadRef.current = false;
    }
  }, [loading]);

  const selectedSender = useMemo(() => senders.find(s => s.id === selectedSenderId) || null, [selectedSenderId, senders]);

  const selectedPm = useMemo(() => paymentMethods.find(p => p.id === selectedPmId) || null, [selectedPmId, paymentMethods]);

  useEffect(() => {
    if (selectedPm) {
      setSwiftCode(selectedPm.swift_code || '');
      setRoutingNumber(selectedPm.routing_number || '');
      setBankAddress(selectedPm.bank_address || '');
      if (selectedPm.swift_code || selectedPm.routing_number || selectedPm.bank_address) {
        setShowForeignTransfer(true);
      } else {
        setShowForeignTransfer(false);
      }
    } else {
      setSwiftCode('');
      setRoutingNumber('');
      setBankAddress('');
      setShowForeignTransfer(false);
    }
  }, [selectedPm]);

  // Load clients + auto-fill account details when account changes
  useEffect(() => {
    if (!accountId) {
      setClients([]);
      setSelectedAccount(null);
      return;
    }
    const acc = accounts.find(a => a.id === accountId);
    setSelectedAccount(acc || null);

    // Auto-fill from account
    if (acc && !isInitialLoadRef.current) {
      setAccountName(acc.account_name);
      setGstin(acc.gstin_number || '');
      // Build address from account fields
      const addressParts = [acc.house_no, acc.street_1, acc.street_2, acc.street_3, acc.landmark, acc.city, acc.state, acc.country, acc.pincode].filter(Boolean);
      setBillingAddress(addressParts.join(', '));
      // Auto-detect GST type
      if (acc.gstin_number) {
        setGstType('gst');
        if (invoiceType === 'Invoice' || !invoiceType) setInvoiceType('Tax Invoice');
      }
    }

    api.getClientsByAccount(accountId).then(setClients).catch(() => setClients([]));
  }, [accountId, accounts]);

  // Auto-set tax to 0 for Non-GST
  useEffect(() => {
    if (gstType === 'non_gst') {
      setTaxRate(0);
    } else {
      setTaxRate(18);
    }
  }, [gstType]);

  const updateLineItem = (index: number, field: keyof InvoiceLineItem, value: string | number) => {
    setLineItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      updated[index].amount = Number(updated[index].quantity) * Number(updated[index].rate);
      return updated;
    });
  };

  const addLineItem = () => setLineItems(prev => [...prev, emptyLine()]);
  const removeLineItem = (index: number) => setLineItems(prev => prev.filter((_, i) => i !== index));

  const subtotal = useMemo(() => lineItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0), [lineItems]);
  const taxAmount = useMemo(() => subtotal * (taxRate / 100), [subtotal, taxRate]);
  const total = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount]);

  const handleSubmit = async () => {
    if (!accountName) return setError('Please select an account.');
    if (lineItems.length === 0 || !lineItems.some(li => li.description.trim())) return setError('Please add at least one line item with a description.');

    setSubmitting(true);
    setError(null);

    try {
      const paymentDetails = selectedPm ? {
        name: selectedPm.name,
        account_number: selectedPm.account_number,
        bank_name_branch: selectedPm.bank_name_branch,
        ifsc_code: selectedPm.ifsc_code,
        pan: selectedPm.pan,
        ...(showForeignTransfer ? {
          swift_code: swiftCode,
          routing_number: routingNumber,
          bank_address: bankAddress
        } : {})
      } : null;

      const senderDetails = selectedSender ? {
        name: selectedSender.name,
        address_line_1: selectedSender.address_line_1,
        address_line_2: selectedSender.address_line_2,
        city: selectedSender.city,
        state_province: selectedSender.state_province,
        zip_postal_code: selectedSender.zip_postal_code,
        country: selectedSender.country,
        logo_key: selectedSender.logo_key
      } : null;

      const invoiceData = {
        account_id: accountId || undefined,
        account_name: accountName,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        contact_designation: contactDesignation,
        billing_address: billingAddress,
        gstin: gstin,
        gst_type: gstType,
        invoice_type: invoiceType,
        invoice_date: invoiceDate,
        due_date: dueDate || undefined,
        payment_terms: paymentTerms,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total,
        notes,
        line_items: lineItems.filter(li => li.description.trim()),
        payment_method_id: selectedPmId || undefined,
        payment_details: paymentDetails,
        sender_id: selectedSenderId || undefined,
        sender_details: senderDetails
      };

      let savedInvoice;
      if (isEdit) {
        savedInvoice = await api.updateInvoice(id!, invoiceData);
      } else {
        savedInvoice = await api.createInvoice({
          ...invoiceData,
          status: 'draft'
        });
      }

      setSuccess(true);
      setTimeout(() => navigate(`/dashboard/invoices/${savedInvoice.id}`), 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to save invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="portal-loader-container"><div className="portal-loader" /></div>;

  if (success) return (
    <div className="portal-success-state">
      <div className="success-icon"></div>
      <h2>Invoice {isEdit ? <em>Updated</em> : <em>Created</em>}</h2>
      <p>{isEdit ? 'The invoice has been updated in your finance registry.' : 'The invoice has been saved to your finance registry.'}</p>
    </div>
  );

  return (
    <div className="theater-container" style={{ padding: '40px 0 100px' }}>
      <div className="portal-panel-stack" style={{ maxWidth: 1100, margin: '0 auto' }}>

        <div className="portal-layout-split">
          <div className="portal-main-column">
            {/* GST TYPE TOGGLE & CUSTOM INVOICE TYPE */}
            <div className="portal-panel" style={{ padding: '24px 40px', marginBottom: 20 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Tax Treatment:</span>
                  <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 4, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setGstType('gst');
                        if (invoiceType === 'Invoice' || !invoiceType) setInvoiceType('Tax Invoice');
                      }}
                      style={{
                        padding: '10px 24px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.3s',
                        background: gstType === 'gst' ? 'var(--saffron)' : 'transparent',
                        color: gstType === 'gst' ? 'var(--navy)' : 'rgba(255,255,255,0.4)',
                      }}
                    >
                      GST Invoice
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGstType('non_gst');
                        if (invoiceType === 'Tax Invoice' || !invoiceType) setInvoiceType('Invoice');
                      }}
                      style={{
                        padding: '10px 24px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.3s',
                        background: gstType === 'non_gst' ? 'var(--saffron)' : 'transparent',
                        color: gstType === 'non_gst' ? 'var(--navy)' : 'rgba(255,255,255,0.4)',
                      }}
                    >
                      Non-GST Invoice
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 260 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Invoice Type Name:</span>
                  <input
                    type="text"
                    className="portal-form-control"
                    style={{ flex: 1, minHeight: 38, height: 38, fontSize: '0.85rem' }}
                    value={invoiceType}
                    onChange={e => setInvoiceType(e.target.value)}
                    placeholder="e.g. Proforma Invoice, Tax Invoice, etc."
                  />
                </div>
              </div>
            </div>

            {/* FROM SENDER COMPANY */}
            <div className="portal-panel" style={{ padding: 40, marginBottom: 20 }}>
              <div className="section-header" style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>Billing Entity (From)</h3>
                <p style={{ opacity: 0.3, fontSize: '0.72rem' }}>Select the company raising this invoice.</p>
              </div>

              <div className="portal-form-group" style={{ marginBottom: 20 }}>
                <label className="portal-form-label">Select Company Profile</label>
                {senders.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: '#ef4444' }}>
                    No company profiles found. Please add a company profile first in Invoices / Companies.
                  </p>
                ) : (
                  <select
                    className="portal-form-control"
                    value={selectedSenderId}
                    onChange={e => setSelectedSenderId(e.target.value)}
                  >
                    {senders.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.city}, {s.country})</option>
                    ))}
                  </select>
                )}
              </div>

              {selectedSender && (
                <div style={{
                  padding: '20px 24px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex', gap: 20, alignItems: 'center'
                }}>
                  {selectedSender.logo_key && (
                    <img
                      src={selectedSender.logo_key}
                      alt="Company Logo"
                      style={{ maxHeight: 48, maxWidth: 100, objectFit: 'contain', background: 'rgba(255,255,255,0.05)', padding: 6, borderRadius: 8 }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                  <div>
                    <p style={{ fontSize: '0.88rem', color: 'white', fontWeight: 600, margin: 0 }}>{selectedSender.name}</p>
                    <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>
                      {selectedSender.address_line_1}{selectedSender.address_line_2 ? `, ${selectedSender.address_line_2}` : ''}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', margin: '2px 0 0' }}>
                      {selectedSender.city}, {selectedSender.state_province} {selectedSender.zip_postal_code}, {selectedSender.country}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ACCOUNT & CONTACT */}
            <div className="portal-panel" style={{ padding: 40, marginBottom: 20 }}>
              <div className="section-header" style={{ marginBottom: 32 }}>
                <h2 className="serif-title" style={{ fontSize: '1.8rem', fontWeight: 600 }}>{isEdit ? 'Edit Invoice' : 'New Invoice'}</h2>
                <p style={{ opacity: 0.4, fontSize: '0.85rem' }}>Select an account and configure invoice details.</p>
              </div>

              <div className="portal-form-group" style={{ marginBottom: 32 }}>
                <label className="portal-form-label">Bill To — Account</label>
                <SearchableSelect
                  options={accounts.map(a => ({ id: a.id, label: a.account_name, sublabel: a.pan_number }))}
                  value={accountId}
                  onChange={val => {
                    setAccountId(val);
                    // Reset contact
                    setContactName('');
                    setContactEmail('');
                    setContactPhone('');
                    setContactDesignation('');
                  }}
                  placeholder="Select Account..."
                />
              </div>

              {/* Auto-populated Account Details */}
              {selectedAccount && (
                <div style={{ padding: '20px 24px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 24 }}>
                  <p style={{ fontSize: '0.68rem', fontWeight: 700, opacity: 0.3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Account Details (Auto-populated)</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <p style={{ fontSize: '0.68rem', opacity: 0.35 }}>Account Name</p>
                      <p style={{ fontSize: '0.85rem', color: 'white', fontWeight: 500 }}>{selectedAccount.account_name}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.68rem', opacity: 0.35 }}>PAN</p>
                      <p style={{ fontSize: '0.85rem', color: 'white', fontFamily: 'monospace' }}>{selectedAccount.pan_number || '—'}</p>
                    </div>
                    {gstType === 'gst' && (
                      <div>
                        <p style={{ fontSize: '0.68rem', opacity: 0.35 }}>GSTIN</p>
                        <p style={{ fontSize: '0.85rem', color: selectedAccount.gstin_number ? 'var(--gold)' : 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
                          {selectedAccount.gstin_number || 'Not on record'}
                        </p>
                      </div>
                    )}
                    <div>
                      <p style={{ fontSize: '0.68rem', opacity: 0.35 }}>Industry</p>
                      <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>{selectedAccount.industry || '—'}</p>
                    </div>
                  </div>
                  {billingAddress && (
                    <div style={{ marginTop: 12 }}>
                      <p style={{ fontSize: '0.68rem', opacity: 0.35 }}>Billing Address</p>
                      <p style={{ fontSize: '0.82rem', opacity: 0.6 }}>{billingAddress}</p>
                    </div>
                  )}
                </div>
              )}

              {/* GSTIN editable for GST invoices */}
              {gstType === 'gst' && (
                <div className="portal-form-group" style={{ marginBottom: 24 }}>
                  <label className="portal-form-label">GSTIN {selectedAccount?.gstin_number ? '(from account)' : ''}</label>
                  <input
                    className="portal-form-control"
                    value={gstin}
                    onChange={e => setGstin(e.target.value.toUpperCase())}
                    placeholder="22AAAAA0000A1Z5"
                    maxLength={15}
                    style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}
                  />
                </div>
              )}

              {/* Contact selector */}
              {clients.length > 0 && (
                <div className="portal-form-group" style={{ marginBottom: 24 }}>
                  <label className="portal-form-label">Contact Person (Send Invoice To)</label>
                  <select
                    className="portal-form-control"
                    value={contactName}
                    onChange={e => {
                      const cli = clients.find(c => c.client_name === e.target.value);
                      if (cli) {
                        setContactName(cli.client_name);
                        setContactEmail(cli.email_1 || '');
                        setContactPhone(cli.phone_1 || '');
                        setContactDesignation(cli.designation || '');
                      } else {
                        setContactName('');
                        setContactEmail('');
                        setContactPhone('');
                        setContactDesignation('');
                      }
                    }}
                  >
                    <option value="">Select Contact...</option>
                    {clients.map(c => <option key={c.id} value={c.client_name}>{c.client_name} — {c.designation || 'Contact'}</option>)}
                  </select>
                </div>
              )}

              {contactName && (
                <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(255,153,51,0.03)', border: '1px solid rgba(255,153,51,0.08)', marginBottom: 24 }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>Contact Details</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <p style={{ fontSize: '0.82rem', color: 'white' }}>{contactName}</p>
                    <p style={{ fontSize: '0.82rem', opacity: 0.5 }}>{contactDesignation}</p>
                    <p style={{ fontSize: '0.82rem', opacity: 0.5 }}>{contactEmail}</p>
                    <p style={{ fontSize: '0.82rem', opacity: 0.5 }}>{contactPhone}</p>
                  </div>
                </div>
              )}
            </div>

            {/* PAYMENT METHOD SELECTOR */}
            <div className="portal-panel" style={{ padding: 40, marginBottom: 20 }}>
              <div className="section-header" style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>Payment Method</h3>
                <p style={{ opacity: 0.3, fontSize: '0.72rem' }}>Select bank account details to print on this invoice.</p>
              </div>

              <div className="portal-form-group" style={{ marginBottom: 20 }}>
                <label className="portal-form-label">Select Bank Account</label>
                {paymentMethods.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: '#ef4444' }}>
                    No payment methods found. Please add a bank account first in Invoices / Banks.
                  </p>
                ) : (
                  <select
                    className="portal-form-control"
                    value={selectedPmId}
                    onChange={e => setSelectedPmId(e.target.value)}
                  >
                    {paymentMethods.map(pm => (
                      <option key={pm.id} value={pm.id}>{pm.name} ({pm.bank_name_branch})</option>
                    ))}
                  </select>
                )}
              </div>

              {selectedPm && (
                <div style={{
                  padding: '20px 24px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                  marginBottom: 20
                }}>
                  <p style={{ fontSize: '0.68rem', fontWeight: 700, opacity: 0.3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                    Bank Account Details (Preview)
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <p style={{ fontSize: '0.68rem', opacity: 0.35 }}>Bank & Branch</p>
                      <p style={{ fontSize: '0.85rem', color: 'white', fontWeight: 500 }}>{selectedPm.bank_name_branch}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.68rem', opacity: 0.35 }}>Account Number</p>
                      <p style={{ fontSize: '0.85rem', color: 'white', fontFamily: 'monospace' }}>{selectedPm.account_number}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.68rem', opacity: 0.35 }}>IFSC Code</p>
                      <p style={{ fontSize: '0.85rem', color: 'white', fontFamily: 'monospace' }}>{selectedPm.ifsc_code}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.68rem', opacity: 0.35 }}>PAN</p>
                      <p style={{ fontSize: '0.85rem', color: 'white', fontFamily: 'monospace' }}>{selectedPm.pan || '—'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* FOREIGN TRANSFER OPTIONAL TOGGLE & FIELDS */}
              {selectedPm && (
                <div style={{ marginTop: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.82rem', color: 'white', marginBottom: 16 }}>
                    <input
                      type="checkbox"
                      checked={showForeignTransfer}
                      onChange={e => setShowForeignTransfer(e.target.checked)}
                      style={{ accentColor: 'var(--gold)', width: 16, height: 16 }}
                    />
                    Enable Foreign Transfer Credentials on Invoice
                  </label>

                  {showForeignTransfer && (
                    <div style={{
                      padding: '24px', borderRadius: 12,
                      background: 'rgba(255,153,51,0.02)', border: '1px solid rgba(255,153,51,0.08)',
                      display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.3s ease'
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="portal-form-group">
                          <label className="portal-form-label">SWIFT / BIC Code</label>
                          <input
                            className="portal-form-control"
                            value={swiftCode}
                            onChange={e => setSwiftCode(e.target.value.toUpperCase())}
                            placeholder="UTIBINBBXXX"
                          />
                        </div>
                        <div className="portal-form-group">
                          <label className="portal-form-label">Routing / Transit Number</label>
                          <input
                            className="portal-form-control"
                            value={routingNumber}
                            onChange={e => setRoutingNumber(e.target.value)}
                            placeholder="021000021"
                          />
                        </div>
                      </div>
                      <div className="portal-form-group">
                        <label className="portal-form-label">Bank Address</label>
                        <textarea
                          className="portal-form-control"
                          rows={2}
                          value={bankAddress}
                          onChange={e => setBankAddress(e.target.value)}
                          placeholder="Shimoga Main Branch, AXIS Bank Ltd..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* LINE ITEMS */}
            <div className="portal-panel" style={{ padding: 40 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>Line Items</h3>
                  <p style={{ fontSize: '0.72rem', opacity: 0.3 }}>Add services, products, or deliverables.</p>
                </div>
                <button onClick={addLineItem} className="btn-portal-outline" style={{ width: 'auto', padding: '8px 20px', fontSize: '0.7rem' }}>
                  + Add Row
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '0.68rem', fontWeight: 600, opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Description</th>
                      <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '0.68rem', fontWeight: 600, opacity: 0.4, textTransform: 'uppercase', width: 90, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Qty</th>
                      <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '0.68rem', fontWeight: 600, opacity: 0.4, textTransform: 'uppercase', width: 130, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Rate (₹)</th>
                      <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '0.68rem', fontWeight: 600, opacity: 0.4, textTransform: 'uppercase', width: 130, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Amount</th>
                      <th style={{ width: 40, borderBottom: '1px solid rgba(255,255,255,0.06)' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item, i) => (
                      <tr key={i}>
                        <td style={{ padding: '8px' }}>
                          <textarea
                            className="portal-form-control"
                            value={item.description}
                            onChange={e => updateLineItem(i, 'description', e.target.value)}
                            placeholder="Service description..."
                            style={{ fontSize: '0.85rem', padding: '10px 12px', minHeight: '60px', resize: 'vertical' }}
                            rows={2}
                          />
                        </td>
                        <td style={{ padding: '8px' }}>
                          <input
                            className="portal-form-control"
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e => updateLineItem(i, 'quantity', parseInt(e.target.value) || 0)}
                            style={{ textAlign: 'center', fontSize: '0.85rem', padding: '10px 8px' }}
                          />
                        </td>
                        <td style={{ padding: '8px' }}>
                          <input
                            className="portal-form-control"
                            type="number"
                            min="0"
                            value={item.rate}
                            onChange={e => updateLineItem(i, 'rate', parseFloat(e.target.value) || 0)}
                            style={{ textAlign: 'right', fontSize: '0.85rem', padding: '10px 12px' }}
                          />
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>
                          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'white', fontFamily: 'monospace' }}>
                            ₹{item.amount.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          {lineItems.length > 1 && (
                            <button
                              onClick={() => removeLineItem(i)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.1rem', padding: 4 }}
                              title="Remove"
                            >×</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* TOTALS */}
              <div style={{ marginTop: 32, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: 280 }}>
                    <span style={{ fontSize: '0.82rem', opacity: 0.5 }}>Subtotal</span>
                    <span style={{ fontSize: '0.92rem', fontWeight: 500, color: 'white', fontFamily: 'monospace' }}>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {gstType === 'gst' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: 280, alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.82rem', opacity: 0.5 }}>GST</span>
                        <input
                          type="number"
                          value={taxRate}
                          onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
                          style={{
                            width: 52, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 6, padding: '4px 8px', color: 'white', fontSize: '0.75rem',
                            textAlign: 'center', fontFamily: 'monospace'
                          }}
                        />
                        <span style={{ fontSize: '0.75rem', opacity: 0.3 }}>%</span>
                      </div>
                      <span style={{ fontSize: '0.92rem', fontWeight: 500, color: 'white', fontFamily: 'monospace' }}>₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: 280, borderTop: '2px solid var(--gold)', paddingTop: 12 }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--gold)' }}>Total</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--gold)', fontFamily: 'monospace' }}>₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SIDE COLUMN */}
          <div className="portal-side-column">
            <div className="portal-panel" style={{ padding: 32 }}>
              <div className="firm-intel-tag">Invoice Settings</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 24 }}>
                <div className="portal-form-group">
                  <label>Invoice Date</label>
                  <input type="date" className="portal-form-control" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
                </div>
                <div className="portal-form-group">
                  <label>Due Date</label>
                  <input type="date" className="portal-form-control" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
                <div className="portal-form-group">
                  <label>Payment Terms</label>
                  <select className="portal-form-control" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)}>
                    <option>Net 15</option>
                    <option>Net 30</option>
                    <option>Net 45</option>
                    <option>Net 60</option>
                    <option>Due on Receipt</option>
                    <option>Custom</option>
                  </select>
                </div>
                <div className="portal-form-group">
                  <label>Notes / Terms</label>
                  <textarea
                    className="portal-form-control"
                    rows={3}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Payment instructions, bank details, etc..."
                  />
                </div>
              </div>

              <div className="form-actions" style={{ marginTop: 40, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 24 }}>
                <button onClick={handleSubmit} disabled={submitting} className="btn-portal-primary full-width">
                  {submitting ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Invoice')}
                </button>
                <button onClick={() => navigate('/dashboard/invoices')} className="btn-portal-outline full-width" style={{ marginTop: 12 }}>Cancel</button>
                {error && <p className="error-text" style={{ marginTop: 16 }}>{error}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceForm;
