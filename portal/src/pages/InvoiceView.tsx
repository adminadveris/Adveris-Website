import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { Invoice } from '../types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

const InvoiceView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  // Send email state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.getInvoiceById(id).then(inv => {
      setInvoice(inv);
      if (inv) {
        setEmailTo(inv.contact_email || '');
        setEmailBody(`Dear ${inv.contact_name || 'Sir/Madam'},\n\nPlease find attached the invoice ${inv.invoice_number} for an amount of ₹${Number(inv.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}.\n\nPayment Terms: ${inv.payment_terms || 'Net 30'}\n${inv.due_date ? `Due Date: ${fmtDate(inv.due_date)}` : ''}\n\nKindly arrange the payment at your earliest convenience.\n\nRegards,\nAdveris Advisors LLP`);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const drawFooter = (pdf: jsPDF, pageNum: number) => {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const marginLeft = 40;
    
    // Draw the "This is a computer-generated invoice." text centered
    const text = 'This is a computer-generated invoice.';
    pdf.text(text, pdfWidth / 2, pdfHeight - 35, { align: 'center' });
    
    // Draw page number
    const pageText = `Page ${pageNum}`;
    pdf.text(pageText, pdfWidth - marginLeft, pdfHeight - 35, { align: 'right' });
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('invoice-print');
    if (!element) return;

    setDownloadingPDF(true);
    try {
      const innerCard = element.firstElementChild as HTMLElement;
      if (!innerCard) return;

      // Save original styles to restore later
      const originalWidth = innerCard.style.width;
      const originalMaxWidth = innerCard.style.maxWidth;
      const originalMinWidth = innerCard.style.minWidth;

      // Force a fixed width of 800px for consistent layout across all screen resolutions
      innerCard.style.width = '800px';
      innerCard.style.maxWidth = '800px';
      innerCard.style.minWidth = '800px';

      // Add temporary class for styling (resets shadows/margins/padding)
      innerCard.classList.add('pdf-capture');

      // Render the entire invoice card as a single canvas
      const canvas = await html2canvas(innerCard, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 800,
        windowWidth: 800
      });

      // Clean up class and styles immediately
      innerCard.classList.remove('pdf-capture');
      innerCard.style.width = originalWidth;
      innerCard.style.maxWidth = originalMaxWidth;
      innerCard.style.minWidth = originalMinWidth;

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const pdf = new jsPDF('p', 'pt', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const marginLeft = 40;
      const marginRight = 40;
      const marginTop = 50;
      const marginBottom = 60;
      const printableWidth = pdfWidth - marginLeft - marginRight;
      const printableHeight = pdfHeight - marginTop - marginBottom;

      // Calculate how tall the image will be in the PDF coordinate system
      const totalPdfHeight = (imgHeight * printableWidth) / imgWidth;

      let remainingHeight = totalPdfHeight;
      let currentPageNum = 1;
      let sourceY = 0; // Offset in PDF points

      while (remainingHeight > 0) {
        if (currentPageNum > 1) {
          pdf.addPage();
        }

        // Draw the segment of the canvas corresponding to the current page.
        // We use a negative Y offset (marginTop - sourceY) to draw the next segment of the canvas.
        pdf.addImage(imgData, 'JPEG', marginLeft, marginTop - sourceY, printableWidth, totalPdfHeight);

        // Draw a white rectangle over the top margin to cover any overflow
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pdfWidth, marginTop, 'F');

        // Draw a white rectangle over the bottom margin to cover any overflow
        pdf.rect(0, pdfHeight - marginBottom, pdfWidth, marginBottom, 'F');

        // Draw footer (this is a computer-generated invoice + page number) on each page
        drawFooter(pdf, currentPageNum);

        sourceY += printableHeight;
        remainingHeight -= printableHeight;
        currentPageNum++;
      }

      // Trigger browser save dialog
      pdf.save(`Invoice_${invoice?.invoice_number || 'download'}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Failed to save PDF. Please try again.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleStatusChange = async (newStatus: Invoice['status']) => {
    if (!invoice?.id) return;
    setStatusUpdating(true);
    try {
      const updated = await api.updateInvoice(invoice.id, { status: newStatus });
      setInvoice(updated);
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleSendEmail = () => {
    if (!emailTo) return;
    // Use mailto: with subject and body (opens default email client)
    const subject = encodeURIComponent(`Invoice ${invoice?.invoice_number} — Adveris Advisors LLP`);
    const body = encodeURIComponent(emailBody);
    window.open(`mailto:${emailTo}?subject=${subject}&body=${body}`, '_blank');
    setEmailSent(true);
    // Also update status to 'sent' if still draft
    if (invoice?.status === 'draft') {
      handleStatusChange('sent');
    }
    setTimeout(() => {
      setShowEmailModal(false);
      setEmailSent(false);
    }, 2000);
  };

  const isStaff = user?.role === 'admin' || user?.role === 'employee';

  if (loading) return <div className="portal-loader-container"><div className="portal-loader" /></div>;

  if (!invoice) return (
    <div className="record-empty-state">
      <h1 className="serif-title">Invoice not found</h1>
      <button onClick={() => navigate('/dashboard/invoices')} className="btn-portal-outline">Back to Invoices</button>
    </div>
  );

  const statusColor: Record<string, string> = {
    draft: 'rgba(255,255,255,0.4)',
    sent: '#60a5fa',
    paid: '#4ade80',
    cancelled: '#ef4444'
  };

  const isGst = invoice.gst_type === 'gst' || (Number(invoice.tax_rate) > 0);

  return (
    <>
      {/* Screen-only controls */}
      <div className="invoice-screen-controls no-print">
        <div className="enterprise-toolbar" style={{ marginBottom: 24 }}>
          <div>
            <button onClick={() => navigate('/dashboard/invoices')} className="enterprise-link-button">← Back to Invoices</button>
            <div className="enterprise-eyebrow">Invoice</div>
            <h1>{invoice.invoice_number}</h1>
          </div>
          <div className="enterprise-toolbar__actions" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {isStaff && (
              <select
                value={invoice.status}
                onChange={e => handleStatusChange(e.target.value as Invoice['status'])}
                disabled={statusUpdating}
                style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, padding: '10px 16px', color: statusColor[invoice.status] || 'white',
                  fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer'
                }}
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            )}

            {/* Send Email Button */}
            {isStaff && (
              <button
                onClick={() => setShowEmailModal(true)}
                className="btn-portal-outline"
                style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                Send
              </button>
            )}

            {isStaff && invoice.status === 'draft' && (
              <button
                onClick={() => navigate(`/dashboard/invoices/${invoice.id}/edit`)}
                className="btn-portal-outline"
                style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                ✏️ Edit
              </button>
            )}

            <button 
              onClick={handleDownloadPDF} 
              disabled={downloadingPDF} 
              className="btn-portal-primary" 
              style={{ width: 'auto' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {downloadingPDF ? (
                  <div className="portal-loader" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'white' }} />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                )}
                {downloadingPDF ? 'Saving PDF...' : 'Save as PDF'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* PRINTABLE INVOICE */}
      <div className="invoice-print-container" id="invoice-print">
        <div style={{
          maxWidth: 800, margin: '0 auto', background: 'white', borderRadius: 16,
          padding: '60px 64px', color: '#111', fontFamily: 'var(--font-sans)',
          boxShadow: '0 4px 60px rgba(0,0,0,0.3)'
        }}>

          {/* Document Title (Center Top) */}
          <div className="invoice-title-wrapper" style={{ textAlign: 'center', marginBottom: 32, borderBottom: '1px solid #f0f0f0', paddingBottom: 16 }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#d97706', margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {invoice.invoice_type || (isGst ? 'Tax Invoice' : 'Invoice')}
            </h2>
          </div>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 48 }}>
            <div>
              {invoice.sender_details ? (
                invoice.sender_details.logo_key ? (
                  <img 
                    src={invoice.sender_details.logo_key} 
                    alt={invoice.sender_details.name} 
                    style={{ maxHeight: 60, maxWidth: 180, objectFit: 'contain', marginBottom: 6 }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0a1628', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                    {invoice.sender_details.name}
                  </h1>
                )
              ) : (
                <>
                  <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#0a1628', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Adveris</h1>
                  <p style={{ fontSize: '0.75rem', color: '#888', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 500 }}>Advisors LLP</p>
                </>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '1rem', color: '#111', fontWeight: 600, margin: '0 0 6px', fontFamily: 'monospace' }}>{invoice.invoice_number}</p>
              <p style={{ fontSize: '0.78rem', color: '#555', margin: '0 0 4px' }}>Date: {fmtDate(invoice.invoice_date)}</p>
              {invoice.due_date && <p style={{ fontSize: '0.78rem', color: '#555' }}>Due: {fmtDate(invoice.due_date)}</p>}
            </div>
          </div>

          {/* Bill To / From */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 48 }}>
            <div>
              <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Bill To</p>
              <p style={{ fontSize: '1rem', fontWeight: 600, color: '#111', margin: '0 0 4px' }}>{invoice.account_name}</p>
              {invoice.contact_name && <p style={{ fontSize: '0.85rem', color: '#555', margin: '0 0 2px' }}>{invoice.contact_name}</p>}
              {invoice.contact_designation && <p style={{ fontSize: '0.78rem', color: '#888', margin: '0 0 2px' }}>{invoice.contact_designation}</p>}
              {invoice.contact_email && <p style={{ fontSize: '0.78rem', color: '#888', margin: '0 0 2px' }}>{invoice.contact_email}</p>}
              {invoice.contact_phone && <p style={{ fontSize: '0.78rem', color: '#888', margin: '0 0 2px' }}>{invoice.contact_phone}</p>}
              {invoice.billing_address && <p style={{ fontSize: '0.78rem', color: '#888', margin: '4px 0 0' }}>{invoice.billing_address}</p>}
              {isGst && invoice.gstin && <p style={{ fontSize: '0.78rem', color: '#555', margin: '4px 0 0', fontWeight: 600 }}>GSTIN: {invoice.gstin}</p>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>From</p>
              {invoice.sender_details ? (
                <>
                  <p style={{ fontSize: '1rem', fontWeight: 600, color: '#111', margin: '0 0 4px' }}>{invoice.sender_details.name}</p>
                  <p style={{ fontSize: '0.78rem', color: '#888', margin: '0 0 2px' }}>{invoice.sender_details.address_line_1}</p>
                  {invoice.sender_details.address_line_2 && <p style={{ fontSize: '0.78rem', color: '#888', margin: '0 0 2px' }}>{invoice.sender_details.address_line_2}</p>}
                  <p style={{ fontSize: '0.78rem', color: '#888', margin: '0 0 2px' }}>
                    {invoice.sender_details.city}, {invoice.sender_details.state_province} {invoice.sender_details.zip_postal_code}
                  </p>
                  <p style={{ fontSize: '0.78rem', color: '#888' }}>{invoice.sender_details.country}</p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '1rem', fontWeight: 600, color: '#111', margin: '0 0 4px' }}>Adveris Advisors LLP</p>
                  <p style={{ fontSize: '0.78rem', color: '#888', margin: '0 0 2px' }}>Bengaluru, Karnataka</p>
                  <p style={{ fontSize: '0.78rem', color: '#888', margin: '0 0 2px' }}>admin@adverisadvisors.in</p>
                  <p style={{ fontSize: '0.78rem', color: '#888' }}>+91 97393 82704</p>
                </>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 32 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ width: '6%', textAlign: 'left', padding: '12px 8px', fontSize: '0.72rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>#</th>
                <th style={{ width: '54%', textAlign: 'left', padding: '12px 8px', fontSize: '0.72rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</th>
                <th style={{ width: '10%', textAlign: 'center', padding: '12px 8px', fontSize: '0.72rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Qty</th>
                <th style={{ width: '15%', textAlign: 'right', padding: '12px 8px', fontSize: '0.72rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rate</th>
                <th style={{ width: '15%', textAlign: 'right', padding: '12px 8px', fontSize: '0.72rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.line_items || []).map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '14px 8px', fontSize: '0.82rem', color: '#bbb' }}>{i + 1}</td>
                  <td style={{ padding: '14px 8px', fontSize: '0.88rem', color: '#333', fontWeight: 500, whiteSpace: 'pre-wrap' }}>{item.description}</td>
                  <td style={{ padding: '14px 8px', fontSize: '0.85rem', color: '#555', textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ padding: '14px 8px', fontSize: '0.85rem', color: '#555', textAlign: 'right', fontFamily: 'monospace' }}>₹{Number(item.rate).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '14px 8px', fontSize: '0.88rem', color: '#111', textAlign: 'right', fontWeight: 600, fontFamily: 'monospace' }}>₹{Number(item.amount).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 48 }}>
            <div style={{ width: 300 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ fontSize: '0.85rem', color: '#888' }}>Subtotal</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#333', fontFamily: 'monospace' }}>₹{Number(invoice.subtotal).toLocaleString('en-IN')}</span>
              </div>
              {isGst && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ fontSize: '0.85rem', color: '#888' }}>GST ({invoice.tax_rate}%)</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#333', fontFamily: 'monospace' }}>₹{Number(invoice.tax_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderTop: '2px solid #d97706' }}>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#d97706' }}>Total</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#d97706', fontFamily: 'monospace' }}>₹{Number(invoice.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          {invoice.payment_details && (
            <div style={{ marginBottom: 32, padding: '20px 24px', background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                Bank Transfer Details
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
                <div>
                  <p style={{ fontSize: '0.7rem', color: '#888', margin: 0 }}>Account Name</p>
                  <p style={{ fontSize: '0.85rem', color: '#111', fontWeight: 600, margin: '2px 0 0' }}>{invoice.payment_details.name}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.7rem', color: '#888', margin: 0 }}>Account Number</p>
                  <p style={{ fontSize: '0.85rem', color: '#111', fontWeight: 600, fontFamily: 'monospace', margin: '2px 0 0' }}>{invoice.payment_details.account_number}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.7rem', color: '#888', margin: 0 }}>Bank & Branch</p>
                  <p style={{ fontSize: '0.85rem', color: '#111', fontWeight: 600, margin: '2px 0 0' }}>{invoice.payment_details.bank_name_branch}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.7rem', color: '#888', margin: 0 }}>IFSC Code</p>
                  <p style={{ fontSize: '0.85rem', color: '#111', fontWeight: 600, fontFamily: 'monospace', margin: '2px 0 0' }}>{invoice.payment_details.ifsc_code}</p>
                </div>
                {invoice.payment_details.pan && (
                  <div>
                    <p style={{ fontSize: '0.7rem', color: '#888', margin: 0 }}>PAN</p>
                    <p style={{ fontSize: '0.85rem', color: '#111', fontWeight: 600, fontFamily: 'monospace', margin: '2px 0 0' }}>{invoice.payment_details.pan}</p>
                  </div>
                )}
              </div>

              {/* Foreign Transfer Fields - Show ONLY if populated */}
              {(invoice.payment_details.swift_code || invoice.payment_details.routing_number || invoice.payment_details.bank_address) && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                    Foreign Wire Transfer Instructions
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
                    {invoice.payment_details.swift_code && (
                      <div>
                        <p style={{ fontSize: '0.7rem', color: '#888', margin: 0 }}>SWIFT / BIC Code</p>
                        <p style={{ fontSize: '0.85rem', color: '#111', fontWeight: 600, fontFamily: 'monospace', margin: '2px 0 0' }}>{invoice.payment_details.swift_code}</p>
                      </div>
                    )}
                    {invoice.payment_details.routing_number && (
                      <div>
                        <p style={{ fontSize: '0.7rem', color: '#888', margin: 0 }}>Routing / Transit Number</p>
                        <p style={{ fontSize: '0.85rem', color: '#111', fontWeight: 600, fontFamily: 'monospace', margin: '2px 0 0' }}>{invoice.payment_details.routing_number}</p>
                      </div>
                    )}
                    {invoice.payment_details.bank_address && (
                      <div style={{ gridColumn: 'span 2' }}>
                        <p style={{ fontSize: '0.7rem', color: '#888', margin: 0 }}>Bank Address</p>
                        <p style={{ fontSize: '0.82rem', color: '#333', margin: '2px 0 0', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{invoice.payment_details.bank_address}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes & Terms */}
          {invoice.notes && (
            <div style={{ marginBottom: 40, padding: '20px 24px', background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Notes & Terms</p>
              <p style={{ fontSize: '0.82rem', color: '#666', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{invoice.notes}</p>
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Payment Terms</p>
            <p style={{ fontSize: '0.82rem', color: '#666' }}>{invoice.payment_terms || 'Net 30'}</p>
          </div>

          {/* Footer */}
          <div style={{ marginTop: 60, paddingTop: 24, borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
            <p style={{ fontSize: '0.62rem', color: '#bbb', marginTop: 4 }}>This is a computer-generated invoice.</p>
          </div>

          {/* Page Number for Printout */}
          <div className="print-page-number-footer" style={{ display: 'none' }}>
            Page&nbsp;
          </div>
        </div>
      </div>

      {/* SEND EMAIL MODAL */}
      {showEmailModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(3, 5, 12, 0.85)', backdropFilter: 'blur(10px)'
        }}>
          <div className="portal-panel" style={{
            width: 'min(90vw, 560px)', padding: 0, overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ padding: '28px 36px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', margin: 0 }}>Send Invoice via Email</h2>
                <p style={{ fontSize: '0.72rem', opacity: 0.3, marginTop: 4 }}>{invoice.invoice_number}</p>
              </div>
              <button onClick={() => setShowEmailModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ padding: '28px 36px' }}>
              {emailSent ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" style={{ margin: '0 auto 16px', display: 'block' }}>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <p style={{ fontSize: '0.9rem', color: '#4ade80', fontWeight: 600 }}>Email client opened!</p>
                  <p style={{ fontSize: '0.75rem', opacity: 0.3, marginTop: 4 }}>Invoice marked as Sent.</p>
                </div>
              ) : (
                <>
                  <div className="portal-form-group" style={{ marginBottom: 20 }}>
                    <label className="portal-form-label">Recipient Email</label>
                    <input
                      className="portal-form-control"
                      type="email"
                      value={emailTo}
                      onChange={e => setEmailTo(e.target.value)}
                      placeholder="client@example.com"
                      style={{ fontSize: '0.88rem' }}
                    />
                    {invoice.contact_email && emailTo !== invoice.contact_email && (
                      <button
                        onClick={() => setEmailTo(invoice.contact_email || '')}
                        style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.7rem', cursor: 'pointer', marginTop: 6 }}
                      >
                        Use contact email: {invoice.contact_email}
                      </button>
                    )}
                  </div>

                  <div className="portal-form-group" style={{ marginBottom: 24 }}>
                    <label className="portal-form-label">Email Body</label>
                    <textarea
                      className="portal-form-control"
                      value={emailBody}
                      onChange={e => setEmailBody(e.target.value)}
                      rows={8}
                      style={{ fontSize: '0.82rem', lineHeight: 1.7, minHeight: 200 }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={handleSendEmail} disabled={!emailTo} className="btn-portal-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                      Send Invoice
                    </button>
                    <button onClick={() => setShowEmailModal(false)} className="btn-portal-outline" style={{ width: 'auto' }}>Cancel</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InvoiceView;
