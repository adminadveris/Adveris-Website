import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PortalLayout from '../components/PortalLayout';
import NewRequest from './NewRequest';
import RequestsList from './RequestsList';
import MandateDetail from './MandateDetail';
import AuditLogs from './AuditLogs';
import CRMHub from './CRMHub';
import ClientDetail from './ClientDetail';
import ClientForm from './ClientForm';
import AccountDetail from './AccountDetail';
import HistoryRegistry from './HistoryRegistry';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

import UserManagement from './UserManagement';
import Overview from './Overview';
import ClientOverview from './ClientOverview';
import Timesheets from './Timesheets';
import Expenses from './Expenses';
import UserProfile from './UserProfile';

/* ——— DASHBOARD ROOT ——— */
const Dashboard = () => {
  const { user, loading } = useAuth();

  if (loading || !user) return null;

  const isClient = user.role === 'client';

  return (
    <PortalLayout user={user}>
      <Routes>
        <Route path="/" element={<Navigate to={isClient ? "/dashboard/overview" : "/dashboard/overview"} replace />} />
        <Route path="overview" element={isClient ? <ClientOverview /> : <Overview />} />
        <Route path="profile" element={<UserProfile />} />
        <Route path="new-request" element={<NewRequest />} />
        <Route path="requests" element={<RequestsList />} />
        <Route path="requests/:id" element={<MandateDetail />} />
        <Route path="requests/:id/edit" element={<NewRequest />} />
        <Route path="requests/:id/history" element={<HistoryRegistry />} />
        <Route path="timesheets" element={<Timesheets />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="service-hub" element={<AuditLogs />} />
        <Route path="crm" element={<CRMHub />} />
        <Route path="crm/accounts/:id" element={<AccountDetail />} />
        <Route path="crm/clients/new" element={<ClientForm />} />
        <Route path="crm/clients/:id" element={<ClientDetail />} />
        <Route path="crm/clients/:id/edit" element={<ClientForm />} />
        {(user.role === 'admin' || user.role === 'employee') && <Route path="users" element={<UserManagement />} />}
        <Route path="*" element={
          <div className="portal-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '1.8rem', fontWeight: 600, fontStyle: 'italic', color: 'rgba(255,255,255,0.2)' }}>
              Module Under Development...
            </p>
          </div>
        } />
      </Routes>
    </PortalLayout>
  );
};

export default Dashboard;
