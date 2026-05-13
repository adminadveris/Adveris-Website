import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { servicesData } from '../data/servicesData';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import SearchableSelect from '../components/SearchableSelect';
import type { Account, Request, User } from '../types';

type Step = 'pan_verify' | 'entity_registration' | 'engagement_scope';

const NewRequest = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'employee';

  // --- NAVIGATION STATE ---
  const [step, setStep] = useState<Step>('pan_verify');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // --- DATA SOURCES ---
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [staff, setStaff] = useState<User[]>([]);

  // --- FORM STATE: ENTITY ---
  const [accountId, setAccountId] = useState<string | null>(null);
  const [accountName, setAccountName] = useState('');
  const [pan, setPan] = useState('');
  const [cin, setCin] = useState('');
  const [gstin, setGstin] = useState('');
  const [industry, setIndustry] = useState('');
  const [address, setAddress] = useState({
    houseNo: '', street1: '', street2: '', street3: '',
    landmark: '', city: '', state: '', pincode: '', country: 'India'
  });

  // --- FORM STATE: ENGAGEMENT ---
  const [primaryService, setPrimaryService] = useState('');
  const [subServices, setSubServices] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<Request['attached_files']>([]);

  // --- FORM STATE: GOVERNANCE (ADMIN ONLY) ---
  const [priority, setPriority] = useState<Request['priority']>('Standard');
  const [status, setStatus] = useState<Request['status']>('submitted');
  const [verificationStatus, setVerificationStatus] = useState<Request['verification_status']>('Pending');
  const [verificationRemarks, setVerificationRemarks] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [clientComms, setClientComms] = useState('');
  const [requestNumber, setRequestNumber] = useState(`ADV-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`);

  // --- INITIALIZATION ---
  useEffect(() => {
    const initializePage = async () => {
      try {
        const [accRes, staffRes] = await Promise.allSettled([
          api.getAccounts(),
          api.getStaffProfiles()
        ]);

        const fetchedAccounts = accRes.status === 'fulfilled' ? accRes.value : [];
        setAccounts(fetchedAccounts);
        setStaff(staffRes.status === 'fulfilled' ? staffRes.value : []);

        if (id) {
          const records = await api.getRecords();
          const record = records.find((r: Request) => r.id === id);
          if (record) {
            setAccountId(record.account_id);
            setAccountName(record.account_name);
            setPrimaryService(record.primary_service || '');
            setSubServices(record.sub_services || []);
            setDescription(record.description || '');
            setPriority(record.priority || 'Standard');
            setStatus(record.status || 'submitted');
            setVerificationStatus(record.verification_status || 'Pending');
            setVerificationRemarks(record.verification_remarks || '');
            setDueDate(record.due_date || '');
            setAssignedTo(record.assigned_to_id || record.assigned_to || '');
            setInternalNotes(record.internal_notes || '');
            setClientComms(record.client_comms || '');
            setRequestNumber(record.request_number);
            setExistingFiles(record.attached_files || []);
            setStep('engagement_scope');
          }
        } else if (isAdmin) {
          setStep('engagement_scope'); // Admins skip PAN check
        }
      } catch (err) {
        console.error("Initialization Failed:", err);
      } finally {
        setLoading(false);
      }
    };
    initializePage();
  }, [id, isAdmin]);

  // --- HANDLERS ---
  const handlePanVerification = async (e: FormEvent) => {
    e.preventDefault();
    if (!pan || pan.length !== 10) return setError("Please enter a valid 10-digit PAN.");

    setLoading(true);
    setError(null);
    try {
      const match = await api.findAccountByPAN(pan);
      if (match) {
        setAccountId(match.id);
        setAccountName(match.account_name);
        setStep('engagement_scope');
      } else {
        setStep('entity_registration');
      }
    } catch (err: any) {
      setError(err.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const saveRequest = async () => {
    if (!accountName || !primaryService) return setError("Mandatory Fields Missing: Account Name or Service Domain.");
    if (user?.role === 'admin' && !assignedTo) return setError("Governance Enforcement: Assigned Professional is required to save this record.");

    setSubmitting(true);
    setError(null);

    try {
      // 1. Resolve Account
      let finalAccountId = accountId;
      if (!finalAccountId) {
        // ARCHITECTURAL MAPPING: Translate UI CamelCase to DB SnakeCase
        const dbAccountPayload = {
          account_name: accountName,
          pan_number: pan,
          cin_number: cin,
          gstin_number: gstin,
          industry,
          house_no: address.houseNo,
          street_1: address.street1,
          street_2: address.street2,
          street_3: address.street3,
          landmark: address.landmark,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          country: address.country
        };
        const newAcc = await api.createAccount(dbAccountPayload);
        finalAccountId = newAcc.id;
      }

      // 2. Handle Document Assets
      let uploadedAssets = [...(existingFiles || [])];
      if (attachedFiles.length > 0) {
        const uploads = await Promise.all(attachedFiles.map(file => api.uploadFile(file).then(url => ({
          name: file.name, size: file.size, type: file.type, url
        }))));
        uploadedAssets = [...uploadedAssets, ...uploads];
      }

      // 3. Compile Payload
      const payload: Partial<Request> = {
        title: `${primaryService} - ${accountName}`, // FIX: Resolve not-null constraint on title column
        account_id: finalAccountId,
        account_name: accountName,
        primary_service: primaryService,
        sub_service: subServices.join(', '), // FIX: Map array to TEXT column in DB
        sub_services: subServices, // Keep for frontend types if needed
        description,
        attached_files: uploadedAssets,
        client_comms: clientComms,
      };

      if (isAdmin) {
        Object.assign(payload, {
          priority,
          status,
          verification_status: verificationStatus,
          verification_remarks: verificationRemarks,
          due_date: dueDate || null,
          assigned_to_id: assignedTo || null, // FIX: Send null instead of empty string for UUID columns
          internal_notes: internalNotes,
          request_number: requestNumber
        });
      }

      // 4. Commit
      if (id) await api.updateRecord(id, payload);
      else await api.createRecord(payload);

      // 5. Automatic Linkage for Clients
      if (user?.role === 'client' && !user.account_id && finalAccountId) {
        await api.updateProfile(user.id, { account_id: finalAccountId });
        await refreshUser(); // Update context immediately
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard/requests');
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to commit record.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- RENDER HELPERS ---
  const SectionHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
    <div className="section-header" style={{ marginBottom: 32 }}>
      <h2 className="serif-title" style={{ fontSize: '1.8rem', fontWeight: 600 }}>{title}</h2>
      <p style={{ opacity: 0.4, fontSize: '0.85rem' }}>{subtitle}</p>
    </div>
  );

  if (loading) return <div className="portal-loader-container"><div className="portal-loader" /></div>;
  if (success) return (
    <div className="portal-success-state">
      <div className="success-icon"></div>
      <h2>Request <em>Commited</em></h2>
      <p>The mandate has been successfully registered in the governance registry.</p>
    </div>
  );

  return (
    <div className="theater-container" style={{ padding: '40px 0 100px' }}>
      <div className="portal-panel-stack" style={{ maxWidth: 1000, margin: '0 auto' }}>

        {/* STEP 1: PAN VERIFICATION (Clients Only) */}
        {step === 'pan_verify' && !isAdmin && (
          <div className="portal-panel center-align" style={{ padding: 60 }}>
            <SectionHeader title="Entity Identity" subtitle="Verify your legal entity via Permanent Account Number (PAN)." />
            <form onSubmit={handlePanVerification} style={{ maxWidth: 400, margin: '0 auto' }}>
              <div className="portal-form-group">
                <label className="portal-form-label">PAN Identifier</label>
                <input
                  autoFocus
                  className="portal-form-control massive-input"
                  value={pan}
                  onChange={e => setPan(e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F"
                />
              </div>
              <button type="submit" className="btn-portal-primary full-width">Verify & Proceed</button>
              {error && <p className="error-text">{error}</p>}
            </form>
          </div>
        )}

        {/* STEP 2: ENTITY REGISTRATION (New Clients) */}
        {step === 'entity_registration' && (
          <div className="portal-panel" style={{ padding: 40 }}>
            <SectionHeader title="New Entity Registry" subtitle={`PAN ${pan} is not in our database. Please initialize registration.`} />
            <div className="portal-form-grid-2">
              <div className="form-column">
                <div className="firm-intel-tag">Statutory Details</div>
                <div className="portal-form-group"><label>Legal Entity Name</label><input required className="portal-form-control" value={accountName} onChange={e => setAccountName(e.target.value)} /></div>
                <div className="portal-form-grid-2">
                  <div className="portal-form-group"><label>CIN</label><input className="portal-form-control" value={cin} onChange={e => setCin(e.target.value)} /></div>
                  <div className="portal-form-group"><label>GSTIN</label><input className="portal-form-control" value={gstin} onChange={e => setGstin(e.target.value)} /></div>
                </div>
              </div>
              <div className="form-column">
                <div className="firm-intel-tag">Address Grid</div>
                <div className="portal-form-grid-2">
                  <div className="portal-form-group"><label>House / Flat No.</label><input className="portal-form-control" value={address.houseNo} onChange={e => setAddress({ ...address, houseNo: e.target.value })} /></div>
                  <div className="portal-form-group"><label>Street Address</label><input className="portal-form-control" value={address.street1} onChange={e => setAddress({ ...address, street1: e.target.value })} /></div>
                </div>
                <div className="portal-form-grid-3">
                  <div className="portal-form-group"><label>City</label><input className="portal-form-control" value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} /></div>
                  <div className="portal-form-group"><label>State</label><input className="portal-form-control" value={address.state} onChange={e => setAddress({ ...address, state: e.target.value })} /></div>
                  <div className="portal-form-group"><label>Pincode</label><input className="portal-form-control" value={address.pincode} onChange={e => setAddress({ ...address, pincode: e.target.value })} /></div>
                </div>
              </div>
            </div>
            <button onClick={() => setStep('engagement_scope')} className="btn-portal-primary" style={{ marginTop: 32 }}>Initialize Entity & Continue</button>
          </div>
        )}

        {/* STEP 3: ENGAGEMENT SCOPE (Final Form) */}
        {step === 'engagement_scope' && (
          <div className="portal-layout-split">
            <div className="portal-main-column">
              <div className="portal-panel" style={{ padding: 40 }}>
                <SectionHeader title="Engagement Scope" subtitle="Define the parameters and technical requirements of this mandate." />

                {isAdmin && (
                  <div className="portal-form-group" style={{ marginBottom: 32 }}>
                    <label className="portal-form-label">Associated Client Account</label>
                    <SearchableSelect
                      options={accounts.map(a => ({ id: a.id, label: a.account_name, sublabel: a.pan_number }))}
                      value={accountId || ''}
                      onChange={val => {
                        const acc = accounts.find(a => a.id === val);
                        setAccountId(val);
                        setAccountName(acc?.account_name || '');
                        setPan(acc?.pan_number || '');
                      }}
                      placeholder="Select Entity..."
                    />
                  </div>
                )}

                <div className="portal-form-group">
                  <label className="portal-form-label">Service Domain</label>
                  <select className="portal-form-control" value={primaryService} onChange={e => setPrimaryService(e.target.value)}>
                    <option value="">Select Service Area...</option>
                    {servicesData.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>

                {primaryService && (
                  <div className="sub-service-grid" style={{ marginTop: 24 }}>
                    <label className="portal-form-label">Technical Sub-Services</label>
                    <div className="tag-checkbox-container">
                      {servicesData.find(s => s.name === primaryService)?.subServices.map(sub => (
                        <label key={sub} className={`tag-checkbox ${subServices.includes(sub) ? 'active' : ''}`}>
                          <input type="checkbox" checked={subServices.includes(sub)} onChange={() => setSubServices(prev => prev.includes(sub) ? prev.filter(x => x !== sub) : [...prev, sub])} />
                          {sub}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="portal-form-group" style={{ marginTop: 32 }}>
                  <label className="portal-form-label">Specific Instructions / Scoping Details</label>
                  <textarea className="portal-form-control" rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="Provide detailed context for our professionals..." />
                </div>

                {/* UNIFIED DOCUMENTATION ASSETS */}
                <div className="portal-form-group" style={{ marginTop: 40 }}>
                  <label className="portal-form-label">Documentation Assets</label>
                  <div className="premium-upload-box">
                    <input
                      type="file"
                      multiple
                      id="master-file-upload"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const files = Array.from(e.target.files || []);
                        if (attachedFiles.length + files.length > 3) {
                          alert("Maximum 3 files allowed per request.");
                          setAttachedFiles([...attachedFiles, ...files.slice(0, 3 - attachedFiles.length)]);
                        } else {
                          setAttachedFiles([...attachedFiles, ...files]);
                        }
                        e.target.value = ''; // Reset input to allow re-selection
                      }}
                    />
                    <div className="upload-content" onClick={() => document.getElementById('master-file-upload')?.click()}>
                      <div className="upload-icon"></div>
                      <p>Select Evidence or Scoping Documents (Max 3 Files)</p>
                      <button type="button" className="btn-portal-outline tiny">Browse Files</button>
                    </div>
                    {attachedFiles.length > 0 && (
                      <div className="staged-files">
                        <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--gold)', opacity: 0.6, textTransform: 'uppercase', marginBottom: 8 }}>Staged for Upload</p>
                        {attachedFiles.map((f, i) => (
                          <div key={i} className="staged-file-item">
                            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</span>
                            <button type="button" onClick={(e) => {
                              e.stopPropagation();
                              setAttachedFiles(prev => prev.filter((_, idx) => idx !== i));
                            }}>×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="portal-side-column">
              <div className="portal-panel" style={{ padding: 32 }}>
                <div className="firm-intel-tag">Governance & Lifecycle</div>

                {isAdmin ? (
                  <div className="admin-governance-fields" style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 24 }}>
                    <div className="portal-form-group">
                      <label>Assigned Professional</label>
                      <select className="portal-form-control" value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
                        <option value="">Unassigned</option>
                        {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                      </select>
                    </div>

                    <div className="portal-form-grid-2">
                      <div className="portal-form-group">
                        <label>Priority</label>
                        <select className="portal-form-control" value={priority} onChange={e => setPriority(e.target.value as any)}>
                          <option value="Low">Low</option>
                          <option value="Standard">Standard</option>
                          <option value="High">High</option>
                          <option value="Urgent">Urgent</option>
                        </select>
                      </div>
                      <div className="portal-form-group">
                        <label>Deadline</label>
                        <input type="date" className="portal-form-control" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                      </div>
                    </div>

                    <div className="portal-form-grid-2">
                      <div className="portal-form-group">
                        <label>Request Status</label>
                        <select className="portal-form-control" value={status} onChange={e => setStatus(e.target.value as any)}>
                          <option value="submitted">Submitted</option>
                          <option value="active">Active</option>
                          <option value="in_progress">In Progress</option>
                          <option value="on_hold">On Hold</option>
                          <option value="clarification_required">Clarification Required</option>
                          <option value="completed">Completed</option>
                          <option value="closed">Closed</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                      <div className="portal-form-group">
                        <label>Verification</label>
                        <select className="portal-form-control" value={verificationStatus} onChange={e => setVerificationStatus(e.target.value as any)}>
                          <option value="Pending">Pending</option>
                          <option value="Verified">Verified</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                    </div>

                    <div className="portal-form-group">
                      <label>Verification Remarks</label>
                      <textarea className="portal-form-control" rows={2} value={verificationRemarks} onChange={e => setVerificationRemarks(e.target.value)} placeholder="Feedback for client documents..." />
                    </div>

                    <div className="portal-form-group">
                      <label>Internal Registry Notes</label>
                      <textarea className="portal-form-control" rows={3} value={internalNotes} onChange={e => setInternalNotes(e.target.value)} placeholder="Confidential firm notes..." />
                    </div>
                  </div>
                ) : (
                  <div className="client-info-box" style={{ marginTop: 24 }}>
                    <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Your request will be assigned to our specialized legal team within 4 business hours. You can track progress in the dashboard.</p>
                  </div>
                )}

                <div className="form-actions" style={{ marginTop: 40, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 24 }}>
                  <button onClick={saveRequest} disabled={submitting} className="btn-portal-primary full-width">
                    {submitting ? 'Processing...' : id ? 'Update Mandate' : 'Initialize Mandate'}
                  </button>
                  <button onClick={() => navigate('/dashboard/requests')} className="btn-portal-outline full-width" style={{ marginTop: 12 }}>Cancel</button>
                  {error && <p className="error-text" style={{ marginTop: 16 }}>{error}</p>}
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
