import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PortalLayout from '../components/PortalLayout';
import NewRequest from './NewRequest';
import RecordsList from './RecordsList';
import MandateDetail from './MandateDetail';
import AuditLogs from './AuditLogs';
import CRMHub from './CRMHub';
import ClientDetail from './ClientDetail';
import ClientForm from './ClientForm';
import AccountDetail from './AccountDetail';
import HistoryRegistry from './HistoryRegistry';
import { mockApi } from '../lib/mockApi';
import { useAuth } from '../contexts/AuthContext';

import Overview from './Overview';
import ClientOverview from './ClientOverview';
import Timesheets from './Timesheets';
import Expenses from './Expenses';

/* ——— DASHBOARD ROOT ——— */
const Dashboard = () => {
  const { profile, loading } = useAuth();

  if (loading || !profile) return null;

  const isClient = profile.role === 'client';

  return (
    <PortalLayout profile={profile}>
      <Routes>
        <Route path="/" element={<Navigate to={isClient ? "/dashboard/overview" : "/dashboard/overview"} replace />} />
        <Route path="overview" element={isClient ? <ClientOverview /> : <Overview />} />
        <Route path="new-request" element={<NewRequest />} />
        <Route path="records" element={<RecordsList />} />
        <Route path="records/:id" element={<MandateDetail />} />
        <Route path="records/:id/edit" element={<NewRequest />} />
        <Route path="records/:id/history" element={<HistoryRegistry />} />
        <Route path="timesheets" element={<Timesheets />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="service-hub" element={<AuditLogs />} />
        <Route path="crm" element={<CRMHub />} />
        <Route path="crm/accounts/:id" element={<AccountDetail />} />
        <Route path="crm/clients/new" element={<ClientForm />} />
        <Route path="crm/clients/:id" element={<ClientDetail />} />
        <Route path="crm/clients/:id/edit" element={<ClientForm />} />
        <Route path="*" element={
          <div className="portal-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.2)' }}>
              Module under development...
            </p>
          </div>
        } />
      </Routes>
    </PortalLayout>
  );
};

export default Dashboard;
