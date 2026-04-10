import React, { useState } from 'react';
import { servicesData } from '../data/servicesData';
import { mockApi } from '../lib/mockApi';
import { useNavigate } from 'react-router-dom';

const NewRequest = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState('');
  const [optedServices, setOptedServices] = useState<string[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const currentSubServices = servicesData.find(s => s.name === selectedService)?.subServices || [];

  const handleOptedToggle = (service: string) => {
    setOptedServices(prev =>
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await mockApi.createRecord({
        title: selectedService,
        primary_service: selectedService,
        opted_sub_services: optedServices,
        additional_requirements: additionalInfo
      });
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1800);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="portal-content portal-success">
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--saffron-pale)', border: '1px solid var(--saffron-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--saffron)', marginBottom: 28 }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontStyle: 'italic', color: 'white', marginBottom: 12 }}>
          Mandate Submitted
        </h2>
        <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--saffron)', opacity: 0.7 }}>
          Routing to Dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="portal-content">
      {/* Header */}
      <div className="portal-page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1>Service <em>Request</em></h1>
            <p style={{ marginTop: 10, fontSize: '1rem', color: 'rgba(255,255,255,0.5)', fontWeight: 300 }}>
              Initiate a new strategic mandate with the firm.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
            <span style={{ color: 'var(--saffron)' }}>Step 02 / Define</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            <span>Step 03 / Submit</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          
          {/* Left Column */}
          <div>
            <div className="portal-panel" style={{ marginBottom: 24 }}>
              <div className="portal-panel-header">
                <h2>Service Portfolio</h2>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--saffron)' }}>01</span>
              </div>
              <div className="portal-panel-body">
                <div className="portal-form-group">
                  <label className="portal-form-label">Primary Service Area</label>
                  <select
                    required
                    className="portal-form-control"
                    value={selectedService}
                    onChange={e => { setSelectedService(e.target.value); setOptedServices([]); }}
                  >
                    <option value="">Select Portfolio Category...</option>
                    {servicesData.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="portal-form-group">
                  <label className="portal-form-label">Strategic Requirements</label>
                  <textarea
                    className="portal-form-control"
                    placeholder="Detail the specific nuances, legal requirements, or constraints..."
                    value={additionalInfo}
                    onChange={e => setAdditionalInfo(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div>
            <div className="portal-panel" style={{ marginBottom: 24 }}>
              <div className="portal-panel-header">
                <h2>Scoping</h2>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--saffron)' }}>03</span>
              </div>
              <div className="portal-panel-body">
                {selectedService ? (
                  <div style={{ maxHeight: 290, overflowY: 'auto' }}>
                    {currentSubServices.map(sub => (
                      <label key={sub} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer'
                      }}>
                        <input
                          type="checkbox"
                          checked={optedServices.includes(sub)}
                          onChange={() => handleOptedToggle(sub)}
                          style={{ marginTop: 3, accentColor: 'var(--saffron)', width: 16, height: 16, cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, transition: 'color 0.2s ease' }}>
                          {sub}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 160, textAlign: 'center', opacity: 0.3 }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 12 }}>
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 600 }}>
                      Select a service first
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Upload zone */}
            <div className="portal-upload-zone">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--saffron)" strokeWidth="1.5" style={{ opacity: 0.5, margin: '0 auto 16px', display: 'block' }}>
                <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
              </svg>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Transfer mandate files</p>
              <p style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)' }}>
                Max 20MB · PDF, JPG, PNG
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div style={{ marginTop: 36, paddingTop: 28, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0.35 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--saffron)" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <p style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: 600 }}>
              Bespoke Strategic Compliance
            </p>
          </div>
          <button
            type="submit"
            disabled={loading || !selectedService}
            className="btn-portal-saffron"
          >
            {loading ? 'Processing...' : 'Initialize Mandate'}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewRequest;
