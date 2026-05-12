import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

const inr = (value: number) => `INR ${value.toLocaleString('en-IN')}`;
const pct = (value: number, total: number) => total > 0 ? Math.max(4, Math.round((value / total) * 100)) : 0;

const MiniBar = ({ label, value, max, tone = 'gold' }: { label: string; value: number; max: number; tone?: 'gold' | 'saffron' | 'green' | 'blue' }) => (
  <div className="overview-chart-row">
    <div>
      <span>{label}</span>
      <strong>{value.toFixed(value % 1 === 0 ? 0 : 1)}</strong>
    </div>
    <div className="overview-chart-track">
      <i className={`tone-${tone}`} style={{ width: `${pct(value, max)}%` }} />
    </div>
  </div>
);

const Donut = ({ admins, staff, clients }: { admins: number; staff: number; clients: number }) => {
  const total = Math.max(1, admins + staff + clients);
  const admin = (admins / total) * 100;
  const staffPct = (staff / total) * 100;

  return (
    <div className="overview-donut-wrap">
      <div
        className="overview-donut"
        style={{
          background: `conic-gradient(var(--saffron) 0 ${admin}%, #38bdf8 ${admin}% ${admin + staffPct}%, rgba(255,255,255,0.16) ${admin + staffPct}% 100%)`
        }}
      >
        <div>
          <strong>{admins + staff + clients}</strong>
          <span>Users</span>
        </div>
      </div>
      <div className="overview-legend">
        <span><i className="tone-saffron" /> Admins {admins}</span>
        <span><i className="tone-blue" /> Staff {staff}</span>
        <span><i /> Clients {clients}</span>
      </div>
    </div>
  );
};

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
    currMonthHours: 0,
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
        const getMonday = (d: Date) => {
          const day = d.getDay();
          const diff = d.getDate() - day + (day === 0 ? -6 : 1);
          return new Date(d.setDate(diff)).setHours(0, 0, 0, 0);
        };

        const startOfThisWeek = getMonday(new Date(now));
        const startOfLastWeek = startOfThisWeek - (7 * 24 * 60 * 60 * 1000);
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime();

        let fRecs = recs;
        let fTlogs = tlogs;
        let fElogs = elogs;
        let fAccs = accs;
        let fClis = clis;

        if (user.role === 'employee') {
          const expertise = user.expertise_tags || [];
          fRecs = expertise.includes('ALL (Global Access)')
            ? recs
            : recs.filter(r => expertise.includes(r.primary_service));
          fTlogs = tlogs.filter(t => t.user_id === user.id);
          fElogs = elogs.filter(e => e.user_id === user.id);
        } else if (user.role === 'client') {
          fRecs = recs.filter(r => r.account_id === user.account_id);
          fTlogs = tlogs.filter(t => t.account_id === user.account_id);
          fElogs = elogs.filter(e => e.account_id === user.account_id);
          fAccs = accs.filter(a => a.id === user.account_id);
          fClis = clis.filter(c => c.account_id === user.account_id);
        }

        const pendingVerifications = fRecs.filter(r => r.verification_status === 'Pending').length;
        const activeMandates = fRecs.filter(r => r.status !== 'completed' && r.status !== 'on_hold').length;
        const totalRegistry = fAccs.length + fClis.length;

        const paidThisMonth = fElogs
          .filter(e => (e.status === 'paid' || e.status === 'approved') && new Date(e.date).getTime() >= startOfThisMonth)
          .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

        const pendingCurrMonth = fElogs
          .filter(e => e.status === 'submitted' && new Date(e.date).getTime() >= startOfThisMonth)
          .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

        const pendingLastMonth = fElogs
          .filter(e => e.status === 'submitted' && new Date(e.date).getTime() >= startOfLastMonth && new Date(e.date).getTime() <= endOfLastMonth)
          .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

        const currWeekHours = fTlogs
          .filter(t => new Date(t.date).getTime() >= startOfThisWeek)
          .reduce((sum, t) => sum + (Number(t.hours) || 0), 0);

        const lastWeekHours = fTlogs
          .filter(t => new Date(t.date).getTime() >= startOfLastWeek && new Date(t.date).getTime() < startOfThisWeek)
          .reduce((sum, t) => sum + (Number(t.hours) || 0), 0);

        const currMonthHours = fTlogs
          .filter(t => new Date(t.date).getTime() >= startOfThisMonth)
          .reduce((sum, t) => sum + (Number(t.hours) || 0), 0);

        setStats({
          pendingVerifications,
          activeMandates,
          totalAccounts: totalRegistry,
          paidThisMonth,
          pendingCurrMonth,
          pendingLastMonth,
          currWeekHours,
          lastWeekHours,
          currMonthHours,
          totalAdmins: allUsers.filter(u => u.role === 'admin').length,
          totalStaff: allUsers.filter(u => u.role === 'employee').length,
          totalClients: allUsers.filter(u => u.role === 'client').length
        });
      } catch (err) {
        console.error('Telemetry failure:', err);
      } finally {
        setLoading(false);
      }
    };

    loadOverviewTelemetery();
  }, [user]);

  if (loading) {
    return (
      <div className="portal-content overview-loading">
        <div className="intelligence-pulse">Syncing Adveris Advisors Dashboard...</div>
      </div>
    );
  }

  const maxHours = Math.max(stats.currWeekHours, stats.lastWeekHours, stats.currMonthHours, 1);
  const maxMoney = Math.max(stats.paidThisMonth, stats.pendingCurrMonth, stats.pendingLastMonth, 1);
  const requestTotal = Math.max(stats.pendingVerifications + stats.activeMandates, 1);
  const healthScore = Math.max(0, Math.min(100, 100 - (stats.pendingVerifications * 12) + (stats.currWeekHours > 0 ? 6 : 0)));

  return (
    <div className="overview-analytics">
      <section className="overview-topline">
        <div>
          <div className="enterprise-eyebrow">Dashboard</div>
          <h1>Operational Overview</h1>
          <p>Live picture of work, money, time, and access.</p>
        </div>
        <div className="overview-health-card portal-panel">
          <span>Operating Score</span>
          <strong>{healthScore}</strong>
          <p>{stats.pendingVerifications > 0 ? 'Action required' : 'Healthy queue'}</p>
        </div>
      </section>

      <section className="overview-kpi-strip">
        <div className="portal-panel">
          <span>Pending Verification</span>
          <strong>{stats.pendingVerifications}</strong>
        </div>
        <div className="portal-panel">
          <span>Active Requests</span>
          <strong>{stats.activeMandates}</strong>
        </div>
        <div className="portal-panel">
          <span>This Week</span>
          <strong>{stats.currWeekHours.toFixed(1)}h</strong>
        </div>
        <div className="portal-panel">
          <span>Pending Expense</span>
          <strong>{inr(stats.pendingCurrMonth)}</strong>
        </div>
      </section>

      <section className="overview-analytics-grid">
        <div className="portal-panel overview-analytics-card overview-card-large">
          <div className="overview-card-head">
            <div>
              <h2>Workload Mix</h2>
              <p>Request distribution across verification and active work.</p>
            </div>
          </div>
          <div className="overview-workload-chart">
            <div className="overview-workload-bar">
              <i className="tone-saffron" style={{ width: `${pct(stats.pendingVerifications, requestTotal)}%` }} />
              <i className="tone-blue" style={{ width: `${pct(stats.activeMandates, requestTotal)}%` }} />
            </div>
            <div className="overview-workload-values">
              <div><span>Pending</span><strong>{stats.pendingVerifications}</strong></div>
              <div><span>Active</span><strong>{stats.activeMandates}</strong></div>
              <div><span>Registry</span><strong>{stats.totalAccounts}</strong></div>
            </div>
          </div>
        </div>

        <div className="portal-panel overview-analytics-card">
          <div className="overview-card-head">
            <div>
              <h2>Governance</h2>
              <p>Access composition.</p>
            </div>
          </div>
          <Donut admins={stats.totalAdmins} staff={stats.totalStaff} clients={stats.totalClients} />
        </div>

        <div className="portal-panel overview-analytics-card">
          <div className="overview-card-head">
            <div>
              <h2>Time Capture</h2>
              <p>Logged professional hours.</p>
            </div>
          </div>
          <div className="overview-chart-stack">
            <MiniBar label="This week" value={stats.currWeekHours} max={maxHours} tone="green" />
            <MiniBar label="Last week" value={stats.lastWeekHours} max={maxHours} tone="blue" />
            <MiniBar label="This month" value={stats.currMonthHours} max={maxHours} tone="saffron" />
          </div>
        </div>

        <div className="portal-panel overview-analytics-card overview-card-wide">
          <div className="overview-card-head">
            <div>
              <h2>Expense Flow</h2>
              <p>Disbursals and open submissions.</p>
            </div>
          </div>
          <div className="overview-money-chart">
            <MiniBar label="Paid / approved" value={stats.paidThisMonth} max={maxMoney} tone="green" />
            <MiniBar label="Pending current" value={stats.pendingCurrMonth} max={maxMoney} tone="saffron" />
            <MiniBar label="Pending last" value={stats.pendingLastMonth} max={maxMoney} tone="blue" />
          </div>
          <div className="overview-money-labels">
            <span>{inr(stats.paidThisMonth)}</span>
            <span>{inr(stats.pendingCurrMonth)}</span>
            <span>{inr(stats.pendingLastMonth)}</span>
          </div>
        </div>

        <div className="portal-panel overview-analytics-card overview-brief">
          <div className="overview-card-head">
            <div>
              <h2>Next Best Action</h2>
              <p>Suggested operational focus.</p>
            </div>
          </div>
          <strong>{stats.pendingVerifications > 0 ? 'Clear verification queue' : 'Maintain active request cadence'}</strong>
          <p>
            {stats.pendingVerifications > 0
              ? `${stats.pendingVerifications} record${stats.pendingVerifications === 1 ? '' : 's'} should be reviewed before expanding intake.`
              : 'No verification backlog detected. Review active requests and keep timesheets current.'}
          </p>
        </div>
      </section>
    </div>
  );
};

export default Overview;
