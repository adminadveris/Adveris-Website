import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

const Overview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pendingVerifications: 0,
    activeMandates: 0,
    totalAccounts: 0,
    paidThisMonth: 0,
    pendingCurrMonth: 0,
    pendingLastMonth: 0,
    currWeekHours: 0,
    lastWeekHours: 0,
    pendingTimesheets: 0,
    totalAdmins: 0,
    totalStaff: 0,
    totalClients: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOverviewTelemetery = async () => {
      if (!user) return;
      try {
        const [recs, tlogs, elogs, accs, clis, allUsers] = await Promise.all([
          api.getRecords(),
          api.getTimesheets(),
          api.getExpenses(),
          api.getAccounts(),
          api.getClients(),
          api.getAllProfiles()
        ]);

        const now = new Date();

        // Date Helpers
        const getMonday = (d: Date) => {
          const day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1);
          return new Date(d.setDate(diff)).setHours(0, 0, 0, 0);
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

        if (user.role === 'employee') {
          const expertise = user.expertise_tags || [];
          if (expertise.includes('ALL (Global Access)')) {
            fRecs = recs;
          } else {
            fRecs = recs.filter(r => expertise.includes(r.primary_service));
          }
          fTlogs = tlogs.filter(t => t.logged_by === user.full_name);
          fElogs = elogs.filter(e => e.created_by_name === user.full_name);

          fAccs = accs;
          fClis = clis;
        } else if (user.role === 'client') {
          // Clients see ONLY their own data
          fRecs = recs.filter(r => r.account_id === user.account_id);
          fTlogs = tlogs.filter(t => t.account_id === user.account_id);
          fElogs = elogs.filter(e => e.account_id === user.account_id);
          fAccs = accs.filter(a => a.id === user.account_id);
          fClis = clis.filter(c => c.account_id === user.account_id);
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

        // 4. Governance (All Users)
        const totalAdmins = allUsers.filter(u => u.role === 'admin').length;
        const totalStaff = allUsers.filter(u => u.role === 'employee').length;
        const totalClients = allUsers.filter(u => u.role === 'client').length;

        setStats({
          pendingVerifications, activeMandates, totalAccounts: totalRegistry,
          paidThisMonth, pendingCurrMonth, pendingLastMonth,
          currWeekHours, lastWeekHours, pendingTimesheets,
          totalAdmins, totalStaff, totalClients
        });
      } catch (err) {
        console.error("Telemetry failure:", err);
      } finally {
        setLoading(false);
      }
    };
    loadOverviewTelemetery();
  }, [user]);

  const sections = [
    {
      title: 'Identity & Governance',
      cards: [
        { label: 'Administrators', value: stats.totalAdmins.toString(), suffix: '', accent: 'gold', icon: <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /> },
        { label: 'Firm Staff', value: stats.totalStaff.toString(), suffix: '', accent: 'saffron', icon: <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /> },
        { label: 'External Clients', value: stats.totalClients.toString(), suffix: '', accent: 'dim', icon: <circle cx="12" cy="12" r="10" /> }
      ]
    },
    {
      title: 'Operations & Verification',
      cards: [
        { label: 'Pending Verification', value: stats.pendingVerifications.toString(), suffix: '', accent: 'saffron', icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /> },
        { label: 'Active Requests', value: stats.activeMandates.toString(), suffix: '', accent: 'gold', icon: <circle cx="12" cy="12" r="10" /> },
        { label: 'Total Registry', value: stats.totalAccounts.toString(), suffix: '', accent: 'dim', icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></> }
      ]
    },
    {
      title: 'Financial Disbursals',
      cards: [
        { label: 'Paid This Month', value: '₹' + stats.paidThisMonth.toLocaleString('en-IN'), suffix: '', accent: 'gold', icon: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /> },
        { label: 'Pending (Curr Month)', value: '₹' + stats.pendingCurrMonth.toLocaleString('en-IN'), suffix: '', accent: 'saffron', icon: <><rect x="2" y="4" width="20" height="16" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></> },
        { label: 'Pending (Last Month)', value: '₹' + stats.pendingLastMonth.toLocaleString('en-IN'), suffix: '', accent: 'dim', icon: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></> }
      ]
    },
    {
      title: 'Professional Timesheets',
      cards: [
        { label: 'This Week Hours', value: stats.currWeekHours.toFixed(1), suffix: 'Hrs', accent: 'gold', icon: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></> },
        { label: 'Last Week Hours', value: stats.lastWeekHours.toFixed(1), suffix: 'Hrs', accent: 'dim', icon: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></> },
        { label: 'Pending Approval', value: stats.pendingTimesheets.toString(), suffix: 'Logs', accent: 'saffron', icon: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></> }
      ]
    }
  ];

  if (loading) return (
    <div className="portal-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="intelligence-pulse">Syncing Adveris Advisors Dashboard...</div>
    </div>
  );

  return (
    <div className="theater-container" style={{ paddingTop: 40, paddingBottom: 60 }}>
      {sections.map((section, sIdx) => (
        <div key={section.title} style={{ marginBottom: sIdx === sections.length - 1 ? 0 : 48 }}>
          <div className="firm-intel-tag" style={{ marginBottom: 16 }}>{section.title}</div>
          <div className="dashboard-grid">
            {section.cards.map(c => (
              <div key={c.label} className="portal-panel" style={{ padding: '32px 28px', position: 'relative', overflow: 'hidden' }}>
                <div className="firm-intel-tag" style={{ marginBottom: 20, opacity: 0.5, fontSize: '0.65rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    {c.icon}
                  </svg>
                  {c.label}
                </div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: '2.8rem', fontWeight: 600, lineHeight: 0.9, color: 'white' }}>
                  {c.value}<span style={{ fontSize: '0.85rem', verticalAlign: 'top', opacity: 0.3, marginLeft: 8, fontWeight: 600 }}>{c.suffix}</span>
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
    </div>
  );
};

export default Overview;
