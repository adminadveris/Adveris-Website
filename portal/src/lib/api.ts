import { supabase } from './supabase';
import type { 
  User, Account, Client, Request, 
  TimesheetEntry, ExpenseEntry, AuditLog, UIHistoryItem 
} from '../types';

export const api = {
  // --- AUTH/currentUser ---
  getProfile: async (): Promise<User | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('User')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) return null;
    return data as User;
  },

  // --- ACCOUNTS (CRM) ---
  getAccounts: async (): Promise<Account[]> => {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('account_name', { ascending: true });
    
    if (error) throw error;
    return data as Account[];
  },

  getAccountById: async (id: string): Promise<Account | null> => {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data as Account;
  },

  findAccountByPAN: async (pan: string): Promise<Account | null> => {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .ilike('pan_number', pan)
      .maybeSingle();
    
    if (error) return null;
    return data as Account;
  },

  createAccount: async (account: Partial<Account>): Promise<Account> => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: currentUser } = await supabase.from('User').select('full_name').eq('id', user?.id).single();

    const { data, error } = await supabase
      .from('accounts')
      .insert({
        ...account,
        created_by_name: currentUser?.full_name || 'System',
        updated_by_name: currentUser?.full_name || 'System'
      })
      .select()
      .single();
    
    if (error) throw error;
    await api.createAuditLog({
      table_name: 'accounts',
      record_id: data.id,
      action: 'CREATE_ACCOUNT',
      field_name: 'details',
      new_value: `Created account: ${data.account_name}`
    });
    return data as Account;
  },

  updateAccount: async (id: string, account: Partial<Account>): Promise<Account> => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: currentUser } = await supabase.from('User').select('full_name').eq('id', user?.id).single();

    const { data, error } = await supabase
      .from('accounts')
      .update({
        ...account,
        updated_at: new Date().toISOString(),
        updated_by_name: currentUser?.full_name || 'System'
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    await api.createAuditLog({
      table_name: 'accounts',
      record_id: id,
      action: 'UPDATE_ACCOUNT',
      field_name: 'details',
      new_value: `Updated account details: ${data.account_name}`
    });
    return data as Account;
  },

  // --- CLIENTS (CRM) ---
  getClients: async (): Promise<Client[]> => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('client_name', { ascending: true });
    
    if (error) throw error;
    return data as Client[];
  },

  getClientsByAccount: async (accountId: string): Promise<Client[]> => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('account_id', accountId)
      .order('client_name', { ascending: true });
    
    if (error) throw error;
    return data as Client[];
  },

  getClientById: async (id: string): Promise<Client | null> => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data as Client;
  },

  createClient: async (client: Partial<Client>): Promise<Client> => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: currentUser } = await supabase.from('User').select('full_name').eq('id', user?.id).single();

    const { data, error } = await supabase
      .from('clients')
      .insert({
        ...client,
        created_by_name: currentUser?.full_name || 'System',
        updated_by_name: currentUser?.full_name || 'System'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as Client;
  },

  updateClient: async (id: string, client: Partial<Client>): Promise<Client> => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: currentUser } = await supabase.from('User').select('full_name').eq('id', user?.id).single();

    const { data, error } = await supabase
      .from('clients')
      .update({
        ...client,
        updated_at: new Date().toISOString(),
        updated_by_name: currentUser?.full_name || 'System'
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Client;
  },

  // --- SERVICE RECORDS (MANDATES) ---
  getRecords: async (): Promise<Request[]> => {
    const { data, error } = await supabase
      .from('Request')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Request[];
  },

  getNextSequenceNumber: async (table: string, prefix: string): Promise<string> => {
    const colName = table === 'Request' ? 'request_number' : 
                    table === 'expenses' ? 'expense_number' : 
                    table === 'timesheets' ? 'timesheet_number' : null;
    
    if (!colName) return `${prefix}-0001`;

    const { data, error } = await supabase
      .from(table)
      .select(colName)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error(`Error getting sequence for ${table}:`, error);
      return `${prefix}-0001`;
    }
    
    const lastNum = data?.[0]?.[colName];
    if (!lastNum) return `${prefix}-0001`;
    
    const parts = lastNum.split('-');
    const currentSeq = parseInt(parts[parts.length - 1]);
    if (isNaN(currentSeq)) return `${prefix}-0001`;
    return `${prefix}-${(currentSeq + 1).toString().padStart(4, '0')}`;
  },

  createRecord: async (record: Partial<Request>): Promise<Request> => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: currentUser } = await supabase.from('User').select('full_name').eq('id', user?.id).single();

    const request_number = await api.getNextSequenceNumber('Request', 'ADV');

    const { data, error } = await supabase
      .from('Request')
      .insert({
        ...record,
        request_number,
        submitted_by: user?.id,
        submitted_by_name: currentUser?.full_name || 'System',
        created_by_name: currentUser?.full_name || 'System',
        updated_by_name: currentUser?.full_name || 'System'
      })
      .select()
      .single();
    
    if (error) throw error;

    // 1. Log Audit
    await api.createAuditLog({
      table_name: 'Request',
      record_id: data.id,
      action: 'CREATE_RECORD',
      field_name: 'request_number',
      new_value: request_number,
    });

    // 2. Notify Admins
    try {
      const { data: admins } = await supabase.from('User').select('id').eq('role', 'admin');
      if (admins) {
        for (const admin of admins) {
          await api.createNotification({
            user_id: admin.id,
            title: 'New Request Submitted',
            message: `${request_number}: ${data.title}`,
            type: 'request',
            related_id: data.id,
            sender_name: currentUser?.full_name || 'System'
          });
        }
      }
    } catch (notifErr) {
      console.warn("Notification failed to send, but record was created.", notifErr);
    }

    return data as Request;
  },

  updateRecord: async (id: string, record: Partial<Request>): Promise<Request> => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: currentUser } = await supabase.from('User').select('full_name').eq('id', user?.id).single();

    // Get old values for audit
    const { data: oldRecord } = await supabase.from('Request').select('*').eq('id', id).single();

    const { data, error } = await supabase
      .from('Request')
      .update({
        ...record,
        updated_at: new Date().toISOString(),
        updated_by_name: currentUser?.full_name || 'System'
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;

    // Log individual field changes if needed, but for now simple update log
    if (oldRecord?.status !== data.status) {
      await api.createAuditLog({
        table_name: 'Request',
        record_id: id,
        action: 'UPDATE_RECORD',
        field_name: 'status',
        old_value: oldRecord?.status,
        new_value: data.status,
      });
    }
    return data as Request;
  },

  // --- TIMESHEETS ---
  getTimesheets: async (recordId?: string): Promise<TimesheetEntry[]> => {
    let query = supabase.from('timesheets').select('*').order('date', { ascending: false });
    if (recordId) query = query.eq('record_id', recordId);
    
    const { data, error } = await query;
    if (error) throw error;
    return data as TimesheetEntry[];
  },

  createTimesheet: async (entry: Partial<TimesheetEntry>): Promise<TimesheetEntry> => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: currentUser } = await supabase.from('User').select('full_name').eq('id', user?.id).single();

    const timesheet_number = await api.getNextSequenceNumber('timesheets', 'TIME');

    const { data, error } = await supabase
      .from('timesheets')
      .insert({
        ...entry,
        timesheet_number,
        logged_by: currentUser?.full_name || 'System',
        created_by_name: currentUser?.full_name || 'System',
        updated_by_name: currentUser?.full_name || 'System'
      })
      .select()
      .single();
    
    if (error) throw error;
    await api.createAuditLog({
      table_name: 'timesheets',
      record_id: data.id,
      action: 'LOG_TIME',
      field_name: 'timesheet_number',
      new_value: timesheet_number,
    });
    return data as TimesheetEntry;
  },

  updateTimesheet: async (id: string, entry: Partial<TimesheetEntry>): Promise<TimesheetEntry> => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: currentUser } = await supabase.from('User').select('full_name').eq('id', user?.id).single();

    const { data: oldEntry } = await supabase.from('timesheets').select('*').eq('id', id).single();

    const { data, error } = await supabase
      .from('timesheets')
      .update({
        ...entry,
        updated_at: new Date().toISOString(),
        updated_by_name: currentUser?.full_name || 'System'
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    if (oldEntry?.status !== data.status) {
      await api.createAuditLog({
        table_name: 'timesheets',
        record_id: id,
        action: 'UPDATE_TIMESHEETS_STATUS',
        field_name: 'status',
        old_value: oldEntry?.status,
        new_value: data.status,
      });
    }
    return data as TimesheetEntry;
  },

  bulkUpdateTimesheetsStatus: async (ids: string[], status: TimesheetEntry['status']): Promise<TimesheetEntry[]> => {
    // Get old values
    const { data: oldEntries } = await supabase.from('timesheets').select('id, status').in('id', ids);

    const { data, error } = await supabase
      .from('timesheets')
      .update({ status, updated_at: new Date().toISOString() })
      .in('id', ids)
      .select();
    
    if (error) throw error;
    const action = status === 'approved' ? 'APPROVE_TIMESHEETS' : status === 'rejected' ? 'REJECT_TIMESHEETS' : 'UPDATE_TIMESHEETS_STATUS';
    
    for (const id of ids) {
      const oldVal = oldEntries?.find(o => o.id === id)?.status;
      if (oldVal === status) continue; // Skip redundant logs
      
      await api.createAuditLog({
        table_name: 'timesheets',
        record_id: id,
        action,
        field_name: 'status',
        old_value: oldVal,
        new_value: status,
      });
    }
    return data as TimesheetEntry[];
  },

  // --- EXPENSES ---
  getExpenses: async (recordId?: string): Promise<ExpenseEntry[]> => {
    let query = supabase.from('expenses').select('*').order('date', { ascending: false });
    if (recordId) query = query.eq('record_id', recordId);
    
    const { data, error } = await query;
    if (error) throw error;
    return data as ExpenseEntry[];
  },

  createExpense: async (entry: Partial<ExpenseEntry>): Promise<ExpenseEntry> => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: currentUser } = await supabase.from('User').select('full_name').eq('id', user?.id).single();

    const expense_number = await api.getNextSequenceNumber('expenses', 'EXP');

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        ...entry,
        expense_number,
        created_by_name: currentUser?.full_name || 'System',
        updated_by_name: currentUser?.full_name || 'System'
      })
      .select()
      .single();
    
    if (error) throw error;
    await api.createAuditLog({
      table_name: 'expenses',
      record_id: data.id,
      action: 'LOG_EXPENSE',
      field_name: 'expense_number',
      new_value: expense_number,
    });
    return data as ExpenseEntry;
  },

  updateExpense: async (id: string, entry: Partial<ExpenseEntry>): Promise<ExpenseEntry> => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: currentUser } = await supabase.from('User').select('full_name').eq('id', user?.id).single();

    const { data: oldEntry } = await supabase.from('expenses').select('*').eq('id', id).single();

    const { data, error } = await supabase
      .from('expenses')
      .update({
        ...entry,
        updated_at: new Date().toISOString(),
        updated_by_name: currentUser?.full_name || 'System'
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    if (oldEntry?.status !== data.status) {
      await api.createAuditLog({
        table_name: 'expenses',
        record_id: id,
        action: 'UPDATE_EXPENSES_STATUS',
        field_name: 'status',
        old_value: oldEntry?.status,
        new_value: data.status,
      });
    }
    return data as ExpenseEntry;
  },

  bulkUpdateExpensesStatus: async (ids: string[], status: ExpenseEntry['status']): Promise<ExpenseEntry[]> => {
    // Get old values
    const { data: oldEntries } = await supabase.from('expenses').select('id, status').in('id', ids);

    const { data, error } = await supabase
      .from('expenses')
      .update({ status, updated_at: new Date().toISOString() })
      .in('id', ids)
      .select();
    
    if (error) throw error;
    const action = status === 'approved' ? 'APPROVE_EXPENSES' : status === 'rejected' ? 'REJECT_EXPENSES' : 'UPDATE_EXPENSES_STATUS';
    
    for (const id of ids) {
      const oldVal = oldEntries?.find(o => o.id === id)?.status;
      if (oldVal === status) continue; // Skip redundant logs

      await api.createAuditLog({
        table_name: 'expenses',
        record_id: id,
        action,
        field_name: 'status',
        old_value: oldVal,
        new_value: status,
      });
    }
    return data as ExpenseEntry[];
  },

  // --- AUDIT / HISTORY LOGS ---
  createAuditLog: async (log: Partial<AuditLog>): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Clean up the log object to match DB schema
    const { details, ...cleanLog } = log as any;
    
    const finalLog = {
      ...cleanLog,
      field_name: cleanLog.field_name || 'details',
      new_value: cleanLog.new_value || details || 'Action performed',
      changed_by: user?.id,
      changed_by_name: user?.user_metadata?.full_name || 'System'
    };

    await supabase.from('audit_logs').insert(finalLog);
  },

  getAuditLogs: async (): Promise<UIHistoryItem[]> => {
    const [logs, records, expenses, timesheets] = await Promise.all([
      supabase.from('audit_logs').select('*').order('created_at', { ascending: false }),
      supabase.from('Request').select('id, request_number'),
      supabase.from('expenses').select('id, expense_number'),
      supabase.from('timesheets').select('id, timesheet_number')
    ]);
    
    if (logs.error) throw logs.error;

    // Create a map for quick lookup
    const refMap: Record<string, string> = {};
    records.data?.forEach(r => refMap[r.id] = r.request_number);
    expenses.data?.forEach(e => refMap[e.id] = e.expense_number);
    timesheets.data?.forEach(t => refMap[t.id] = t.timesheet_number);
    
    return logs.data.map((l: AuditLog) => ({
      id: l.id, 
      timestamp: l.created_at, 
      action: l.action,
      details: l.details || (l.field_name === 'details' ? (l.new_value || '') : `${l.action} — ${l.field_name}: ${l.old_value ?? '(empty)'} → ${l.new_value ?? '(empty)'}`),
      user_name: l.changed_by_name, 
      record_id: l.record_id, 
      record_ref: refMap[l.record_id] || l.record_id?.substring(0, 8) || 'N/A',
      table_name: l.table_name,
    }));
  },

  getHistoryByRecord: async (record_id: string): Promise<AuditLog[]> => {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('record_id', record_id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as AuditLog[];
  },

  // === USER MANAGEMENT ===
  getAllProfiles: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('User')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as User[];
  },

  getStaffProfiles: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('User')
      .select('*')
      .in('role', ['admin', 'employee'])
      .eq('status', 'approved')
      .order('full_name', { ascending: true });
    if (error) throw error;
    return data as User[];
  },

  updateProfile: async (id: string, updates: Partial<User>): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Security: Only admins can update role or status
    if (updates.role || updates.status) {
      const { data: adminCheck } = await supabase
        .from('User')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (adminCheck?.role !== 'admin') {
        throw new Error("Governance restriction: Only administrators can modify roles or access status.");
      }
    }

    const { error } = await supabase
      .from('User')
      .update(updates)
      .eq('id', id);
    if (error) throw error;

    await api.createAuditLog({
      table_name: 'User',
      record_id: id,
      action: 'UPDATE_PROFILE',
      field_name: 'details',
      new_value: `Updated governance profile for: ${id}. ${updates.role ? `Role -> ${updates.role}` : ''} ${updates.status ? `Status -> ${updates.status}` : ''}`
    });
  },

  // === NOTIFICATIONS ===
  getNotifications: async (userId: string): Promise<Notification[]> => {
    const { data, error } = await supabase
      .from('Notification')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Notification[];
  },

  markNotificationAsRead: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('Notification')
      .update({ is_read: true })
      .eq('id', id);
    if (error) throw error;
  },

  createNotification: async (notif: Partial<Notification>): Promise<void> => {
    // 1. Get existing to prune
    const { data: existing } = await supabase
      .from('Notification')
      .select('id')
      .eq('user_id', notif.user_id)
      .order('created_at', { ascending: false });

    // Prune if >= 20 (so after adding 1 it stays at 20)
    if (existing && existing.length >= 20) {
      const idsToDelete = existing.slice(19).map(n => n.id);
      await supabase.from('Notification').delete().in('id', idsToDelete);
    }

    const { error } = await supabase
      .from('Notification')
      .insert({
        ...notif,
        is_read: false,
        created_at: new Date().toISOString()
      });
    if (error) throw error;
  }
};
