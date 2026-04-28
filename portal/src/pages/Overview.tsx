import { useState, useEffect } from 'react';
import { mockApi } from '../lib/mockApi';
import { useAuth } from '../contexts/AuthContext';

const Overview = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    pendingVerifications: 0,
    activeMandates: 0,
    totalAccounts: 0,
    paidThisMonth: 0,
    pendingCurrMonth: 0,
    pendingLastMonth: 0,
    currWeekHours: 0,
    lastWeekHours: 0,
    pendingTimesheets: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOverviewTelemetery = async () => {
      if (!profile) return;
      try {
        const [recs, tlogs, elogs, accs, clis] = await Promise.all([
          mockApi.getRecords(),
          mockApi.getTimesheets(),
          mockApi.getExpenses(),
          mockApi.getAccounts(),
          mockApi.getClients()
        ]);
        
        const now = new Date();
        
        // Date Helpers
        const getMonday = (d: Date) => {
          const day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1);
          return new Date(d.setDate(diff)).setHours(0,0,0,0);
        };
        
        const startOfThisWeek = getMonday(new Date(now));
        const startOfLastWeek = startOfThisWeek - (7 * 24 * 60 * 60 * 1000);
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime();

        // --- Role Based Security Filtering ---
        let fRecs = recs;
        let fTlogs = tlogs;
        let fElogs = elogs;
        let fAccs = accs;
        let fClis = clis;

        if (profile.role === 'employee') {
          // Staff see ALL mandates (per request)
          fRecs = recs; 
          // But only their own timesheets and expenses
          fTlogs = tlogs.filter(t => t.logged_by === profile.full_name);
          fElogs = elogs.filter(e => e.created_by_name === profile.full_name);
          
          // Registry: For now, staff see full registry if they see all mandates
          fAccs = accs;
          fClis = clis;
        } else if (profile.role === 'client') {
          // Clients see ONLY their own data
          fRecs = recs.filter(r => r.account_id === profile.account_id);
          fTlogs = tlogs.filter(t => t.account_id === profile.account_id);
          fElogs = elogs.filter(e => e.account_id === profile.account_id);
          fAccs = accs.filter(a => a.id === profile.account_id);
          fClis = clis.filter(c => c.account_id === profile.account_id);
        }

        // 1. Operations
        const pendingVerifications = fRecs.filter(r => r.verification_status === 'Pending').length;
        const activeMandates = fRecs.filter(r => r.status !== 'completed').length;
        const totalRegistry = fAccs.length + fClis.length;

        // 2. Financials
        const paidThisMonth = fElogs
          .filter(e => e.status === 'paid' && new Date(e.date).getTime() >= startOfThisMonth)
          .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
          
        const pendingCurrMonth = fElogs
          .filter(e => e.status !== 'paid' && new Date(e.date).getTime() >= startOfThisMonth)
          .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
          
        const pendingLastMonth = fElogs
          .filter(e => e.status !== 'paid' && new Date(e.date).getTime() >= startOfLastMonth && new Date(e.date).getTime() <= endOfLastMonth)
          .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

        // 3. Timesheets
        const currWeekHours = fTlogs
          .filter(t => new Date(t.date).getTime() >= startOfThisWeek)
          .reduce((sum, t) => sum + (Number(t.hours) || 0), 0);
          
        const lastWeekHours = fTlogs
          .filter(t => new Date(t.date).getTime() >= startOfLastWeek && new Date(t.date).getTime() < startOfThisWeek)
          .reduce((sum, t) => sum + (Number(t.hours) || 0), 0);
          
        const pendingTimesheets = fTlogs.filter(t => t.status === 'submitted').length;

        setStats({
          pendingVerifications, activeMandates, totalAccounts: totalRegistry,
          paidThisMonth, pendingCurrMonth, pendingLastMonth,
          currWeekHours, lastWeekHours, pendingTimesheets
        });
      } catch (err) {
        console.error("Telemetry failure:", err);
      } finally {
        setLoading(false);
      }
    };
    loadOverviewTelemetery();
  }, [profile]);

  const sections = [
    {
      title: 'OPERATIONS & VERIFICATION',
      cards: [
        { label: 'PENDING VERIFICATION', value: stats.pendingVerifications.toString(), suffix: 'LEDS', accent: 'saffron', icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/> },
        { label: 'ACTIVE MANDATES', value: stats.activeMandates.toString(), suffix: 'LIVE', accent: 'gold', icon: <circle cx="12" cy="12" r="10"/> },
        { label: 'TOTAL REGISTRY', value: stats.totalAccounts.toString(), suffix: 'STK', accent: 'dim', icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></> }
      ]
    },
    {
      title: 'FINANCIAL DISBURSALS',
      cards: [
        { label: 'PAID THIS MONTH', value: '₹' + stats.paidThisMonth.toLocaleString('en-IN'), suffix: '', accent: 'gold', icon: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/> },
        { label: 'PENDING (CURR MONTH)', value: '₹' + stats.pendingCurrMonth.toLocaleString('en-IN'), suffix: '', accent: 'saffron', icon: <><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></> },
        { label: 'PENDING (LAST MONTH)', value: '₹' + stats.pendingLastMonth.toLocaleString('en-IN'), suffix: '', accent: 'dim', icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> }
      ]
    },
    {
      title: 'PROFESSIONAL TIMESHEETS',
      cards: [
        { label: 'THIS WEEK HOURS', value: stats.currWeekHours.toFixed(1), suffix: 'HRS', accent: 'gold', icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> },
        { label: 'LAST WEEK HOURS', value: stats.lastWeekHours.toFixed(1), suffix: 'HRS', accent: 'dim', icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> },
        { label: 'PENDING APPROVAL', value: stats.pendingTimesheets.toString(), suffix: 'LOGS', accent: 'saffron', icon: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></> }
      ]
    }
  ];

  if (loading) return (
    <div className="portal-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="intelligence-pulse">SYNCING ACCOUNT TELEMETRY...</div>
    </div>
  );

  return (
    <div className="theater-container" style={{ paddingTop: 0, paddingBottom: 60 }}>
      {sections.map((section, sIdx) => (
        <div key={section.title} style={{ marginBottom: sIdx === sections.length - 1 ? 0 : 32 }}>
          <div className="firm-intel-tag" style={{ marginBottom: 12, fontSize: '0.55rem', opacity: 0.3, letterSpacing: '0.2em' }}>{section.title}</div>
          <div className="dashboard-grid">
            {section.cards.map(c => (
              <div key={c.label} className="portal-panel" style={{ padding: '32px 28px', position: 'relative', overflow: 'hidden' }}>
                <div className="firm-intel-tag" style={{ marginBottom: 20, fontSize: '0.5rem', opacity: 0.4 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    {c.icon}
                  </svg>
                  {c.label}
                </div>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: '2.8rem', fontWeight: 300, lineHeight: 0.9, color: 'white' }}>
                  {c.value}<span style={{ fontSize: '0.8rem', verticalAlign: 'top', opacity: 0.3, marginLeft: 8, fontWeight: 800 }}>{c.suffix}</span>
                </div>
                <div style={{ 
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', 
                  background: c.accent === 'gold' ? 'var(--gold)' : c.accent === 'saffron' ? 'var(--saffron)' : 'rgba(255,255,255,0.05)',
                  opacity: 0.3
                }} />
              </div>
            ))}
          </div>
        </div>
      ))}
      
      <div style={{ marginTop: 60, display: 'flex', justifyContent: 'center' }}>
        <div className="portal-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 60px', textAlign: 'center', maxWidth: 600 }}>
          <div style={{ color: 'var(--gold)', marginBottom: 24, opacity: 0.2 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
              <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
            </svg>
          </div>
          <div className="firm-intel-tag" style={{ marginBottom: 32, justifyContent: 'center', opacity: 0.3 }}>PLATFORM ENCRYPTED CACHE</div>
          <button
            className="btn-portal-primary"
            style={{ padding: '14px 32px', fontSize: '0.55rem' }}
            onClick={() => { 
              localStorage.clear(); 
              window.location.href = '/portal/'; 
            }}
          >
            PURGE ACCOUNT DATA
          </button>
        </div>
      </div>
    </div>
  );
};

export default Overview;
