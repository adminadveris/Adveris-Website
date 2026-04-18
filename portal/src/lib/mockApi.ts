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
  getAccounts: async () => {
    const all = getLS(STORAGE_KEYS.ACCOUNTS);
    const profile = await mockApi.getProfile();
    if (profile.role === 'admin') return all;
    if (profile.role === 'employee') return all; // Professional staff can see all accounts
    if (profile.role === 'client' && profile.account_id) {
      return all.filter((a: any) => a.id === profile.account_id);
    }
    return [];
  },

  getAccountById: async (id: string) => {
    const all = await mockApi.getAccounts();
    return all.find((a: any) => a.id === id) || null;
  },

  findAccountByPAN: async (pan: string) => {
    const all = getLS(STORAGE_KEYS.ACCOUNTS);
    const profile = await mockApi.getProfile();
    const match = all.find((a: any) => a.pan_number && a.pan_number.toUpperCase() === pan.toUpperCase());
    if (!match) return null;
    
    // Safety: If client, can only find their own
    if (profile.role === 'client' && profile.account_id && match.id !== profile.account_id) return null;
    return match;
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
    const profile = await mockApi.getProfile();
    const newAcc = { 
      ...data, 
      id: crypto.randomUUID(), 
      created_at: new Date().toISOString(),
      created_by_name: profile.full_name,
      updated_at: new Date().toISOString(),
      updated_by_name: profile.full_name,
      cin_number: data.cin_number || '',
      gstin_number: data.gstin_number || '',
      // Expanded Address Grid
      house_no: data.house_no || '',
      street_1: data.street_1 || '',
      street_2: data.street_2 || '',
      street_3: data.street_3 || '',
      landmark: data.landmark || '',
      city: data.city || '',
      state: data.state || '',
      country: data.country || '',
      pincode: data.pincode || '',
    };
    setLS(STORAGE_KEYS.ACCOUNTS, [newAcc, ...existing]);
    await mockApi.logChange('accounts', newAcc.id, 'CREATE', 'account', null, newAcc.account_name);
    return newAcc;
  },

  updateAccount: async (id: string, data: any) => {
    const all = getLS(STORAGE_KEYS.ACCOUNTS);
    const profile = await mockApi.getProfile();
    const idx = all.findIndex((a: any) => a.id === id);
    if (idx === -1) throw new Error('Account not found');
    
    // Security check
    if (profile.role === 'client' && profile.account_id !== id) throw new Error('Access Denied');

    const old = all[idx];
    const updated = { 
      ...old, 
      ...data, 
      updated_at: new Date().toISOString(),
      updated_by_name: profile.full_name
    };
    all[idx] = updated;
    setLS(STORAGE_KEYS.ACCOUNTS, all);
    
    // Log each changed field individually
    for (const [field, newVal] of Object.entries(data)) {
      if (old[field] !== newVal) {
        await mockApi.logChange('accounts', id, 'UPDATE', field, String(old[field] ?? ''), String(newVal ?? ''));
      }
    }
    return updated;
  },

  // --- CLIENTS (CRM) ---
  getClients: async () => {
    const all = getLS(STORAGE_KEYS.CLIENTS);
    const profile = await mockApi.getProfile();
    if (profile.role === 'admin' || profile.role === 'employee') return all;
    if (profile.role === 'client' && profile.account_id) {
      return all.filter((c: any) => c.account_id === profile.account_id);
    }
    return [];
  },

  getClientsByAccount: async (accountId: string) => {
    const all = await mockApi.getClients();
    return all.filter((c: any) => c.account_id === accountId);
  },

  getClientById: async (id: string) => {
    const all = await mockApi.getClients();
    return all.find((c: any) => c.id === id) || null;
  },

  createClient: async (data: any) => {
    const existing = getLS(STORAGE_KEYS.CLIENTS);
    const profile = await mockApi.getProfile();
    const newClient = { 
      ...data, 
      id: crypto.randomUUID(), 
      created_at: new Date().toISOString(),
      created_by_name: profile.full_name,
      updated_at: new Date().toISOString(),
      updated_by_name: profile.full_name,
      // Expanded Address Grid
      house_no: data.house_no || '',
      street_1: data.street_1 || '',
      street_2: data.street_2 || '',
      street_3: data.street_3 || '',
      landmark: data.landmark || '',
      city: data.city || '',
      state: data.state || '',
      country: data.country || '',
      pincode: data.pincode || '',
    };
    setLS(STORAGE_KEYS.CLIENTS, [newClient, ...existing]);
    await mockApi.logChange('clients', newClient.id, 'CREATE', 'client', null, newClient.client_name);
    return newClient;
  },

  updateClient: async (id: string, data: any) => {
    const all = getLS(STORAGE_KEYS.CLIENTS);
    const profile = await mockApi.getProfile();
    const idx = all.findIndex((c: any) => c.id === id);
    if (idx === -1) throw new Error('Client not found');
    
    const old = all[idx];
    // Security check
    if (profile.role === 'client' && profile.account_id !== old.account_id) throw new Error('Access Denied');

    const updated = { 
      ...old, 
      ...data, 
      updated_at: new Date().toISOString(),
      updated_by_name: profile.full_name
    };
    all[idx] = updated;
    setLS(STORAGE_KEYS.CLIENTS, all);
    
    // Log each changed field individually
    for (const [field, newVal] of Object.entries(data)) {
      if (old[field] !== newVal) {
        await mockApi.logChange('clients', id, 'UPDATE', field, String(old[field] ?? ''), String(newVal ?? ''));
      }
    }
    return updated;
  },

  // --- SERVICE RECORDS ---
  getRecords: async () => {
    const all = getLS(STORAGE_KEYS.RECORDS);
    const profile = await mockApi.getProfile();
    
    if (profile.role === 'admin' || profile.role === 'employee') return all;
    
    if (profile.role === 'client' && profile.account_id) {
      return all.filter((r: any) => r.account_id === profile.account_id);
    }
    return [];
  },

  getRecordsByAccount: async (accountId: string) => {
    const all = await mockApi.getRecords();
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
      verification_status: 'Pending',
      verification_remarks: '',
      additional_services: '',
      
      // Admin overrides
      ...record,

      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      created_by_name: profile.full_name,
      updated_at: new Date().toISOString(),
      updated_by_name: profile.full_name,
      submitted_by: profile.id,
      submitted_by_name: profile.full_name,
    };
    setLS(STORAGE_KEYS.RECORDS, [newRecord, ...existing]);
    await mockApi.logChange('records', newRecord.id, 'CREATE', 'mandate', null, newRecord.request_number);
    return newRecord;
  },

  updateRecord: async (id: string, data: any) => {
    const all = getLS(STORAGE_KEYS.RECORDS);
    const profile = await mockApi.getProfile();
    const idx = all.findIndex((r: any) => r.id === id);
    if (idx === -1) throw new Error('Record not found');
    const old = all[idx];
    
    // Security check
    if (profile.role === 'client' && profile.account_id !== old.account_id) throw new Error('Access Denied');
    // Staff can now update any record they can see (global)

    const updated = { 
      ...old, 
      ...data, 
      updated_at: new Date().toISOString(),
      updated_by_name: profile.full_name
    };
    all[idx] = updated;
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
    const profile = await mockApi.getProfile();

    let filtered = all;
    if (profile.role === 'client' && profile.account_id) {
      filtered = all.filter((t: any) => t.account_id === profile.account_id);
    }
    // Admin and Staff see all timesheets

    return recordId ? filtered.filter((t: any) => t.record_id === recordId) : filtered;
  },

  createTimesheet: async (entry: any) => {
    const existing = getLS(STORAGE_KEYS.TIMESHEETS);
    const profile = await mockApi.getProfile();
    const newEntry = { 
      ...entry, 
      id: crypto.randomUUID(), 
      created_at: new Date().toISOString(), 
      created_by_name: profile.full_name,
      updated_at: new Date().toISOString(),
      updated_by_name: profile.full_name,
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
    const profile = await mockApi.getProfile();
    const idx = all.findIndex((t: any) => t.id === id);
    if (idx === -1) throw new Error('Time log not found');
    const old = all[idx];
    
    // Security check
    if (profile.role === 'employee' && old.logged_by !== profile.full_name) throw new Error('Access Denied');
    if (profile.role === 'client') throw new Error('Action not permitted');

    const updated = { 
      ...old, 
      ...data, 
      updated_at: new Date().toISOString(),
      updated_by_name: profile.full_name 
    };
    all[idx] = updated;
    setLS(STORAGE_KEYS.TIMESHEETS, all);
    
    // Log each changed field individually
    for (const [field, newVal] of Object.entries(data)) {
      if (field !== 'updated_at' && old[field] !== newVal) {
        await mockApi.logChange('timesheets', updated.record_id || id, 'UPDATE', field, String(old[field] ?? ''), String(newVal ?? ''));
      }
    }
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
    const profile = await mockApi.getProfile();

    let filtered = all;
    if (profile.role === 'client' && profile.account_id) {
      filtered = all.filter((e: any) => e.account_id === profile.account_id);
    }
    // Admin and Staff see all expenses

    return recordId ? filtered.filter((e: any) => e.record_id === recordId) : filtered;
  },

  createExpense: async (entry: any) => {
    const all = getLS(STORAGE_KEYS.EXPENSES);
    const profile = await mockApi.getProfile();
    const newEntry = { 
      ...entry, 
      id: crypto.randomUUID(), 
      created_at: new Date().toISOString(),
      created_by_name: profile.full_name,
      updated_at: new Date().toISOString(),
      updated_by_name: profile.full_name,
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
    const profile = await mockApi.getProfile();
    const idx = all.findIndex((e: any) => e.id === id);
    if (idx === -1) throw new Error('Expense record not found');
    const old = all[idx];
    
    // Security
    if (profile.role === 'employee' && old.created_by_name !== profile.full_name) throw new Error('Access Denied');
    if (profile.role === 'client') throw new Error('Action not permitted');

    const updated = { 
      ...old, 
      ...data, 
      updated_at: new Date().toISOString(),
      updated_by_name: profile.full_name 
    };
    all[idx] = updated;
    setLS(STORAGE_KEYS.EXPENSES, all);
    
    // Log each changed field individually
    for (const [field, newVal] of Object.entries(data)) {
      if (field !== 'updated_at' && old[field] !== newVal) {
        await mockApi.logChange('expenses', updated.account_id || id, 'UPDATE', field, String(old[field] ?? ''), String(newVal ?? ''));
      }
    }
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
    const profile = await mockApi.getProfile();

    let filtered = all;
    if (profile.role === 'client' && profile.account_id) {
       // Only show logs for their account/records
       const records = await mockApi.getRecords();
       const recordIds = records.map((r: any) => r.id);
       filtered = all.filter((l: any) => 
          l.record_id === profile.account_id || 
          recordIds.includes(l.record_id)
       );
    } 
    // Admin and Staff see all logs

    return filtered.map((l: any) => ({
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

    const now = new Date().toISOString();
    const ago10 = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const ago5 = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Seed 10 Accounts
    const acc1Id = 'seed-acc-1';
    const acc2Id = 'seed-acc-2';
    const acc3Id = 'seed-acc-3';
    const seededAccs = [
      { 
        id: acc1Id, account_name: 'Nexus Alpha Ventures Pvt Ltd', pan_number: 'ABCPN1234Z', cin_number: 'U72900KA2021PTC145678', gstin_number: '29ABCPN1234Z1Z5', industry: 'Venture Capital', 
        created_at: ago10, created_by_name: 'System', updated_at: ago10, updated_by_name: 'System',
        house_no: 'Unit 402', street_1: 'RMZ Ecoworld', street_2: 'Outer Ring Road', street_3: 'Bellandur', landmark: 'Near Intel Campus', city: 'Bengaluru', state: 'Karnataka', country: 'India', pincode: '560103'
      },
      { 
        id: acc2Id, account_name: 'Eterna Health Systems', pan_number: 'DETPH5678Q', cin_number: 'L85110MH2018PLC312456', gstin_number: '27DETPH5678Q1Z2', industry: 'Healthcare Tech', 
        created_at: ago10, created_by_name: 'System', updated_at: ago10, updated_by_name: 'System',
        house_no: '88-B', street_1: 'Techno Park', street_2: 'MIDC', street_3: 'Andheri East', landmark: 'Opposite Gateway Hotel', city: 'Mumbai', state: 'Maharashtra', country: 'India', pincode: '400093'
      },
      { 
        id: acc3Id, account_name: 'Solaris Biotech Solutions', pan_number: 'GHKLM9012R', cin_number: 'U24230TG2020PTC123456', gstin_number: '36GHKLM9012R1Z1', industry: 'Manufacturing', 
        created_at: ago5, created_by_name: 'System', updated_at: ago5, updated_by_name: 'System',
        house_no: 'Building 12', street_1: 'Genome Valley', street_2: 'Turkapally', street_3: 'Shamirpet', landmark: 'Biotech Hub', city: 'Hyderabad', state: 'Telangana', country: 'India', pincode: '500078'
      }
    ];

    // Generate 7 more accounts
    const extraAccounts = [
      ['Quantum FinTech', 'Venture Capital', 'QNFT4567P', 'Mumbai'],
      ['Horizon Real Estate', 'Real Estate', 'HREI1234L', 'Delhi'],
      ['Zen Dynamics', 'Manufacturing', 'ZDYM8899K', 'Pune'],
      ['Apex Retail Corp', 'Financial Services', 'APXR0011M', 'Chennai'],
      ['Orbit Logistics', 'Healthcare Tech', 'ORBL5544J', 'Kochi'],
      ['Catalyst Media', 'Venture Capital', 'CTMD2233H', 'Gurgaon'],
      ['Titan Energy', 'Manufacturing', 'TTNE9911G', 'Ahmedabad']
    ];

    extraAccounts.forEach(([name, ind, panVal, city], i) => {
      const id = `seed-acc-${i + 4}`;
      seededAccs.push({
        id, account_name: name, pan_number: panVal, industry: ind, city,
        cin_number: `U${Math.floor(10000+Math.random()*90000)}ST${2010+i}PTC${Math.floor(100000+Math.random()*900000)}`,
        gstin_number: `${Math.floor(10+Math.random()*90)}${panVal}1Z${i}`,
        created_at: ago5, created_by_name: 'System', updated_at: ago5, updated_by_name: 'System',
        house_no: `${10+i}`, street_1: 'Business Park', landmark: 'Commercial Hub', state: 'State', country: 'India', pincode: '123456',
        street_2: '', street_3: ''
      });
    });
    setLS(STORAGE_KEYS.ACCOUNTS, seededAccs);

    // 2. Seed 30 Clients (3 per account)
    const seededClients: any[] = [];
    const clientRoles = ['Director', 'CFO', 'Operations Lead'];
    const clientNames = [
      ['Vikram Malhotra', 'Priya Sharma', 'Arjun Das'],
      ['Dr. Sarah Dsouza', 'Amit Verma', 'Neha Kapur'],
      ['Rajiv Gupta', 'Shreya Iyer', 'Anish Mehta'],
      ['Kabir Khan', 'Sonia Malhotra', 'Rohan Sethi'],
      ['Zara Ahmad', 'Leo Joseph', 'Tara Singh'],
      ['Devika Ray', 'Sanjay Goel', 'Meera Nair'],
      ['Aditya Rao', 'Ishaan Joshi', 'Aavya Gupta'],
      ['Vihaan Singh', 'Zoya Parikh', 'Reyansh Jain'],
      ['Ananya Hegde', 'Kiaan Reddy', 'Myra Kulkarni'],
      ['Advait Bhatt', 'Saanvi Mishra', 'Ishani Pal']
    ];

    seededAccs.forEach((acc, accIdx) => {
      clientRoles.forEach((role, roleIdx) => {
        const name = clientNames[accIdx][roleIdx];
        seededClients.push({
          id: `seed-client-${accIdx + 1}-${roleIdx + 1}`,
          account_id: acc.id,
          client_name: name,
          designation: role,
          email_1: `${name.toLowerCase().replace(' ', '.')}@${acc.account_name.toLowerCase().split(' ')[0]}.com`,
          phone_1: `+91 ${90000 + accIdx * 1000 + roleIdx * 100}`,
          created_at: acc.created_at, created_by_name: 'System', updated_at: acc.created_at, updated_by_name: 'System',
          house_no: acc.house_no, street_1: acc.street_1, city: acc.city, state: acc.state, country: 'India', pincode: acc.pincode,
          street_2: '', street_3: '', landmark: ''
        });
      });
    });
    setLS(STORAGE_KEYS.CLIENTS, seededClients);

    // 3. Seed 20 Mandates (Records)
    const seededRecords: any[] = [];
    const mainAccs = [acc1Id, acc2Id, acc3Id];
    const staffNames = ['Firm Professional', 'Other Staff'];
    const recordTypes = [
      { title: 'Series B Financing', service: 'Transaction Advisory', sub: 'Capital Raise' },
      { title: 'Compliance Audit', service: 'Corporate Secretarial', sub: 'Compliance Audit' },
      { title: 'GST Reconciliation', service: 'Indirect Tax', sub: 'GST Audit' },
      { title: 'Trademark Filing', service: 'Intellectual Property', sub: 'IP Registration' },
      { title: 'Drafting Review', service: 'Corporate Secretarial', sub: 'Drafting & Review' }
    ];

    for (let i = 1; i <= 20; i++) {
        const accId = mainAccs[(i - 1) % 3];
        const acc = seededAccs.find(a => a.id === accId);
        const type = recordTypes[(i - 1) % 5];
        seededRecords.push({
            id: `seed-mand-${i}`,
            account_id: accId,
            account_name: acc?.account_name || 'Individual',
            title: `${type.title} - Ph ${Math.ceil(i/3)}`,
            primary_service: type.service,
            sub_service: type.sub,
            request_number: `ADV-${800 + i}`,
            status: i % 5 === 0 ? 'completed' : i % 7 === 0 ? 'pending' : 'active',
            assigned_to: staffNames[i % 2],
            created_at: i < 10 ? ago10 : ago5,
            updated_at: now,
            description: `Standardized V5.2 professional mandate for ${acc?.account_name}.`
        });
    }
    setLS(STORAGE_KEYS.RECORDS, seededRecords);

    // 4. Seed 30 Timesheets
    const seededTimesheets: any[] = [];
    for (let i = 1; i <= 30; i++) {
        const mand = seededRecords[(i - 1) % 20];
        const logger = i % 10 === 0 ? 'Adveris Admin' : mand.assigned_to;
        seededTimesheets.push({
            id: `t-${i}`,
            record_id: mand.id,
            account_id: mand.account_id,
            account_name: mand.account_name,
            hours: (Math.random() * 8 + 1).toFixed(1),
            date: i < 15 ? '2024-04-10' : '2024-04-16',
            logged_by: logger,
            created_at: ago5,
            updated_at: now
        });
    }
    setLS(STORAGE_KEYS.TIMESHEETS, seededTimesheets);

    // 5. Seed 30 Expenses
    const seededExpenses: any[] = [];
    const expCats = ['Travel', 'Stamp Duty', 'Audit Fees', 'Courier', 'Printing'];
    const expStats = ['submitted', 'approved', 'paid'];
    for (let i = 1; i <= 30; i++) {
        const mand = seededRecords[(i - 1) % 20];
        seededExpenses.push({
            id: `e-${i}`,
            record_id: mand.id,
            account_id: mand.account_id,
            account_name: mand.account_name,
            amount: Math.floor(500 + Math.random() * 20000),
            date: i < 15 ? '2024-04-05' : '2024-04-15',
            category: expCats[i % 5],
            status: expStats[i % 3],
            created_by_name: mand.assigned_to,
            created_at: ago5,
            url: i % 4 === 0 ? '' : `https://example.com/receipt-${i}`
        });
    }
    setLS(STORAGE_KEYS.EXPENSES, seededExpenses);

    // 6. Seed Audit Logs
    await mockApi.logChange('records', 'seed-mand-1', 'CREATE', 'mandate', null, 'ADV-801');
    await mockApi.logChange('records', 'seed-mand-7', 'CREATE', 'mandate', null, 'ADV-807');
    await mockApi.logChange('timesheets', 'seed-mand-1', 'UPDATE', 'hours_logged', null, '8.5h by Firm Professional');
  },

  resetDatabase: () => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    window.location.reload();
  }
};

// Auto-seed on load
mockApi.seedData();

