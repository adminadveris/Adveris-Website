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
  PROFILE: 'adveris_user_profile'
};

// INITIAL MOCK PROFILE
const MOCK_PROFILE = {
  id: 'mock-user-123',
  role: 'admin',
  full_name: 'Adveris Admin (Local)',
  expertise_tags: ['VC & Private Equity', 'M&A', 'Corporate Advisory & Structuring']
};

export const mockApi = {
  // --- AUTH/PROFILE ---
  getProfile: async () => {
    const session = localStorage.getItem(STORAGE_KEYS.PROFILE.replace('profile', 'mock_session'));
    if (session) return JSON.parse(session);
    return MOCK_PROFILE;
  },

  // --- SERVICE RECORDS (STEP 2) ---
  getRecords: async () => {
    const data = localStorage.getItem(STORAGE_KEYS.RECORDS);
    return data ? JSON.parse(data) : [];
  },

  createRecord: async (record: any) => {
    const existing = await mockApi.getRecords();
    const newRecord = {
      ...record,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      status: 'pending',
      request_number: `ADV-${Math.floor(100 + Math.random() * 900)}`
    };
    
    const updated = [newRecord, ...existing];
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(updated));
    
    // Log step 4 history
    await mockApi.logAction('CREATE_RECORD', newRecord.id, `Created new record: ${newRecord.title}`);
    
    return newRecord;
  },

  // --- TIMESHEETS ---
  getTimesheets: async (recordId?: string) => {
    const data = localStorage.getItem(STORAGE_KEYS.TIMESHEETS);
    const all = data ? JSON.parse(data) : [];
    return recordId ? all.filter((t: any) => t.record_id === recordId) : all;
  },

  createTimesheet: async (entry: any) => {
    const existing = await mockApi.getTimesheets();
    const newEntry = { ...entry, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.TIMESHEETS, JSON.stringify([newEntry, ...existing]));
    
    await mockApi.logAction('LOG_TIME', entry.record_id, `Logged ${entry.hours} hours`);
    return newEntry;
  },

  // --- EXPENSES ---
  createExpense: async (entry: any) => {
    const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    const existing = data ? JSON.parse(data) : [];
    const newEntry = { ...entry, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([newEntry, ...existing]));
    
    await mockApi.logAction('LOG_EXPENSE', entry.record_id, `Submitted expense: ${entry.amount} INR`);
    return newEntry;
  },

  // --- AUDIT LOGS (STEP 4) ---
  logAction: async (action: string, recordId: string, details: string) => {
    const data = localStorage.getItem(STORAGE_KEYS.LOGS);
    const existing = data ? JSON.parse(data) : [];
    const newLog = {
      id: crypto.randomUUID(),
      action,
      record_id: recordId,
      details,
      timestamp: new Date().toISOString(),
      user_name: MOCK_PROFILE.full_name
    };
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([newLog, ...existing]));
  },

  getAuditLogs: async (recordId?: string) => {
    const data = localStorage.getItem(STORAGE_KEYS.LOGS);
    const all = data ? JSON.parse(data) : [];
    return recordId ? all.filter((l: any) => l.record_id === recordId) : all;
  },

  // --- UTILS ---
  resetDatabase: () => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    window.location.reload();
  }
};
