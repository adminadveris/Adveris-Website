import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { servicesData } from '../data/servicesData';
import { mockApi } from '../lib/mockApi';
import SearchableSelect from '../components/SearchableSelect';

type Step = 'pan' | 'register' | 'scoping' | 'spec' | 'full';

const NewRequest = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [step, setStep] = useState<Step>(id ? 'full' : 'pan');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);

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
  const [country, setCountry] = useState('India');
  const [pincode, setPincode] = useState('');

  // Service Data
  const [selectedService, setSelectedService] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  
  // High-Level Admin/Staff Operational Fields
  const [priority, setPriority] = useState('Standard');
  const [status, setStatus] = useState('ongoing');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [clientComms, setClientComms] = useState('');
  const [requestNumber, setRequestNumber] = useState(`ADV-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [selectedSubServices, setSelectedSubServices] = useState<string[]>([]);
  
  // Governance Fields
  const [verificationStatus, setVerificationStatus] = useState('Pending');
  const [verificationRemarks, setVerificationRemarks] = useState('');
  
  // Performance Metrics [NEW]
  const [approvedDate, setApprovedDate] = useState('');
  const [daysLeft, setDaysLeft] = useState<number | string>('');
  const [hoursConsumed, setHoursConsumed] = useState<number | string>('');

  // Documentation [NEW]
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [existingFileInfo, setExistingFileInfo] = useState<{name: string, size: number} | null>(null);

  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const init = async () => {
      const [p, accs] = await Promise.all([mockApi.getProfile(), mockApi.getAccounts()]);
      setProfile(p);
      setAccounts(accs);
      
      if (id) {
        const records = await mockApi.getRecords();
        const existing = records.find((r: any) => r.id === id);
        if (existing) {
          setAccountId(existing.account_id);
          setAccountName(existing.account_name);
          setSelectedService(existing.primary_service || '');
          setAdditionalInfo(existing.description || '');
          setPriority(existing.priority || 'Standard');
          setStatus(existing.status || 'ongoing');
          setDueDate(existing.due_date || '');
          setAssignedTo(existing.assigned_to || '');
          setInternalNotes(existing.internal_notes || '');
          setClientComms(existing.client_comms || '');
          setRequestNumber(existing.request_number);
          setSelectedSubServices(existing.sub_services || []);
          setVerificationStatus(existing.verification_status || 'Pending');
          setVerificationRemarks(existing.verification_remarks || '');
          setApprovedDate(existing.approved_date || '');
          setDaysLeft(existing.days_left || '');
          setHoursConsumed(existing.hours_consumed || '');
          if (existing.attached_file) {
            setExistingFileInfo(existing.attached_file);
          }
          setStep('full');
        }
      } else if (p.role === 'admin' || p.role === 'staff') {
        setStep('full');
      }
      setLoading(false);
    };
    init();
  }, [id]);

  const handlePanCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pan) return;
    setLoading(true);
    setError('');
    
    try {
      const existing = await mockApi.findAccountByPAN(pan);
      if (existing) {
        setAccountId(existing.id);
        setAccountName(existing.account_name);
        setStep('scoping');
      } else {
        setStep('register');
      }
    } catch (err: any) {
      setError(err.message || 'Verification error.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !accountName) {
      setError('Please ensure account selection and service domain are complete.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      // DUPLICATE CHECK
      const duplicate = await mockApi.findAccountByPAN(pan);
      if (duplicate && !accountId) {
        setAccountId(duplicate.id);
        setAccountName(duplicate.account_name);
        setError('Entity matched in registry. Linking to existing account...');
      }

      let finalAccountId = accountId;
      if (!finalAccountId && !isAdmin) {
        const newAcc = await mockApi.createAccount({
          account_name: accountName,
          pan_number: pan
        });
        finalAccountId = newAcc.id;
      }

      const payload: any = {
        account_id: finalAccountId,
        account_name: accountName,
        title: selectedService,
        primary_service: selectedService,
        description: additionalInfo,
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
        payload.hours_consumed = hoursConsumed;
      }

      if (attachedFile) {
        payload.attached_file = {
          name: attachedFile.name,
          size: attachedFile.size,
          type: attachedFile.type,
          url: URL.createObjectURL(attachedFile) 
        };
      }

      if (id) {
        await mockApi.updateRecord(id, payload);
      } else {
        await mockApi.createRecord(payload);
      }

      setSuccess(true);
      setTimeout(() => navigate(`/dashboard/records${id ? `/${id}` : ''}`), 1800);
    } catch (err: any) {
      setError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  if (success) return (
    <div className="portal-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ color: 'var(--saffron)', marginBottom: 8 }}>
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <h2 className="serif-title" style={{ fontSize: '3rem' }}>Mandate <em>Initialized</em></h2>
      <p style={{ opacity: 0.4 }}>Strategic request has been logged into the account registry.</p>
    </div>
  );

  const isAdmin = profile?.role === 'admin' || profile?.role === 'staff';

  return (
    <div className="theater-container" style={{ paddingTop: 20, paddingBottom: 80 }}>
      {/* HEADER SECTION CLEANUP */}
      <div style={{ marginBottom: 24 }} />

      <div>
        {/* CLIENT FLOW (Same path, just within Theater) */}
        {!isAdmin && (
           <div className="portal-request-grid-center">
              {step === 'pan' && (
                <div className="portal-panel" style={{ maxWidth: 600, padding: 40, textAlign: 'center' }}>
                  <h2 className="serif-title" style={{ fontSize: '2.5rem', marginBottom: 12 }}>Identity <em>Verification</em></h2>
                  <p style={{ opacity: 0.4, marginBottom: 24 }}>Identify the legal entity via Permanent Account Number.</p>
                  <form onSubmit={handlePanCheck}>
                    <div className="portal-form-group">
                      <label className="portal-form-label">PAN Identifier</label>
                      <input required className="portal-form-control" style={{ textAlign: 'center', fontSize: '2rem' }} value={pan} onChange={e => setPan(e.target.value.toUpperCase())} />
                    </div>
                    <button type="submit" className="btn-portal-primary" style={{ width: '100%', marginTop: 20 }}>VERIFY IDENTITY</button>
                    {error && <p style={{ color: 'var(--saffron)', fontSize: '0.75rem', marginTop: 16 }}>{error}</p>}
                  </form>
                </div>
              )}

              {step === 'register' && (
                <div className="portal-panel" style={{ maxWidth: 900, padding: 40 }}>
                  <h2 className="serif-title" style={{ fontSize: '2.2rem', marginBottom: 12, textAlign: 'center' }}>Entity <em>Registration</em></h2>
                  <p style={{ opacity: 0.4, marginBottom: 32, textAlign: 'center' }}>No record found for PAN <strong>{pan}</strong>. Please initialize the account registry.</p>
                  
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setLoading(true);
                    try {
                      const newAcc = await mockApi.createAccount({ 
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                      {/* COLUMN 1: STATUTORY */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div className="firm-intel-tag" style={{ marginBottom: 8 }}>STATUTORY IDENTIFIERS</div>
                        
                        <div className="portal-form-group">
                          <label className="portal-form-label">LEGAL ENTITY NAME</label>
                          <input required className="portal-form-control" value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="Full Company Name..." />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                          <div className="portal-form-group">
                            <label className="portal-form-label">CIN NUMBER</label>
                            <input className="portal-form-control" value={cin} onChange={e => setCin(e.target.value)} placeholder="U1234..." />
                          </div>
                          <div className="portal-form-group">
                            <label className="portal-form-label">GSTIN NUMBER</label>
                            <input className="portal-form-control" value={gstin} onChange={e => setGstin(e.target.value)} placeholder="29AA..." />
                          </div>
                        </div>

                        <div className="portal-form-group">
                          <label className="portal-form-label">INDUSTRY SECTOR</label>
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

                      {/* COLUMN 2: ADDRESS GRID */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="firm-intel-tag" style={{ marginBottom: 8 }}>ADMINISTRATIVE ADDRESS GRID</div>
                        
                        <div className="portal-form-group">
                          <label className="portal-form-label">House no / Flat / Unit</label>
                          <input className="portal-form-control" value={houseNo} onChange={e => setHouseNo(e.target.value)} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                          <div className="portal-form-group">
                            <label className="portal-form-label">Street 1</label>
                            <input className="portal-form-control" value={street1} onChange={e => setStreet1(e.target.value)} />
                          </div>
                          <div className="portal-form-group">
                            <label className="portal-form-label">Street 2</label>
                            <input className="portal-form-control" value={street2} onChange={e => setStreet2(e.target.value)} />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                          <div className="portal-form-group">
                            <label className="portal-form-label">Street 3</label>
                            <input className="portal-form-control" value={street3} onChange={e => setStreet3(e.target.value)} />
                          </div>
                          <div className="portal-form-group">
                            <label className="portal-form-label">Landmark</label>
                            <input className="portal-form-control" value={landmark} onChange={e => setLandmark(e.target.value)} />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
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
                      <button type="submit" className="btn-portal-primary" style={{ width: '100%' }}>INITIALIZE ENTITY & PROCEED</button>
                      <button type="button" onClick={() => setStep('pan')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', width: '100%', fontSize: '0.7rem', cursor: 'pointer' }}>← CANCEL AND USE DIFFERENT PAN</button>
                    </div>
                    {error && <p style={{ color: 'var(--saffron)', fontSize: '0.75rem', marginTop: 16, textAlign: 'center' }}>{error}</p>}
                  </form>
                </div>
              )}

              {step === 'scoping' && (
                 <div className="portal-panel" style={{ maxWidth: 800, padding: 40 }}>
                    <div className="firm-intel-tag" style={{ marginBottom: 20 }}>MANDATE INITIALIZATION</div>
                    <h2 className="serif-title" style={{ fontSize: '2rem', marginBottom: 32 }}>Scope of <em>Engagement</em></h2>
                    
                    <div style={{ marginBottom: 32, padding: 20, background: 'rgba(255,153,51,0.05)', borderRadius: 8, border: '1px solid rgba(255,153,51,0.1)' }}>
                       <p style={{ fontSize: '0.6rem', fontWeight: 800, opacity: 0.5, marginBottom: 4 }}>AUTHORIZED ENTITY</p>
                       <p style={{ fontSize: '1.1rem', color: 'white', fontWeight: 600 }}>{accountName}</p>
                       <p style={{ fontSize: '0.7rem', opacity: 0.4, marginTop: 4 }}>PAN: {pan}</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                       <div className="portal-form-group">
                          <label className="portal-form-label">Service Type</label>
                          <select required className="portal-form-control" value={selectedService} onChange={e => setSelectedService(e.target.value)}>
                             <option value="">Select Domain...</option>
                             {servicesData.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                          </select>
                       </div>

                       {selectedService && (
                          <div className="portal-form-group" style={{ animation: 'fadeIn 0.5s ease' }}>
                             <label className="portal-form-label">Opted Sub-Services</label>
                             <div className="portal-sub-service-grid" style={{ padding: '16px 24px', gap: 12, background: 'rgba(255,255,255,0.01)' }}>
                                {servicesData.find(s => s.name === selectedService)?.subServices.map(sub => (
                                   <label key={sub} className={`portal-sub-service-item ${selectedSubServices.includes(sub) ? 'selected' : ''}`} style={{ fontSize: '0.85rem' }}>
                                      <input 
                                         type="checkbox" 
                                         className="portal-checkbox"
                                         checked={selectedSubServices.includes(sub)}
                                         onChange={() => setSelectedSubServices(prev => prev.includes(sub) ? prev.filter(x => x !== sub) : [...prev, sub])}
                                      />
                                      <span>{sub}</span>
                                   </label>
                                ))}
                             </div>
                          </div>
                       )}

                       <div className="portal-form-group">
                          <label className="portal-form-label">Additional Services / Scope Clarification</label>
                          <textarea className="portal-form-control" style={{ minHeight: 100 }} value={additionalInfo} onChange={e => setAdditionalInfo(e.target.value)} />
                       </div>

                       <div className="portal-form-group">
                          <label className="portal-form-label">Attachment <span style={{ opacity: 0.3, marginLeft: 8 }}>(MAX 20MB)</span></label>
                          <input type="file" onChange={(e) => setAttachedFile(e.target.files?.[0] || null)} />
                       </div>

                       <div style={{ marginTop: 24, display: 'flex', gap: 16 }}>
                          <button onClick={handleSubmit} disabled={submitting} className="btn-portal-primary" style={{ flex: 1 }}>
                             {submitting ? 'PROCESSING...' : 'INITIALIZE MANDATE'}
                          </button>
                          <button type="button" onClick={() => setStep('pan')} className="btn-portal-outline" style={{ width: 'auto' }}>RESET</button>
                       </div>
                    </div>
                 </div>
              )}
           </div>
        )}

        {/* ADMIN COMMAND CENTER: ELEGANCE V4 OVERHAUL */}
        {isAdmin && (
          <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: 40, alignItems: 'start' }}>
            
            {/* LEFT: ENGINEERING FORM */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              {/* SECTION 1: GENERAL INFORMATION */}
              <div className="portal-panel" style={{ padding: '20px 32px' }}>
                <div className="firm-intel-tag" style={{ marginBottom: 20 }}>GENERAL INFORMATION</div>
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                   
                   {/* IDENTITY & REFERENCE - Standardized to 2 columns */}
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 40px' }}>
                      <div className="portal-form-group">
                         <label className="portal-form-label">Reference No</label>
                         <input readOnly className="portal-form-control" style={{ opacity: 0.6, cursor: 'not-allowed' }} value={requestNumber} />
                      </div>
                      <div className="portal-form-group">
                         <label className="portal-form-label">PAN Number</label>
                         <input 
                            required 
                            className="portal-form-control" 
                            value={pan} 
                            onChange={e => setPan(e.target.value.toUpperCase())}
                            readOnly={!!id && !isAdmin}
                         />
                      </div>
                      <div className="portal-form-group" style={{ gridColumn: 'span 2' }}>
                         <label className="portal-form-label">Account Name</label>
                         {isAdmin ? (
                            <SearchableSelect 
                               options={accounts.map(acc => ({ id: acc.id, label: acc.account_name, sublabel: acc.industry }))}
                               value={accountId || ''}
                               onChange={val => {
                                 const acc = accounts.find(a => a.id === val);
                                 setAccountId(val);
                                 setAccountName(acc?.account_name || '');
                                 setPan(acc?.pan_number || '');
                               }}
                               placeholder="Select Entity..."
                            />
                         ) : (
                            <input readOnly className="portal-form-control" style={{ opacity: 0.6 }} value={accountName} />
                         )}
                      </div>
                   </div>

                   {/* DOMAIN SELECTION */}
                   <div className="portal-form-group">
                      <label className="portal-form-label">Service Type</label>
                      <select 
                        required 
                        className="portal-form-control" 
                        value={selectedService} 
                        onChange={e => {
                          setSelectedService(e.target.value);
                          setSelectedSubServices([]);
                        }}
                        disabled={!!id && !isAdmin}
                      >
                         <option value="">Select Service Domain...</option>
                         {servicesData.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                   </div>

                   {/* SCOPING */}
                   {selectedService && (
                      <div className="portal-form-group" style={{ animation: 'fadeIn 0.5s ease' }}>
                         <label className="portal-form-label">Opted Sub-Services <span style={{ opacity: 0.3, marginLeft: 8 }}>(Multi-Select)</span></label>
                         <div className="portal-sub-service-grid" style={{ padding: '16px 24px', gap: 12, background: 'rgba(255,255,255,0.01)' }}>
                            {servicesData.find(s => s.name === selectedService)?.subServices.map(sub => (
                               <label key={sub} className={`portal-sub-service-item ${selectedSubServices.includes(sub) ? 'selected' : ''}`} style={{ fontSize: '0.85rem' }}>
                                  <input 
                                     type="checkbox" 
                                     className="portal-checkbox"
                                     checked={selectedSubServices.includes(sub)}
                                     disabled={!!id && !isAdmin}
                                     onChange={() => {
                                        if (!!id && !isAdmin) return;
                                        setSelectedSubServices(prev => 
                                           prev.includes(sub) ? prev.filter(x => x !== sub) : [...prev, sub]
                                        );
                                     }}
                                  />
                                  <span>{sub}</span>
                               </label>
                            ))}
                         </div>
                      </div>
                   )}

                   {/* CLIENT INPUTS */}
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                      <div className="portal-form-group">
                         <label className="portal-form-label">Additional Services</label>
                         <textarea 
                           className="portal-form-control" 
                           style={{ minHeight: 80 }}
                           value={additionalInfo} 
                           onChange={e => setAdditionalInfo(e.target.value)}
                           readOnly={!!id && !isAdmin}
                         />
                      </div>
                      <div className="portal-form-group">
                         <label className="portal-form-label">Client Remarks</label>
                         <textarea 
                           className="portal-form-control" 
                           style={{ minHeight: 80 }}
                           value={clientComms} 
                           onChange={e => setClientComms(e.target.value)}
                           readOnly={!!id && !isAdmin}
                         />
                      </div>
                   </div>

                   {/* DOCUMENTATION HUB [NEW] */}
                   <div className="portal-form-group" style={{ marginTop: 12, padding: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <label className="portal-form-label" style={{ color: 'var(--gold)', marginBottom: 16 }}>Attachment <span style={{ opacity: 0.3, marginLeft: 8 }}>(MAX 20MB)</span></label>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                         <div style={{ flex: 1 }}>
                            <input 
                              type="file" 
                              id="mandate-file-upload"
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                 const file = e.target.files?.[0];
                                 if (file) {
                                    if (file.size > 20 * 1024 * 1024) {
                                       setError('File exceeds 20MB limit. Please optimize the asset.');
                                       e.target.value = '';
                                       return;
                                    }
                                    setAttachedFile(file);
                                    setError('');
                                 }
                              }}
                            />
                            <button 
                              type="button" 
                              onClick={() => document.getElementById('mandate-file-upload')?.click()}
                              className="btn-portal-outline"
                              style={{ width: 'auto', padding: '10px 24px', fontSize: '0.65rem' }}
                            >
                               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                               {attachedFile ? attachedFile.name : existingFileInfo ? existingFileInfo.name : 'UPLOAD DOCUMENT'}
                            </button>
                         </div>

                         {(attachedFile || existingFileInfo) && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                               <button 
                                 type="button"
                                 onClick={() => {
                                    const fileUrl = attachedFile ? URL.createObjectURL(attachedFile) : (existingFileInfo as any).url;
                                    const link = document.createElement('a');
                                    link.href = fileUrl;
                                    link.download = attachedFile ? attachedFile.name : existingFileInfo?.name || 'document';
                                    link.click();
                                 }}
                                 className="btn-batch btn-batch--approve"
                                 style={{ padding: '8px 20px', height: 'auto', fontSize: '0.6rem' }}
                               >
                                  DOWNLOAD ASSET
                               </button>
                               <button 
                                 type="button"
                                 onClick={() => {
                                    setAttachedFile(null);
                                    setExistingFileInfo(null);
                                 }}
                                 style={{ background: 'none', border: 'none', color: 'rgba(255,153,51,0.5)', cursor: 'pointer', fontSize: '0.6rem', textDecoration: 'underline' }}
                               >
                                  REMOVE
                               </button>
                            </div>
                         )}
                      </div>
                      <p style={{ fontSize: '0.65rem', opacity: 0.2, marginTop: 12 }}>Encrypted storage protocol active. Assets are parsed upon mandate certification.</p>
                   </div>

                   {error && <p style={{ color: 'var(--saffron)', fontSize: '0.75rem', marginTop: 12, textAlign: 'right', fontStyle: 'italic', opacity: 0.8 }}>{error}</p>}

                </form>
              </div>

              {/* SECTION 2: ADMINISTRATIVE SECTION */}
              <div className="portal-panel" style={{ padding: '20px 32px', background: 'rgba(255,153,51,0.02)', border: '1px solid rgba(255,153,51,0.08)' }}>
                <div className="firm-intel-tag" style={{ marginBottom: 20 }}>ADMINISTRATIVE SECTION</div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                   {/* Balanced 2-column grid */}
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 40px' }}>
                      <div className="portal-form-group">
                         <label className="portal-form-label">Priority</label>
                         <select 
                           className="portal-form-control" 
                           value={priority} 
                           onChange={e => setPriority(e.target.value)}
                           disabled={!isAdmin}
                         >
                            <option value="Low">Low</option>
                            <option value="Standard">Standard</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                         </select>
                      </div>
                      <div className="portal-form-group">
                         <label className="portal-form-label">Target Milestone Due</label>
                         <input 
                           type="date" 
                           className="portal-form-control" 
                           value={dueDate} 
                           onChange={e => {
                             setDueDate(e.target.value);
                             if (approvedDate) {
                               const start = new Date(approvedDate);
                               const end = new Date(e.target.value);
                               setDaysLeft(Math.floor((start.getTime() - end.getTime()) / (1000 * 60 * 60 * 24)));
                             }
                           }}
                           readOnly={!isAdmin} 
                         />
                      </div>
                      <div className="portal-form-group" style={{ gridColumn: 'span 2' }}>
                         <label className="portal-form-label">Assigned To</label>
                         <input 
                           className="portal-form-control" 
                           value={assignedTo} 
                           onChange={e => setAssignedTo(e.target.value)}
                           readOnly={!isAdmin}
                         />
                      </div>
                   </div>

                   {isAdmin && (
                      <div className="portal-form-group">
                         <label className="portal-form-label">Internal Notes</label>
                         <textarea className="portal-form-control" value={internalNotes} onChange={e => setInternalNotes(e.target.value)} />
                      </div>
                   )}

                   {/* PERFORMANCE METRICS - Standardized to 2 columns */}
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 40px', padding: 20, background: 'rgba(255,153,51,0.03)', borderRadius: 8 }}>
                      <div className="portal-form-group" style={{ marginBottom: 0 }}>
                         <label className="portal-form-label">Approved Date</label>
                         <input 
                           type="date" 
                           className="portal-form-control" 
                           value={approvedDate} 
                           onChange={e => {
                             setApprovedDate(e.target.value);
                             if (dueDate && e.target.value) {
                               const start = new Date(e.target.value);
                               const end = new Date(dueDate);
                               setDaysLeft(Math.floor((start.getTime() - end.getTime()) / (1000 * 60 * 60 * 24)));
                             } else if (!e.target.value) {
                               setDaysLeft('');
                             }
                           }}
                           readOnly={!isAdmin}
                         />
                      </div>
                      <div className="portal-form-group" style={{ marginBottom: 0 }}>
                         <label className="portal-form-label">No of Days Left</label>
                         <input readOnly className="portal-form-control" style={{ opacity: 0.6 }} value={daysLeft} />
                      </div>
                      <div className="portal-form-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
                         <label className="portal-form-label">No of Hours Consumed</label>
                         <input 
                           type="number" 
                           className="portal-form-control" 
                           value={hoursConsumed} 
                           onChange={e => setHoursConsumed(e.target.value)}
                           readOnly={!isAdmin}
                         />
                      </div>
                   </div>

                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 8 }}>
                      <div className="portal-form-group">
                         <label className="portal-form-label">Document Verification Status</label>
                         <select 
                           className="portal-form-control" 
                           value={verificationStatus} 
                           onChange={e => {
                             setVerificationStatus(e.target.value);
                             if (e.target.value === 'Approved') {
                               const today = new Date().toISOString().split('T')[0];
                               setApprovedDate(today);
                               if (dueDate) {
                                 const start = new Date(today);
                                 const end = new Date(dueDate);
                                 setDaysLeft(Math.floor((start.getTime() - end.getTime()) / (1000 * 60 * 60 * 24)));
                               }
                             } else {
                               setApprovedDate('');
                               setDaysLeft('');
                             }
                           }}
                           disabled={!isAdmin}
                         >
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Request for resubmission">Request for resubmission</option>
                            <option value="Reject">Reject</option>
                         </select>
                      </div>
                      <div className="portal-form-group">
                         <label className="portal-form-label">Document Verification Remarks</label>
                         <textarea 
                           className="portal-form-control" 
                           rows={1} 
                           value={verificationRemarks} 
                           onChange={e => setVerificationRemarks(e.target.value)}
                           readOnly={!isAdmin}
                         />
                      </div>
                   </div>
                </div>
              </div>

              {isAdmin && (
                 <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 16 }}>
                    <button disabled={submitting} type="button" onClick={handleSubmit} className="btn-portal-primary" style={{ padding: '16px 60px', fontSize: '0.65rem' }}>
                       {submitting ? 'PROCESSING...' : id ? 'UPDATE ACCOUNT MANDATE' : 'INITIALIZE ACCOUNT MANDATE'}
                    </button>
                 </div>
              )}
            </div>

            {/* RIGHT SIDEBAR: CURRENTLY VACATED FOR CLEANER INITIALIZATION FLOW */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 60 }}>
               {/* Redundant Entity Archive removed as per request */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewRequest;
