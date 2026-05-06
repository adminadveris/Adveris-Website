import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { servicesData } from '../data/servicesData';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import SearchableSelect from '../components/SearchableSelect';
import type { Account, Request, User } from '../types';

type Step = 'pan' | 'register' | 'scoping' | 'spec' | 'full';

const NewRequest = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(id ? 'full' : 'pan');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [staff, setStaff] = useState<User[]>([]);

  const isAdmin = user?.role === 'admin' || user?.role === 'employee';

  // Account Data
  const [pan, setPan] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountId, setAccountId] = useState<string | null>(null);

  // Statutory Identifiers
  const [cin, setCin] = useState('');
  const [gstin, setGstin] = useState('');
  const [industry, setIndustry] = useState('');

  // 9-Point Administrative Address Grid
  const [houseNo, setHouseNo] = useState('');
  const [street1, setStreet1] = useState('');
  const [street2, setStreet2] = useState('');
  const [street3, setStreet3] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country] = useState('India');
  const [pincode, setPincode] = useState('');

  // Service Data
  const [selectedService, setSelectedService] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  
  // High-Level Admin/Staff Operational Fields
  const [priority, setPriority] = useState<Request['priority']>('Standard');
  const [status, setStatus] = useState<Request['status']>('active');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [clientComms, setClientComms] = useState('');
  const [requestNumber, setRequestNumber] = useState(`ADV-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [selectedSubServices, setSelectedSubServices] = useState<string[]>([]);
  
  // Governance Fields
  const [verificationStatus, setVerificationStatus] = useState<Request['verification_status']>('Pending');
  const [verificationRemarks, setVerificationRemarks] = useState('');
  const [litigationScan, setLitigationScan] = useState<'CLEAN' | 'PENDING' | 'FLAGGED' | 'SEVERE'>('CLEAN');
  
  // Performance Metrics
  const [approvedDate, setApprovedDate] = useState('');
  const [daysLeft, setDaysLeft] = useState<number | string>('');

  // Documentation
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<Request['attached_files']>([]);
  const [existingFileInfo, setExistingFileInfo] = useState<Request['attached_file']>(null);

  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (!user) return;
      try {
        const [accs, staffList] = await Promise.all([
          api.getAccounts(),
          api.getStaffProfiles()
        ]);
        setAccounts(accs);
        setStaff(staffList);
        
        if (id) {
          const requests = await api.getRecords();
          const existing = requests.find((r: Request) => r.id === id);
          if (existing) {
            setAccountId(existing.account_id);
            setAccountName(existing.account_name);
            setPan(accs.find(a => a.id === existing.account_id)?.pan_number || '');
            setSelectedService(existing.primary_service || '');
            setAdditionalInfo(existing.description || '');
            setPriority(existing.priority || 'Standard');
            setStatus(existing.status || 'active');
            setDueDate(existing.due_date || '');
            setAssignedTo(existing.assigned_to || '');
            setInternalNotes(existing.internal_notes || '');
            setClientComms(existing.client_comms || '');
            setRequestNumber(existing.request_number);
            setSelectedSubServices(existing.sub_services || (existing.additional_services ? existing.additional_services.split(', ') : []));
            setVerificationStatus(existing.verification_status || 'Pending');
            setVerificationRemarks(existing.verification_remarks || '');
            setApprovedDate(existing.approved_date || '');
            setDaysLeft(existing.days_left || '');
            if (existing.attached_file) {
              setExistingFileInfo(existing.attached_file);
            }
            if (existing.attached_files) {
              setExistingFiles(existing.attached_files);
            }
            setStep('full');
          }
        } else if (user.role === 'admin' || user.role === 'employee') {
          setStep('full');
        }
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, user]);

  // Bi-directional PAN/Account Sync for Admins
  useEffect(() => {
    if (isAdmin && pan.length === 10) {
      const match = accounts.find(a => a.pan_number.toUpperCase() === pan.toUpperCase());
      if (match && match.id !== accountId) {
        setAccountId(match.id);
        setAccountName(match.account_name);
        setLitigationScan(match.litigation_scan || 'CLEAN');
      }
    }
  }, [pan, accounts, isAdmin]);

  const validatePan = (val: string) => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(val);
  };

  const handlePanCheck = async (e: FormEvent) => {
    e.preventDefault();
    if (!pan) return;
    
    if (!validatePan(pan)) {
      setError('Invalid PAN Format. Expected: ABCDE1234F');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const existing = await api.findAccountByPAN(pan);
      if (existing) {
        setAccountId(existing.id);
        setAccountName(existing.account_name);
        setStep('scoping');
      } else {
        setStep('register');
      }
    } catch (err: any) {
      setError(err.message || 'Verification Error.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    
    const errors: string[] = [];
    if (isAdmin && !accountId) errors.push('accountId');
    if (!accountName) errors.push('accountName');
    if (!selectedService) errors.push('selectedService');
    if (!pan) errors.push('pan');
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      setError('Please Ensure All Mandatory Fields (Account, Service Domain, PAN) Are Complete.');
      return;
    }

    setSubmitting(true);
    setError('');
    setValidationErrors([]);

    try {
      let finalAccountId = accountId;
      if (!finalAccountId && !isAdmin) {
        const newAcc = await api.createAccount({
          account_name: accountName,
          pan_number: pan,
          litigation_scan: litigationScan
        });
        finalAccountId = newAcc.id;
      } else if (finalAccountId && isAdmin) {
        await api.updateAccount(finalAccountId, {
          litigation_scan: litigationScan
        });
      }

      const payload: Partial<Request> = {
        account_id: finalAccountId || '',
        account_name: accountName,
        title: additionalInfo || selectedService, // Use description as title if provided
        primary_service: selectedService,
        sub_service: selectedSubServices.join(', ') || 'General', // Fixing Not-Null Constraint
        description: additionalInfo,
        additional_services: selectedSubServices.join(', '),
        sub_services: selectedSubServices,
        client_comms: clientComms,
      };

      if (isAdmin) {
        if (priority) payload.priority = priority;
        if (status) payload.status = status;
        if (dueDate) payload.due_date = dueDate;
        if (assignedTo) payload.assigned_to = assignedTo;
        if (internalNotes) payload.internal_notes = internalNotes;
        if (requestNumber) payload.request_number = requestNumber;
        payload.verification_status = verificationStatus;
        payload.verification_remarks = verificationRemarks;
        payload.approved_date = approvedDate;
        payload.days_left = daysLeft;
      }

      if (attachedFiles.length > 0) {
        try {
          const uploadPromises = attachedFiles.map(file => api.uploadFile(file).then(url => ({
            name: file.name,
            size: file.size,
            type: file.type,
            url
          })));
          
          const uploadedAssets = await Promise.all(uploadPromises);
          payload.attached_files = [...(existingFiles || []), ...uploadedAssets];
          
          // For legacy compatibility, set the first file as attached_file
          if (!payload.attached_file && uploadedAssets.length > 0) {
            payload.attached_file = uploadedAssets[0];
          }
        } catch (uploadErr) {
          console.error("FileUploadError:", uploadErr);
          throw new Error("Critical: System failed to persist documentation assets. Please check storage bucket permissions.");
        }
      } else if (existingFiles && existingFiles.length > 0) {
        payload.attached_files = existingFiles;
      }

      if (id) {
        await api.updateRecord(id, payload);
      } else {
        await api.createRecord(payload);
      }

      setSuccess(true);
      setTimeout(() => navigate(`/dashboard/requests${id ? `/${id}` : ''}`), 1800);
    } catch (err: any) {
      console.error("Save error:", err);
      setError(err.message || 'Submission Failed. Please Check Network Connectivity.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="portal-content" style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}>
      <div className="portal-loader" />
    </div>
  );

  if (success) return (
    <div className="portal-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ color: 'var(--emerald)', marginBottom: 8 }}>
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <h2 className="serif-title" style={{ fontWeight: 600 }}>Request <em>Saved</em></h2>
      <p style={{ opacity: 0.4 }}>Administrative Request Has Been Successfully Committed To The Governance Vault.</p>
    </div>
  );


  const getInputStyle = (field: string) => ({
    border: validationErrors.includes(field) ? '1px solid var(--saffron)' : '1px solid rgba(255,255,255,0.1)',
    transition: 'border 0.3s ease'
  });

  return (
    <div className="theater-container" style={{ paddingTop: 20, paddingBottom: 80 }}>
      <div style={{ marginBottom: 24 }} />

      <div>
        {!isAdmin && (
           <div className="portal-request-grid-center">
              {step === 'pan' && (
                <div className="portal-panel" style={{ maxWidth: 600, padding: 40, textAlign: 'center' }}>
                  <h2 className="serif-title" style={{ marginBottom: 12, fontWeight: 600 }}>Entity <em>Identity</em></h2>
                  <p style={{ opacity: 0.4, marginBottom: 24 }}>Verify The Legal Entity Via Permanent Account Number.</p>
                  <form onSubmit={handlePanCheck}>
                    <div className="portal-form-group">
                      <label className="portal-form-label">PAN Identifier</label>
                      <input 
                        required 
                        className="portal-form-control" 
                        style={{ textAlign: 'center', fontSize: '2rem', ...getInputStyle('pan') }} 
                        value={pan} 
                        onChange={e => setPan(e.target.value.toUpperCase())} 
                        placeholder="ABCDE1234F"
                      />
                    </div>
                    <button type="submit" className="btn-portal-primary" style={{ width: '100%', marginTop: 20 }}>Verify & Proceed</button>
                    {error && <p style={{ color: 'var(--saffron)', fontSize: '0.75rem', marginTop: 16 }}>{error}</p>}
                  </form>
                </div>
              )}

              {step === 'register' && (
                <div className="portal-panel" style={{ maxWidth: 900, padding: 40 }}>
                  <h2 className="serif-title" style={{ marginBottom: 12, textAlign: 'center', fontWeight: 600 }}>New Entity <em>Registry</em></h2>
                  <p style={{ opacity: 0.4, marginBottom: 32, textAlign: 'center' }}>Identity <strong>{pan}</strong> Not Found. Initialize Professional Registration.</p>
                  
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setLoading(true);
                    try {
                      const newAcc = await api.createAccount({ 
                        account_name: accountName, 
                        pan_number: pan,
                        cin_number: cin,
                        gstin_number: gstin,
                        industry: industry,
                        house_no: houseNo,
                        street_1: street1,
                        street_2: street2,
                        street_3: street3,
                        landmark: landmark,
                        city: city,
                        state: state,
                        country: country,
                        pincode: pincode
                      });
                      setAccountId(newAcc.id);
                      setStep('scoping');
                    } catch (err: any) {
                      setError(err.message);
                    } finally {
                      setLoading(false);
                    }
                  }}>
                    <div className="portal-form-grid-2" style={{ gap: 40 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div className="firm-intel-tag" style={{ marginBottom: 8 }}>Statutory Identifiers</div>
                        <div className="portal-form-group">
                          <label className="portal-form-label">Legal Entity Name</label>
                          <input required className="portal-form-control" style={getInputStyle('accountName')} value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="Full Legal Name..." />
                        </div>
                        <div className="portal-form-grid-2" style={{ gap: 16 }}>
                          <div className="portal-form-group">
                            <label className="portal-form-label">CIN Number</label>
                            <input className="portal-form-control" value={cin} onChange={e => setCin(e.target.value)} placeholder="U1234..." />
                          </div>
                          <div className="portal-form-group">
                            <label className="portal-form-label">GSTIN Number</label>
                            <input className="portal-form-control" value={gstin} onChange={e => setGstin(e.target.value)} placeholder="29AA..." />
                          </div>
                        </div>
                        <div className="portal-form-group">
                          <label className="portal-form-label">Industry Sector</label>
                          <select className="portal-form-control" value={industry} onChange={e => setIndustry(e.target.value)}>
                            <option value="">Select Sector...</option>
                            <option value="Venture Capital">Venture Capital</option>
                            <option value="Healthcare Tech">Healthcare Tech</option>
                            <option value="Manufacturing">Manufacturing</option>
                            <option value="Financial Services">Financial Services</option>
                            <option value="Real Estate">Real Estate</option>
                          </select>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="firm-intel-tag" style={{ marginBottom: 8 }}>Address Grid</div>
                        <div className="portal-form-group">
                          <label className="portal-form-label">House No / Flat / Unit</label>
                          <input className="portal-form-control" value={houseNo} onChange={e => setHouseNo(e.target.value)} />
                        </div>
                        <div className="portal-form-grid-2" style={{ gap: 16 }}>
                          <div className="portal-form-group">
                            <label className="portal-form-label">Street 1</label>
                            <input className="portal-form-control" value={street1} onChange={e => setStreet1(e.target.value)} />
                          </div>
                          <div className="portal-form-group">
                            <label className="portal-form-label">Street 2</label>
                            <input className="portal-form-control" value={street2} onChange={e => setStreet2(e.target.value)} />
                          </div>
                        </div>
                        <div className="portal-form-grid-3" style={{ gap: 12 }}>
                          <div className="portal-form-group">
                            <label className="portal-form-label">City</label>
                            <input className="portal-form-control" value={city} onChange={e => setCity(e.target.value)} />
                          </div>
                          <div className="portal-form-group">
                            <label className="portal-form-label">State</label>
                            <input className="portal-form-control" value={state} onChange={e => setState(e.target.value)} />
                          </div>
                          <div className="portal-form-group">
                            <label className="portal-form-label">Pincode</label>
                            <input className="portal-form-control" value={pincode} onChange={e => setPincode(e.target.value)} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 40 }}>
                      <button type="submit" className="btn-portal-primary" style={{ width: '100%' }}>Initialize Entity</button>
                      <button type="button" onClick={() => setStep('pan')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', width: 'auto', textAlign: 'left', fontSize: '0.7rem', cursor: 'pointer', padding: '10px 0' }}>← Back</button>
                    </div>
                    {error && <p style={{ color: 'var(--saffron)', fontSize: '0.75rem', marginTop: 16, textAlign: 'center' }}>{error}</p>}
                  </form>
                </div>
              )}

              {step === 'scoping' && (
                 <div className="portal-panel" style={{ maxWidth: 800, padding: 40 }}>
                    <div className="firm-intel-tag" style={{ marginBottom: 20 }}>Service Scoping</div>
                    <h2 className="serif-title" style={{ fontSize: '2rem', marginBottom: 32, fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Scope Of <em>Engagement</em></h2>
                    <div style={{ marginBottom: 32, padding: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                       <p style={{ fontSize: '0.65rem', fontWeight: 600, opacity: 0.3, marginBottom: 4 }}>Authorized Entity</p>
                       <p style={{ fontSize: '1.2rem', color: 'white', fontWeight: 600 }}>{accountName}</p>
                       <p style={{ fontSize: '0.7rem', opacity: 0.4, marginTop: 4 }}>PAN: {pan}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                       <div className="portal-form-group">
                          <label className="portal-form-label">Service Domain</label>
                          <select required className="portal-form-control" style={getInputStyle('selectedService')} value={selectedService} onChange={e => setSelectedService(e.target.value)}>
                             <option value="">Select Domain...</option>
                             {servicesData.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                          </select>
                       </div>
                       {selectedService && (
                          <div className="portal-form-group" style={{ animation: 'fadeIn 0.5s ease' }}>
                             <label className="portal-form-label">Opted Sub-Services <span style={{ opacity: 0.3, marginLeft: 8 }}>(Multi-Select)</span></label>
                             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                                {servicesData.find(s => s.name === selectedService)?.subServices.map(sub => (
                                   <label key={sub} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '10px 14px', borderRadius: 8, background: selectedSubServices.includes(sub) ? 'rgba(255,153,51,0.08)' : 'transparent', border: '1px solid transparent', transition: 'all 0.2s ease' }}>
                                      <input 
                                         type="checkbox" 
                                         style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--gold)' }}
                                         checked={selectedSubServices.includes(sub)}
                                         onChange={() => setSelectedSubServices(prev => prev.includes(sub) ? prev.filter(x => x !== sub) : [...prev, sub])}
                                      />
                                      <span style={{ fontSize: '0.8rem', color: selectedSubServices.includes(sub) ? 'var(--gold)' : 'rgba(255,255,255,0.6)' }}>{sub}</span>
                                   </label>
                                ))}
                             </div>
                          </div>
                       )}
                        <div className="portal-form-group">
                           <label className="portal-form-label">Additional Request</label>
                           <textarea 
                              className="portal-form-control" 
                              rows={2}
                              style={{ minHeight: 'auto', padding: '12px 0' }}
                              placeholder="Specify Any Supplemental Parameters Or Reference Numbers..." 
                              value={additionalInfo} 
                              onChange={e => setAdditionalInfo(e.target.value)} 
                           />
                        </div>
                        <div className="portal-form-group">
                           <label className="portal-form-label">Attachment <span style={{ opacity: 0.3, marginLeft: 8 }}>(Max 20Mb)</span></label>
                          <input type="file" onChange={(e) => setAttachedFile(e.target.files?.[0] || null)} />
                       </div>
                       <div style={{ marginTop: 24, display: 'flex', gap: 16 }}>
                          <button onClick={() => handleSubmit()} disabled={submitting} className="btn-portal-primary" style={{ flex: 1 }}>
                             {submitting ? 'Processing...' : 'Initialize Request'}
                          </button>
                       </div>
                    </div>
                 </div>
              )}
           </div>
        )}
        {isAdmin && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }}>
            {/* LEFT: Service Parameters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="portal-panel" style={{ padding: '24px 32px' }}>
                <div className="firm-intel-tag" style={{ marginBottom: 20 }}>Service Parameters</div>
                <form style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                   <div className="portal-form-grid-2" style={{ gap: '20px 40px' }}>
                      <div className="portal-form-group">
                         <label className="portal-form-label">Request Reference</label>
                          <input readOnly className="portal-form-control" style={{ opacity: 0.8, color: 'var(--gold)', fontWeight: 700 }} value={requestNumber} />
                      </div>
                      <div className="portal-form-group">
                         <label className="portal-form-label">PAN Identifier</label>
                         <input required className="portal-form-control" style={getInputStyle('pan')} value={pan} onChange={e => setPan(e.target.value.toUpperCase())} />
                      </div>
                      <div className="portal-form-group" style={{ gridColumn: '1 / -1' }}>
                         <label className="portal-form-label">Associated Account</label>
                         <SearchableSelect 
                            options={accounts.map(acc => ({ id: acc.id, label: acc.account_name, sublabel: acc.pan_number }))}
                            value={accountId || ''}
                            error={validationErrors.includes('accountId')}
                            onChange={val => {
                               const acc = accounts.find(a => a.id === val);
                               setAccountId(val);
                               setAccountName(acc?.account_name || '');
                               setPan(acc?.pan_number || '');
                               setLitigationScan(acc?.litigation_scan || 'CLEAN');
                            }}
                            placeholder="Search Entity Database..."
                         />
                      </div>
                   </div>

                   <div className="portal-form-group">
                      <label className="portal-form-label">Service Domain</label>
                      <select required className="portal-form-control" style={getInputStyle('selectedService')} value={selectedService} onChange={e => setSelectedService(e.target.value)}>
                         <option value="">Select Domain...</option>
                         {servicesData.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                   </div>

                   {selectedService && (
                       <div className="portal-form-group">
                          <label className="portal-form-label">Opted Sub-Services <span style={{ opacity: 0.3, marginLeft: 8 }}>(Multi-Select)</span></label>
                         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8, padding: '20px', background: 'rgba(255,255,255,0.01)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                            {servicesData.find(s => s.name === selectedService)?.subServices.map(sub => (
                               <label key={sub} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 12px', borderRadius: 6, background: selectedSubServices.includes(sub) ? 'rgba(255,153,51,0.05)' : 'transparent' }}>
                                  <input 
                                     type="checkbox" 
                                     style={{ width: 16, height: 16, accentColor: 'var(--gold)' }}
                                     checked={selectedSubServices.includes(sub)}
                                     onChange={() => setSelectedSubServices(prev => prev.includes(sub) ? prev.filter(x => x !== sub) : [...prev, sub])}
                                  />
                                  <span style={{ fontSize: '0.75rem', opacity: selectedSubServices.includes(sub) ? 1 : 0.5 }}>{sub}</span>
                               </label>
                            ))}
                         </div>
                      </div>
                   )}

                    <div className="portal-form-group">
                       <label className="portal-form-label">Additional Request</label>
                       <textarea 
                          className="portal-form-control" 
                          rows={2}
                          style={{ minHeight: 'auto', padding: '12px 0' }}
                          value={additionalInfo} 
                          onChange={e => setAdditionalInfo(e.target.value)} 
                          placeholder="Supplemental Information..." 
                       />
                    </div>
                </form>
              </div>
            </div>

            {/* RIGHT: Governance & File Upload */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              <div className="portal-panel" style={{ padding: 24, borderLeft: '3px solid var(--gold)' }}>
                <div className="firm-intel-tag" style={{ marginBottom: 16 }}>Documentation Assets</div>
                <div style={{ padding: 20, background: 'rgba(255,153,51,0.02)', border: '1px dashed rgba(255,153,51,0.2)', borderRadius: 12, textAlign: 'center' }}>
                    <input 
                      type="file" 
                      id="admin-file" 
                      multiple 
                      style={{ display: 'none' }} 
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setAttachedFiles(prev => [...prev, ...files]);
                      }} 
                    />
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" style={{ marginBottom: 12, opacity: 0.5 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                    <p style={{ fontSize: '0.7rem', opacity: 0.4, marginBottom: 16 }}>Authorized Evidence Upload</p>
                    <button type="button" onClick={() => document.getElementById('admin-file')?.click()} className="btn-portal-primary" style={{ width: 'auto', padding: '8px 24px', fontSize: '0.65rem' }}>
                      Select Files
                    </button>
                    
                    {(attachedFiles.length > 0 || (existingFiles && existingFiles.length > 0)) && (
                      <div style={{ marginTop: 20, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--gold)', opacity: 0.6, textTransform: 'uppercase' }}>Staged for Registry</p>
                        
                        {/* Existing Files */}
                        {existingFiles?.map((file, idx) => (
                          <div key={`exist-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                            <span style={{ fontSize: '0.7rem', color: 'white', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</span>
                            <button type="button" onClick={() => setExistingFiles(prev => prev?.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </button>
                          </div>
                        ))}

                        {/* New Files */}
                        {attachedFiles.map((file, idx) => (
                          <div key={`new-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(255,153,51,0.05)', borderRadius: 6, border: '1px solid rgba(255,153,51,0.1)' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                            <span style={{ fontSize: '0.7rem', color: 'white', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</span>
                            <button type="button" onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              </div>

              <div className="portal-panel" style={{ padding: 28 }}>
                <div className="firm-intel-tag" style={{ marginBottom: 20 }}>Administrative Governance</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                   <div className="portal-form-group">
                      <label className="portal-form-label">Priority Tier</label>
                      <select className="portal-form-control" value={priority} onChange={e => setPriority(e.target.value as any)}>
                         <option value="Low">Standard (Low)</option>
                         <option value="Standard">Business (Standard)</option>
                         <option value="High">Strategic (High)</option>
                         <option value="Urgent">Critical (Urgent)</option>
                      </select>
                   </div>
                   <div className="portal-form-group">
                      <label className="portal-form-label">Deadline</label>
                      <input type="date" className="portal-form-control" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                   </div>
                   <div className="portal-form-group">
                      <label className="portal-form-label">Assigned Professional</label>
                      <select className="portal-form-control" value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
                         <option value="">Select Staff Member...</option>
                         {staff.map(s => <option key={s.id} value={s.full_name}>{s.full_name} ({s.role.charAt(0).toUpperCase() + s.role.slice(1)})</option>)}
                      </select>
                   </div>
                   <div className="portal-form-group">
                      <label className="portal-form-label">Verification Status</label>
                      <select className="portal-form-control" value={verificationStatus} onChange={e => setVerificationStatus(e.target.value as any)}>
                         <option value="Pending">Pending Review</option>
                         <option value="Verified">Verified & Active</option>
                         <option value="Rejected">Rejected / Closed</option>
                         <option value="Re-submission required">Re-submission Required</option>
                      </select>
                   </div>
                </div>

                <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                   <button disabled={submitting} type="button" onClick={() => handleSubmit()} className="btn-portal-primary" style={{ width: '100%', padding: '16px', fontSize: '0.75rem' }}>
                      {submitting ? 'Committing...' : id ? 'Update Request' : 'Save New Request'}
                   </button>
                   <button type="button" onClick={() => navigate('/dashboard/requests')} className="btn-portal-outline" style={{ width: '100%', padding: '12px', fontSize: '0.65rem' }}>
                      Cancel
                   </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewRequest;
