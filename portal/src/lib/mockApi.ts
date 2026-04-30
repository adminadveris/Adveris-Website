import type { 
  User, Account, Client, Request, 
  TimesheetEntry, ExpenseEntry, AuditLog, UIHistoryItem 
} from '../types';

const STORAGE_KEYS = {
  RECORDS: 'adveris_records',
  TIMESHEETS: 'adveris_timesheets',
  EXPENSES: 'adveris_expenses',
  LOGS: 'adveris_audit_logs',
  User: 'adveris_mock_session',
  ACCOUNTS: 'adveris_accounts',
  CLIENTS: 'adveris_clients',
};

// Helper
const getLS = (key: string) => {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
};
const setLS = (key: string, val: any) => localStorage.setItem(key, JSON.stringify(val));

export const mockApi = {
  // --- AUTH/User ---
  getProfile: async (): Promise<User> => {
    const session = localStorage.getItem(STORAGE_KEYS.User);
    if (session) return JSON.parse(session);
    return {
      id: 'mock-user-123',
      role: 'admin',
      full_name: 'Adveris Admin (Local)',
      expertise_tags: ['VC & Private Equity', 'M&A', 'Corporate Advisory & Structuring']
    };
  },

  // --- ACCOUNTS (CRM) ---
  getAccounts: async (): Promise<Account[]> => {
    const all: Account[] = getLS(STORAGE_KEYS.ACCOUNTS);
    const User = await mockApi.getProfile();
    if (User.role === 'admin') return all;
    if (User.role === 'employee') return all; 
    if (User.role === 'client' && User.account_id) {
      return all.filter((a: Account) => a.id === User.account_id);
    }
    return [];
  },

  getAccountById: async (id: string): Promise<Account | null> => {
    const all = await mockApi.getAccounts();
    return all.find((a: Account) => a.id === id) || null;
  },

  findAccountByPAN: async (pan: string): Promise<Account | null> => {
    const all: Account[] = getLS(STORAGE_KEYS.ACCOUNTS);
    const User = await mockApi.getProfile();
    const match = all.find((a: Account) => a.pan_number && a.pan_number.toUpperCase() === pan.toUpperCase());
    if (!match) return null;
    if (User.role === 'client' && User.account_id && match.id !== User.account_id) return null;
    return match;
  },

  createAccount: async (data: Partial<Account>): Promise<Account> => {
    const existing: Account[] = getLS(STORAGE_KEYS.ACCOUNTS);
    if (data.pan_number) {
      const dup = existing.find((a: Account) =>
        a.pan_number && a.pan_number.toUpperCase() === data.pan_number?.toUpperCase()
      );
      if (dup) throw new Error(`An account with PAN "${data.pan_number}" already exists: ${dup.account_name}`);
    }
    const User = await mockApi.getProfile();
    const newAcc: Account = { 
      account_name: '',
      ...data, 
      id: crypto.randomUUID(), 
      created_at: new Date().toISOString(),
      created_by_name: User.full_name,
      updated_at: new Date().toISOString(),
      updated_by_name: User.full_name,
      cin_number: data.cin_number || '',
      gstin_number: data.gstin_number || '',
      house_no: data.house_no || '',
      street_1: data.street_1 || '',
      street_2: data.street_2 || '',
      street_3: data.street_3 || '',
      landmark: data.landmark || '',
      city: data.city || '',
      state: data.state || '',
      country: data.country || '',
      pincode: data.pincode || '',
    } as Account;
    setLS(STORAGE_KEYS.ACCOUNTS, [newAcc, ...existing]);
    await mockApi.logChange('accounts', newAcc.id, 'CREATE', 'account', null, newAcc.account_name);
    return newAcc;
  },

  updateAccount: async (id: string, data: Partial<Account>): Promise<Account> => {
    const all: Account[] = getLS(STORAGE_KEYS.ACCOUNTS);
    const User = await mockApi.getProfile();
    const idx = all.findIndex((a: Account) => a.id === id);
    if (idx === -1) throw new Error('Account not found');
    if (User.role === 'client' && User.account_id !== id) throw new Error('Access Denied');

    const old = all[idx];
    const updated: Account = { 
      ...old, 
      ...data, 
      updated_at: new Date().toISOString(),
      updated_by_name: User.full_name
    };
    all[idx] = updated;
    setLS(STORAGE_KEYS.ACCOUNTS, all);
    for (const [field, newVal] of Object.entries(data)) {
      if (old[field as keyof Account] !== newVal) {
        await mockApi.logChange('accounts', id, 'UPDATE', field, String(old[field as keyof Account] ?? ''), String(newVal ?? ''));
      }
    }
    return updated;
  },

  // --- CLIENTS (CRM) ---
  getClients: async (): Promise<Client[]> => {
    const all: Client[] = getLS(STORAGE_KEYS.CLIENTS);
    const User = await mockApi.getProfile();
    if (User.role === 'admin' || User.role === 'employee') return all;
    if (User.role === 'client' && User.account_id) {
      return all.filter((c: Client) => c.account_id === User.account_id);
    }
    return [];
  },

  getClientsByAccount: async (accountId: string): Promise<Client[]> => {
    const all = await mockApi.getClients();
    return all.filter((c: Client) => c.account_id === accountId);
  },

  getClientById: async (id: string): Promise<Client | null> => {
    const all = await mockApi.getClients();
    return all.find((c: Client) => c.id === id) || null;
  },

  createClient: async (data: Partial<Client>): Promise<Client> => {
    const existing: Client[] = getLS(STORAGE_KEYS.CLIENTS);
    const User = await mockApi.getProfile();
    const newClient: Client = { 
      account_id: '', client_name: '', email_1: '', email_2: '', email_3: '',
      phone_1: '', phone_2: '', phone_3: '',
      ...data, 
      id: crypto.randomUUID(), 
      created_at: new Date().toISOString(),
      created_by_name: User.full_name,
      updated_at: new Date().toISOString(),
      updated_by_name: User.full_name,
      house_no: data.house_no || '',
      street_1: data.street_1 || '',
      street_2: data.street_2 || '',
      street_3: data.street_3 || '',
      landmark: data.landmark || '',
      city: data.city || '',
      state: data.state || '',
      country: data.country || '',
      pincode: data.pincode || '',
    } as Client;
    setLS(STORAGE_KEYS.CLIENTS, [newClient, ...existing]);
    await mockApi.logChange('clients', newClient.id, 'CREATE', 'client', null, newClient.client_name);
    return newClient;
  },

  updateClient: async (id: string, data: Partial<Client>): Promise<Client> => {
    const all: Client[] = getLS(STORAGE_KEYS.CLIENTS);
    const User = await mockApi.getProfile();
    const idx = all.findIndex((c: Client) => c.id === id);
    if (idx === -1) throw new Error('Client not found');
    const old = all[idx];
    if (User.role === 'client' && User.account_id !== old.account_id) throw new Error('Access Denied');

    const updated: Client = { ...old, ...data, updated_at: new Date().toISOString(), updated_by_name: User.full_name };
    all[idx] = updated;
    setLS(STORAGE_KEYS.CLIENTS, all);
    for (const [field, newVal] of Object.entries(data)) {
      if (old[field as keyof Client] !== newVal) {
        await mockApi.logChange('clients', id, 'UPDATE', field, String(old[field as keyof Client] ?? ''), String(newVal ?? ''));
      }
    }
    return updated;
  },

  // --- SERVICE RECORDS ---
  getRecords: async (): Promise<Request[]> => {
    const all: Request[] = getLS(STORAGE_KEYS.RECORDS);
    const User = await mockApi.getProfile();
    if (User.role === 'admin' || User.role === 'employee') return all;
    if (User.role === 'client' && User.account_id) {
      return all.filter((r: Request) => r.account_id === User.account_id);
    }
    return [];
  },

  createRecord: async (record: Partial<Request>): Promise<Request> => {
    const existing: Request[] = getLS(STORAGE_KEYS.RECORDS);
    const User = await mockApi.getProfile();
    const newRecord: Request = {
      id: crypto.randomUUID(), account_id: '', account_name: '',
      request_number: `ADV-${Math.floor(100 + Math.random() * 900)}`,
      title: '', primary_service: '', sub_service: '', status: 'pending', priority: 'Standard',
      verification_status: 'Pending', submitted_by: User.id, submitted_by_name: User.full_name,
      created_at: new Date().toISOString(), created_by_name: User.full_name,
      updated_at: new Date().toISOString(), updated_by_name: User.full_name,
      ...record,
    } as Request;
    setLS(STORAGE_KEYS.RECORDS, [newRecord, ...existing]);
    await mockApi.logChange('Request', newRecord.id, 'CREATE', 'mandate', null, newRecord.request_number);
    return newRecord;
  },

  updateRecord: async (id: string, data: Partial<Request>): Promise<Request> => {
    const all: Request[] = getLS(STORAGE_KEYS.RECORDS);
    const User = await mockApi.getProfile();
    const idx = all.findIndex((r: Request) => r.id === id);
    if (idx === -1) throw new Error('Record not found');
    const old = all[idx];
    if (User.role === 'client' && User.account_id !== old.account_id) throw new Error('Access Denied');

    const updated: Request = { ...old, ...data, updated_at: new Date().toISOString(), updated_by_name: User.full_name };
    all[idx] = updated;
    setLS(STORAGE_KEYS.RECORDS, all);
    for (const [field, newVal] of Object.entries(data)) {
      if (old[field as keyof Request] !== newVal) {
        await mockApi.logChange('Request', id, 'UPDATE', field, String(old[field as keyof Request] ?? ''), String(newVal ?? ''));
      }
    }
    return all[idx];
  },

  // --- TIMESHEETS ---
  getTimesheets: async (recordId?: string): Promise<TimesheetEntry[]> => {
    const all: TimesheetEntry[] = getLS(STORAGE_KEYS.TIMESHEETS);
    const User = await mockApi.getProfile();
    let filtered = all;
    if (User.role === 'client' && User.account_id) {
      filtered = all.filter((t: TimesheetEntry) => t.account_id === User.account_id);
    }
    return recordId ? filtered.filter((t: TimesheetEntry) => t.record_id === recordId) : filtered;
  },

  createTimesheet: async (entry: Partial<TimesheetEntry>): Promise<TimesheetEntry> => {
    const existing: TimesheetEntry[] = getLS(STORAGE_KEYS.TIMESHEETS);
    const User = await mockApi.getProfile();
    const newEntry: TimesheetEntry = { 
      id: crypto.randomUUID(), record_id: '', account_id: '', account_name: '',
      hours: 0, date: new Date().toISOString().split('T')[0],
      logged_by: User.full_name, status: 'submitted', 
      created_at: new Date().toISOString(), created_by_name: User.full_name,
      updated_at: new Date().toISOString(), updated_by_name: User.full_name,
      ...entry, 
    } as TimesheetEntry;
    setLS(STORAGE_KEYS.TIMESHEETS, [newEntry, ...existing]);
    if (newEntry.record_id) {
      await mockApi.logChange('timesheets', newEntry.record_id, 'UPDATE', 'hours_logged', null, `${newEntry.hours}h by ${User.full_name}`);
    }
    return newEntry;
  },

  updateTimesheet: async (id: string, data: Partial<TimesheetEntry>): Promise<TimesheetEntry> => {
    const all: TimesheetEntry[] = getLS(STORAGE_KEYS.TIMESHEETS);
    const User = await mockApi.getProfile();
    const idx = all.findIndex((t: TimesheetEntry) => t.id === id);
    if (idx === -1) throw new Error('Time log not found');
    const old = all[idx];
    if (User.role === 'employee' && old.logged_by !== User.full_name) throw new Error('Access Denied');
    if (User.role === 'client') throw new Error('Action not permitted');

    const updated: TimesheetEntry = { ...old, ...data, updated_at: new Date().toISOString(), updated_by_name: User.full_name };
    all[idx] = updated;
    setLS(STORAGE_KEYS.TIMESHEETS, all);
    for (const [field, newVal] of Object.entries(data)) {
      if (field !== 'updated_at' && old[field as keyof TimesheetEntry] !== newVal) {
        await mockApi.logChange('timesheets', updated.record_id || id, 'UPDATE', field, String(old[field as keyof TimesheetEntry] ?? ''), String(newVal ?? ''));
      }
    }
    return updated;
  },

  bulkUpdateTimesheetsStatus: async (ids: string[], status: TimesheetEntry['status']): Promise<TimesheetEntry[]> => {
    const all: TimesheetEntry[] = getLS(STORAGE_KEYS.TIMESHEETS);
    const updatedAll = all.map((t: TimesheetEntry) => ids.includes(t.id) ? { ...t, status, updated_at: new Date().toISOString() } : t);
    setLS(STORAGE_KEYS.TIMESHEETS, updatedAll);
    await mockApi.logChange('timesheets', 'bulk', 'UPDATE', 'status_change', null, `${ids.length} entries marked as ${status}`);
    return updatedAll;
  },

  // --- EXPENSES ---
  getExpenses: async (recordId?: string): Promise<ExpenseEntry[]> => {
    const all: ExpenseEntry[] = getLS(STORAGE_KEYS.EXPENSES);
    const User = await mockApi.getProfile();
    let filtered = all;
    if (User.role === 'client' && User.account_id) {
      filtered = all.filter((e: ExpenseEntry) => e.account_id === User.account_id);
    }
    return recordId ? filtered.filter((e: ExpenseEntry) => e.record_id === recordId) : filtered;
  },

  createExpense: async (entry: Partial<ExpenseEntry>): Promise<ExpenseEntry> => {
    const all: ExpenseEntry[] = getLS(STORAGE_KEYS.EXPENSES);
    const User = await mockApi.getProfile();
    const newEntry: ExpenseEntry = { 
      id: crypto.randomUUID(), record_id: '', account_id: '', account_name: '',
      amount: 0, date: new Date().toISOString().split('T')[0],
      category: 'General', status: 'submitted', 
      created_at: new Date().toISOString(), created_by_name: User.full_name,
      updated_at: new Date().toISOString(), updated_by_name: User.full_name,
      ...entry, 
    } as ExpenseEntry;
    setLS(STORAGE_KEYS.EXPENSES, [newEntry, ...all]);
    await mockApi.logChange('expenses', newEntry.account_id, 'UPDATE', 'expense', null, `${newEntry.amount} INR recorded`);
    return newEntry;
  },

  updateExpense: async (id: string, data: Partial<ExpenseEntry>): Promise<ExpenseEntry> => {
    const all: ExpenseEntry[] = getLS(STORAGE_KEYS.EXPENSES);
    const User = await mockApi.getProfile();
    const idx = all.findIndex((e: ExpenseEntry) => e.id === id);
    if (idx === -1) throw new Error('Expense record not found');
    const old = all[idx];
    if (User.role === 'employee' && old.created_by_name !== User.full_name) throw new Error('Access Denied');
    if (User.role === 'client') throw new Error('Action not permitted');

    const updated: ExpenseEntry = { ...old, ...data, updated_at: new Date().toISOString(), updated_by_name: User.full_name };
    all[idx] = updated;
    setLS(STORAGE_KEYS.EXPENSES, all);
    for (const [field, newVal] of Object.entries(data)) {
      if (field !== 'updated_at' && old[field as keyof ExpenseEntry] !== newVal) {
        await mockApi.logChange('expenses', updated.account_id || id, 'UPDATE', field, String(old[field as keyof ExpenseEntry] ?? ''), String(newVal ?? ''));
      }
    }
    return updated;
  },

  bulkUpdateExpensesStatus: async (ids: string[], status: ExpenseEntry['status']): Promise<ExpenseEntry[]> => {
    const all: ExpenseEntry[] = getLS(STORAGE_KEYS.EXPENSES);
    const updatedAll = all.map((e: ExpenseEntry) => ids.includes(e.id) ? { ...e, status, updated_at: new Date().toISOString() } : e);
    setLS(STORAGE_KEYS.EXPENSES, updatedAll);
    await mockApi.logChange('expenses', 'bulk', 'UPDATE', 'status_change', null, `${ids.length} entries marked as ${status}`);
    return updatedAll;
  },

  // --- AUDIT / HISTORY LOGS ---
  logChange: async (table_name: string, record_id: string, action: AuditLog['action'], field_name: string, old_value: string | null, new_value: string | null): Promise<void> => {
    const all: AuditLog[] = getLS(STORAGE_KEYS.LOGS);
    const User = await mockApi.getProfile();
    const newLog: AuditLog = {
      id: crypto.randomUUID(), table_name, record_id, action, field_name, old_value, new_value,
      changed_by: User.id || 'system', changed_by_name: User.full_name || 'System',
      created_at: new Date().toISOString(),
    };
    setLS(STORAGE_KEYS.LOGS, [newLog, ...all]);
  },

  getAuditLogs: async (): Promise<UIHistoryItem[]> => {
    const all: AuditLog[] = getLS(STORAGE_KEYS.LOGS);
    const User = await mockApi.getProfile();
    let filtered = all;
    if (User.role === 'client' && User.account_id) {
       const records = await mockApi.getRecords();
       const recordIds = records.map((r: Request) => r.id);
       filtered = all.filter((l: AuditLog) => l.record_id === User.account_id || recordIds.includes(l.record_id));
    } 
    return filtered.map((l: AuditLog) => ({
      id: l.id, timestamp: l.created_at, action: l.action,
      details: l.field_name === 'details' ? (l.new_value || '') : `${l.action} — ${l.field_name}: ${l.old_value ?? '(empty)'} → ${l.new_value ?? '(empty)'}`,
      user_name: l.changed_by_name, record_id: l.record_id, table_name: l.table_name,
    }));
  },

  getHistoryByRecord: async (record_id: string): Promise<AuditLog[]> => {
    const all: AuditLog[] = getLS(STORAGE_KEYS.LOGS);
    return all.filter(l => l.record_id === record_id);
  },

  // --- UTILS ---
  seedData: async () => {
    const accs = getLS(STORAGE_KEYS.ACCOUNTS);
    if (accs.length > 0) return; 

    const now = new Date();
    const isoNow = now.toISOString();
    const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();

    // 1. Seed Accounts
    const acc1Id = 'seed-acc-1';
    const seededAccs: Account[] = [
      { 
        id: acc1Id, account_name: 'Nexus Alpha Ventures Pvt Ltd', pan_number: 'ABCPN1234Z', cin_number: 'U72900KA2021PTC145678', gstin_number: '29ABCPN1234Z1Z5', industry: 'Venture Capital', 
        created_at: daysAgo(30), created_by_name: 'System', updated_at: daysAgo(30), updated_by_name: 'System',
        house_no: 'Unit 402', street_1: 'RMZ Ecoworld', city: 'Bengaluru', state: 'Karnataka', country: 'India', pincode: '560103'
      }
    ];

    const names = ['Eterna Health', 'Solaris Biotech', 'Quantum FinTech', 'Horizon Real Estate', 'Zen Dynamics', 'Apex Retail', 'Orbit Logistics'];
    names.forEach((name, i) => {
      seededAccs.push({
        id: `seed-acc-${i+2}`, account_name: name, industry: i % 2 === 0 ? 'Technology' : 'Finance',
        pan_number: `ABCDE${i}234F`, created_at: daysAgo(20 + i), created_by_name: 'System', updated_at: isoNow, updated_by_name: 'System',
        city: 'Mumbai', state: 'Maharashtra', country: 'India', pincode: '400001'
      });
    });
    setLS(STORAGE_KEYS.ACCOUNTS, seededAccs);

    // 2. Seed Clients
    const seededClients: Client[] = [];
    seededAccs.forEach((acc, i) => {
      seededClients.push({
        id: `seed-cli-${i}`, account_id: acc.id, client_name: `${acc.account_name} Rep`,
        email_1: `contact@${acc.account_name.toLowerCase().replace(' ', '')}.com`, phone_1: '+91 9876543210',
        created_at: acc.created_at, created_by_name: 'System', updated_at: isoNow, updated_by_name: 'System',
        city: acc.city, state: acc.state, country: 'India', pincode: acc.pincode
      });
    });
    setLS(STORAGE_KEYS.CLIENTS, seededClients);

    // 3. Seed Mandates (Records)
    const seededRecords: Request[] = [];
    for (let i = 0; i < 15; i++) {
        const acc = seededAccs[i % seededAccs.length];
        seededRecords.push({
            id: `seed-mand-${i+1}`, account_id: acc.id, account_name: acc.account_name,
            request_number: `ADV-${800 + i + 1}`, title: `Service ${i + 1}`,
            primary_service: 'Corporate Secretarial', sub_service: 'General Compliance',
            status: i % 5 === 0 ? 'completed' : 'active', verification_status: i % 4 === 0 ? 'Pending' : 'Verified',
            priority: 'Standard', submitted_by: 'mock-user-123', submitted_by_name: 'System',
            assigned_to: 'Firm Professional', // Assign all to the mock staff for testing
            created_at: daysAgo(15 + i), created_by_name: 'System', updated_at: isoNow, updated_by_name: 'System'
        });
    }
    setLS(STORAGE_KEYS.RECORDS, seededRecords);

    // 4. Seed Timesheets
    const seededTimesheets: TimesheetEntry[] = [];
    for (let i = 1; i <= 50; i++) {
        const mand = seededRecords[i % seededRecords.length];
        let date;
        if (i <= 15) date = daysAgo(i % 6); // This week
        else if (i <= 30) date = daysAgo(8 + (i % 7)); // Last week
        else date = daysAgo(20 + i);

        seededTimesheets.push({
            id: `seed-time-${i}`, record_id: mand.id, account_id: mand.account_id, account_name: mand.account_name,
            hours: (Math.random() * 6 + 1).toFixed(1), date: date.split('T')[0],
            logged_by: 'Firm Professional', status: i % 10 === 0 ? 'submitted' : 'approved',
            created_at: date, updated_at: isoNow
        } as TimesheetEntry);
    }
    setLS(STORAGE_KEYS.TIMESHEETS, seededTimesheets);

    // 5. Seed Expenses
    const seededExpenses: ExpenseEntry[] = [];
    for (let i = 1; i <= 40; i++) {
        const mand = seededRecords[i % seededRecords.length];
        let date;
        if (i <= 15) date = daysAgo(i % 25); // This month
        else if (i <= 30) date = daysAgo(35 + (i % 25)); // Last month
        else date = daysAgo(70 + i);

        seededExpenses.push({
            id: `seed-exp-${i}`, record_id: mand.id, account_id: mand.account_id, account_name: mand.account_name,
            amount: Math.floor(1000 + Math.random() * 10000), date: date.split('T')[0],
            category: 'General', status: i < 8 ? 'paid' : (i % 4 === 0 ? 'approved' : 'submitted'),
            created_by_name: 'Firm Professional', // Assign to mock staff
            created_at: date, updated_at: isoNow
        } as ExpenseEntry);
    }
    setLS(STORAGE_KEYS.EXPENSES, seededExpenses);

    // 6. Seed Audit Logs
    await mockApi.logChange('Request', 'seed-mand-1', 'CREATE', 'mandate', null, 'ADV-801');
  },

  resetDatabase: () => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    window.location.reload();
  }
};

// Auto-seed on load
mockApi.seedData();
