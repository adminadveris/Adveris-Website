/**
 * ADVERIS MOCK API LAYER
 * Mimics Supabase return structures using Browser LocalStorage.
 * Enable "Local-First" testing before cloud migration.
 */

const STORAGE_KEYS = {
  RECORDS: 'adveris_records',
  TIMESHEETS: 'adveris_timesheets',
  EXPENSES: 'adveris_expenses',
  LOGS: 'adveris_audit_logs',
  PROFILE: 'adveris_mock_session',
  ACCOUNTS: 'adveris_accounts',
  CLIENTS: 'adveris_clients',
};

// Helper
const getLS = (key: string) => {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
};
const setLS = (key: string, val: any) => localStorage.setItem(key, JSON.stringify(val));

export const mockApi = {
  // --- AUTH/PROFILE ---
  getProfile: async () => {
    const session = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (session) return JSON.parse(session);
    return {
      id: 'mock-user-123',
      role: 'admin',
      full_name: 'Adveris Admin (Local)',
      expertise_tags: ['VC & Private Equity', 'M&A', 'Corporate Advisory & Structuring']
    };
  },

  // --- ACCOUNTS (CRM) ---
  getAccounts: async () => getLS(STORAGE_KEYS.ACCOUNTS),

  getAccountById: async (id: string) => {
    const all = getLS(STORAGE_KEYS.ACCOUNTS);
    return all.find((a: any) => a.id === id) || null;
  },

  findAccountByPAN: async (pan: string) => {
    const all = getLS(STORAGE_KEYS.ACCOUNTS);
    return all.find((a: any) => a.pan_number && a.pan_number.toUpperCase() === pan.toUpperCase()) || null;
  },

  createAccount: async (data: any) => {
    const existing = getLS(STORAGE_KEYS.ACCOUNTS);
    // Duplicate PAN check
    if (data.pan_number) {
      const dup = existing.find((a: any) =>
        a.pan_number && a.pan_number.toUpperCase() === data.pan_number.toUpperCase()
      );
      if (dup) throw new Error(`An account with PAN "${data.pan_number}" already exists: ${dup.account_name}`);
    }
    const newAcc = { 
      ...data, 
      id: crypto.randomUUID(), 
      created_at: new Date().toISOString(),
      cin_number: data.cin_number || '',
      gstin_number: data.gstin_number || ''
    };
    setLS(STORAGE_KEYS.ACCOUNTS, [newAcc, ...existing]);
    await mockApi.logChange('accounts', newAcc.id, 'CREATE', 'account', null, newAcc.account_name);
    return newAcc;
  },

  updateAccount: async (id: string, data: any) => {
    const all = getLS(STORAGE_KEYS.ACCOUNTS);
    const idx = all.findIndex((a: any) => a.id === id);
    if (idx === -1) throw new Error('Account not found');
    const updated = { ...all[idx], ...data };
    all[idx] = updated;
    setLS(STORAGE_KEYS.ACCOUNTS, all);
    await mockApi.logChange('accounts', id, 'UPDATE', 'account', all[idx].account_name, data.account_name || all[idx].account_name);
    return updated;
  },

  // --- CLIENTS (CRM) ---
  getClients: async () => getLS(STORAGE_KEYS.CLIENTS),

  getClientsByAccount: async (accountId: string) => {
    const all = getLS(STORAGE_KEYS.CLIENTS);
    return all.filter((c: any) => c.account_id === accountId);
  },

  getClientById: async (id: string) => {
    const all = getLS(STORAGE_KEYS.CLIENTS);
    return all.find((c: any) => c.id === id) || null;
  },

  createClient: async (data: any) => {
    const existing = getLS(STORAGE_KEYS.CLIENTS);
    const newClient = { ...data, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    setLS(STORAGE_KEYS.CLIENTS, [newClient, ...existing]);
    await mockApi.logChange('clients', newClient.id, 'CREATE', 'client', null, newClient.client_name);
    return newClient;
  },

  updateClient: async (id: string, data: any) => {
    const all = getLS(STORAGE_KEYS.CLIENTS);
    const idx = all.findIndex((c: any) => c.id === id);
    if (idx === -1) throw new Error('Client not found');
    const updated = { ...all[idx], ...data };
    all[idx] = updated;
    setLS(STORAGE_KEYS.CLIENTS, all);
    await mockApi.logChange('clients', id, 'UPDATE', 'client', all[idx].client_name, data.client_name || all[idx].client_name);
    return updated;
  },

  // --- SERVICE RECORDS ---
  getRecords: async () => getLS(STORAGE_KEYS.RECORDS),

  getRecordsByAccount: async (accountId: string) => {
    const all = getLS(STORAGE_KEYS.RECORDS);
    return all.filter((r: any) => r.account_id === accountId);
  },

  createRecord: async (record: any) => {
    const existing = getLS(STORAGE_KEYS.RECORDS);
    const profile = await mockApi.getProfile();
    const newRecord = {
      // Defaults first
      status: 'pending',
      request_number: `ADV-${Math.floor(100 + Math.random() * 900)}`,
      priority: 'Standard',
      
      // Admin overrides
      ...record,

      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      submitted_by: profile.id,
      submitted_by_name: profile.full_name,
    };
    setLS(STORAGE_KEYS.RECORDS, [newRecord, ...existing]);
    await mockApi.logChange('records', newRecord.id, 'CREATE', 'mandate', null, newRecord.request_number);
    return newRecord;
  },

  updateRecord: async (id: string, data: any) => {
    const all = getLS(STORAGE_KEYS.RECORDS);
    const idx = all.findIndex((r: any) => r.id === id);
    if (idx === -1) throw new Error('Record not found');
    const old = all[idx];
    all[idx] = { ...old, ...data };
    setLS(STORAGE_KEYS.RECORDS, all);
    // Log each changed field
    for (const [field, newVal] of Object.entries(data)) {
      if (old[field] !== newVal) {
        await mockApi.logChange('records', id, 'UPDATE', field, String(old[field] ?? ''), String(newVal ?? ''));
      }
    }
    return all[idx];
  },

  // --- TIMESHEETS ---
  getTimesheets: async (recordId?: string) => {
    const all = getLS(STORAGE_KEYS.TIMESHEETS);
    return recordId ? all.filter((t: any) => t.record_id === recordId) : all;
  },

  createTimesheet: async (entry: any) => {
    const existing = getLS(STORAGE_KEYS.TIMESHEETS);
    const profile = await mockApi.getProfile();
    const newEntry = { 
      ...entry, 
      id: crypto.randomUUID(), 
      created_at: new Date().toISOString(), 
      logged_by: profile.full_name,
      status: 'submitted', // Default status
      account_id: entry.account_id || '', 
      account_name: entry.account_name || ''
    };
    setLS(STORAGE_KEYS.TIMESHEETS, [newEntry, ...existing]);
    await mockApi.logChange('timesheets', entry.record_id, 'UPDATE', 'hours_logged', null, `${entry.hours}h by ${profile.full_name}`);
    return newEntry;
  },

  updateTimesheet: async (id: string, data: any) => {
    const all = getLS(STORAGE_KEYS.TIMESHEETS);
    const idx = all.findIndex((t: any) => t.id === id);
    if (idx === -1) throw new Error('Time log not found');
    const updated = { ...all[idx], ...data, updated_at: new Date().toISOString() };
    all[idx] = updated;
    setLS(STORAGE_KEYS.TIMESHEETS, all);
    await mockApi.logChange('timesheets', updated.record_id, 'UPDATE', 'hours_logged', null, `${updated.hours}h updated`);
    return updated;
  },

  bulkUpdateTimesheetsStatus: async (ids: string[], status: string) => {
    const all = getLS(STORAGE_KEYS.TIMESHEETS);
    const updatedAll = all.map((t: any) => ids.includes(t.id) ? { ...t, status, updated_at: new Date().toISOString() } : t);
    setLS(STORAGE_KEYS.TIMESHEETS, updatedAll);
    await mockApi.logChange('timesheets', 'bulk', 'UPDATE', 'status_change', null, `${ids.length} entries marked as ${status}`);
    return updatedAll;
  },

  // --- EXPENSES ---
  getExpenses: async (recordId?: string) => {
    const all = getLS(STORAGE_KEYS.EXPENSES);
    return recordId ? all.filter((e: any) => e.record_id === recordId) : all;
  },

  createExpense: async (entry: any) => {
    const all = getLS(STORAGE_KEYS.EXPENSES);
    const newEntry = { 
      ...entry, 
      id: crypto.randomUUID(), 
      created_at: new Date().toISOString(),
      status: 'submitted', // Default status
      account_id: entry.account_id || '', 
      account_name: entry.account_name || '', 
      url: entry.url || ''
    };
    setLS(STORAGE_KEYS.EXPENSES, [newEntry, ...all]);
    await mockApi.logChange('expenses', entry.account_id, 'UPDATE', 'expense', null, `${entry.amount} INR recorded`);
    return newEntry;
  },

  updateExpense: async (id: string, data: any) => {
    const all = getLS(STORAGE_KEYS.EXPENSES);
    const idx = all.findIndex((e: any) => e.id === id);
    if (idx === -1) throw new Error('Expense record not found');
    const updated = { ...all[idx], ...data, updated_at: new Date().toISOString() };
    all[idx] = updated;
    setLS(STORAGE_KEYS.EXPENSES, all);
    await mockApi.logChange('expenses', updated.account_id, 'UPDATE', 'expense', null, `${updated.amount} INR updated`);
    return updated;
  },

  bulkUpdateExpensesStatus: async (ids: string[], status: string) => {
    const all = getLS(STORAGE_KEYS.EXPENSES);
    const updatedAll = all.map((e: any) => ids.includes(e.id) ? { ...e, status, updated_at: new Date().toISOString() } : e);
    setLS(STORAGE_KEYS.EXPENSES, updatedAll);
    await mockApi.logChange('expenses', 'bulk', 'UPDATE', 'status_change', null, `${ids.length} entries marked as ${status}`);
    return updatedAll;
  },

  // --- AUDIT / HISTORY LOGS ---
  logChange: async (table_name: string, record_id: string, action: string, field_name: string, old_value: string | null, new_value: string | null) => {
    const all = getLS(STORAGE_KEYS.LOGS);
    const profile = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILE) || '{}');
    const newLog = {
      id: crypto.randomUUID(),
      table_name,
      record_id,
      action,
      field_name,
      old_value,
      new_value,
      changed_by: profile.id || 'system',
      changed_by_name: profile.full_name || 'System',
      created_at: new Date().toISOString(),
    };
    setLS(STORAGE_KEYS.LOGS, [newLog, ...all]);
  },

  // Legacy alias kept for backward compatibility
  logAction: async (action: string, recordId: string, details: string) => {
    await mockApi.logChange('records', recordId, action, 'details', null, details);
  },

  getHistoryByRecord: async (recordId: string) => {
    const all = getLS(STORAGE_KEYS.LOGS);
    return all.filter((l: any) => l.record_id === recordId);
  },

  getAuditLogs: async () => {
    const all = getLS(STORAGE_KEYS.LOGS);
    return all.map((l: any) => ({
      id: l.id,
      timestamp: l.created_at,
      action: l.action,
      details: l.field_name === 'details'
        ? l.new_value
        : `${l.action} — ${l.field_name}: ${l.old_value ?? '(empty)'} → ${l.new_value ?? '(empty)'}`,
      user_name: l.changed_by_name,
      record_id: l.record_id,
      table_name: l.table_name,
    }));
  },

  // --- UTILS ---
  seedData: async () => {
    const accs = getLS(STORAGE_KEYS.ACCOUNTS);
    if (accs.length > 0) return; // Already seeded

    // 1. Seed Accounts
    const account1Id = crypto.randomUUID();
    const account2Id = crypto.randomUUID();
    const seededAccs = [
      { id: account1Id, account_name: 'Nexus Alpha Ventures Pvt Ltd', pan_number: 'ABCPN1234Z', cin_number: 'U72900KA2021PTC145678', gstin_number: '29ABCPN1234Z1Z5', industry: 'Venture Capital', created_at: new Date().toISOString() },
      { id: account2Id, account_name: 'Eterna Health Systems', pan_number: 'DETPH5678Q', cin_number: 'L85110MH2018PLC312456', gstin_number: '27DETPH5678Q1Z2', industry: 'Healthcare Tech', created_at: new Date().toISOString() }
    ];
    setLS(STORAGE_KEYS.ACCOUNTS, seededAccs);

    // 2. Seed Clients
    const seededClients = [
      { id: crypto.randomUUID(), account_id: account1Id, client_name: 'Vikram Malhotra', designation: 'Managing Director', email_1: 'vikram@nexusalpha.vc', phone_1: '+91 98450 12345', created_at: new Date().toISOString() },
      { id: crypto.randomUUID(), account_id: account2Id, client_name: 'Dr. Sarah Dsouza', designation: 'Chief Operations Officer', email_1: 'sarah@eterna.health', phone_1: '+91 99000 54321', created_at: new Date().toISOString() }
    ];
    setLS(STORAGE_KEYS.CLIENTS, seededClients);

    // 3. Seed Mandates (Records)
    const mandate1Id = crypto.randomUUID();
    const mandate2Id = crypto.randomUUID();
    const seededRecords = [
      { id: mandate1Id, account_id: account1Id, title: 'Series B Equity Financing', primary_service: 'Transaction Advisory', sub_service: 'Capital Raise', request_number: 'ADV-842', status: 'active', description: 'Legal advisory for $25M Series B round led by Sequoia.', created_at: new Date().toISOString() },
      { id: mandate2Id, account_id: account2Id, title: 'Company Secretarial Audit', primary_service: 'Corporate Secretarial', sub_service: 'Compliance Audit', request_number: 'ADV-109', status: 'active', description: 'Annual statutory audit for FY2023-24 compliance.', created_at: new Date().toISOString() }
    ];
    setLS(STORAGE_KEYS.RECORDS, seededRecords);

    // 4. Seed Timesheets (matching the 128.5 hours from screenshot)
    const seededTimesheets = [
      { id: crypto.randomUUID(), record_id: mandate1Id, hours: 85.5, date: '2024-04-10', logged_by: 'Adveris Admin', created_at: new Date().toISOString() },
      { id: crypto.randomUUID(), record_id: mandate2Id, hours: 43.0, date: '2024-04-11', logged_by: 'Adveris Admin', created_at: new Date().toISOString() }
    ];
    setLS(STORAGE_KEYS.TIMESHEETS, seededTimesheets);

    // 5. Seed Audit Logs
    await mockApi.logChange('records', mandate1Id, 'CREATE', 'mandate', null, 'ADV-842');
    await mockApi.logChange('timesheets', mandate1Id, 'UPDATE', 'hours_logged', null, '85.5h');
  },

  resetDatabase: () => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    window.location.reload();
  }
};

// Auto-seed on load
mockApi.seedData();

