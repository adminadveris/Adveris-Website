import { supabase } from './supabase';
import type { 
  User, Account, Client, Request, 
  TimesheetEntry, ExpenseEntry, AuditLog, UIHistoryItem,
  RequestMessage, Invoice, PaymentMethod, InvoiceSender
} from '../types';

// Utility to strip joined relational objects and metadata before writing to Supabase
const sanitize = (obj: any) => {
  const { 
    id, created_at, created_by, updated_by, 
    assigned_user, changed_by_user, sender,
    ...clean 
  } = obj;
  return clean;
};

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
      .select('*, created_by:User!created_by_id(full_name), updated_by:User!updated_by_id(full_name)')
      .order('account_name', { ascending: true });
    
    if (error) throw error;
    return data as Account[];
  },

  getAccountById: async (id: string): Promise<Account | null> => {
    const { data, error } = await supabase
      .from('accounts')
      .select('*, created_by:User!created_by_id(full_name), updated_by:User!updated_by_id(full_name)')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data as Account;
  },

  findAccountByPAN: async (pan: string): Promise<Account | null> => {
    // First try exact ilike match
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .ilike('pan_number', pan)
      .maybeSingle();
    
    if (error) {
      console.error('findAccountByPAN: Query error (possible RLS restriction):', error.message);
      // Fallback: Try using the user's own account_id to check if their account matches
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userRecord } = await supabase.from('User').select('account_id').eq('id', user.id).single();
          if (userRecord?.account_id) {
            const { data: ownAccount } = await supabase
              .from('accounts')
              .select('*')
              .eq('id', userRecord.account_id)
              .single();
            if (ownAccount && ownAccount.pan_number?.toUpperCase() === pan.toUpperCase()) {
              return ownAccount as Account;
            }
          }
        }
      } catch (fallbackErr) {
        console.error('findAccountByPAN: Fallback also failed:', fallbackErr);
      }
      return null;
    }
    return data as Account;
  },

  createAccount: async (account: Partial<Account>): Promise<Account> => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: currentUser } = await supabase.from('User').select('full_name').eq('id', user?.id).single();

    const { data, error } = await supabase
      .from('accounts')
      .insert({
        ...sanitize(account),
        created_by_id: user?.id,
        updated_by_id: user?.id,
        created_by_name: currentUser?.full_name || 'System',
        updated_by_name: currentUser?.full_name || 'System'
      })
      .select('*, created_by:User!created_by_id(full_name), updated_by:User!updated_by_id(full_name)')
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

    // 1. Fetch current state for diffing
    const { data: oldAccount } = await supabase.from('accounts').select('*').eq('id', id).single();

    // 2. Perform Update
    const { data: newAccount, error } = await supabase
      .from('accounts')
      .update({
        ...sanitize(account),
        updated_at: new Date().toISOString(),
        updated_by_id: user?.id,
        updated_by_name: currentUser?.full_name || 'System'
      })
      .eq('id', id)
      .select('*, created_by:User!created_by_id(full_name), updated_by:User!updated_by_id(full_name)')
      .single();
    
    if (error) throw error;

    // 3. Granular Auditing
    if (oldAccount && newAccount) {
      const fieldsToWatch = Object.keys(account) as (keyof Account)[];
      for (const field of fieldsToWatch) {
        const oldVal = String(oldAccount[field] || '');
        const newVal = String(newAccount[field] || '');
        
        if (oldVal !== newVal && field !== 'updated_at' && field !== 'updated_by_name') {
          // Humanize field name (e.g., account_name -> Account Name)
          const humanField = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          
          await api.createAuditLog({
            table_name: 'accounts',
            record_id: id,
            action: 'UPDATE_ACCOUNT',
            field_name: humanField,
            old_value: oldVal || 'None',
            new_value: newVal || 'None'
          });
        }
      }
    }

    return newAccount as Account;
  },

  // --- CLIENTS (CRM) ---
  getClients: async (): Promise<Client[]> => {
    const { data, error } = await supabase
      .from('clients')
      .select('*, created_by:User!created_by_id(full_name), updated_by:User!updated_by_id(full_name)')
      .order('client_name', { ascending: true });
    
    if (error) throw error;
    return data as Client[];
  },

  getClientsByAccount: async (accountId: string): Promise<Client[]> => {
    const { data, error } = await supabase
      .from('clients')
      .select('*, created_by:User!created_by_id(full_name), updated_by:User!updated_by_id(full_name)')
      .eq('account_id', accountId)
      .order('client_name', { ascending: true });
    
    if (error) throw error;
    return data as Client[];
  },

  getClientById: async (id: string): Promise<Client | null> => {
    const { data, error } = await supabase
      .from('clients')
      .select('*, created_by:User!created_by_id(full_name), updated_by:User!updated_by_id(full_name)')
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
        ...sanitize(client),
        created_by_id: user?.id,
        updated_by_id: user?.id,
        created_by_name: currentUser?.full_name || 'System',
        updated_by_name: currentUser?.full_name || 'System'
      })
      .select('*, created_by:User!created_by_id(full_name), updated_by:User!updated_by_id(full_name)')
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
        ...sanitize(client),
        updated_at: new Date().toISOString(),
        updated_by_id: user?.id,
        updated_by_name: currentUser?.full_name || 'System'
      })
      .eq('id', id)
      .select('*, created_by:User!created_by_id(full_name), updated_by:User!updated_by_id(full_name)')
      .single();
    
    if (error) throw error;
    return data as Client;
  },

  // --- SERVICE RECORDS (MANDATES) ---
  getRecords: async (): Promise<Request[]> => {
    const { data, error } = await supabase
      .from('Request')
      .select('*, created_by:User!created_by_id(full_name), updated_by:User!updated_by_id(full_name), assigned_user:User!assigned_to_id(full_name)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;

    // Normalize JSONB fields — Supabase returns them as objects, but legacy
    // records might have been stored as JSON strings.
    return (data as Request[]).map(r => {
      const parseJson = (val: any) => {
        if (!val) return val;
        if (typeof val === 'string') {
          try { return JSON.parse(val); } catch { return null; }
        }
        return val;
      };
      return {
        ...r,
        attached_file:  parseJson(r.attached_file),
        attached_files: Array.isArray(r.attached_files)
          ? r.attached_files
          : (r.attached_files ? parseJson(r.attached_files) : []),
      };
    });
  },

  getNextSequenceNumber: async (table: string, prefix: string): Promise<string> => {
    // SECURITY UPGRADE: Use a Security Definer RPC to get the absolute global next number.
    // This bypasses RLS to ensure clients don't start their own local sequences from 0001.
    if (table === 'Request') {
      try {
        const { data, error } = await supabase.rpc('get_next_request_number');
        if (error) throw error;
        if (data) return data;
      } catch (err) {
        console.error("Global Sequence RPC failed, falling back to local calculation:", err);
      }
    }

    const colName = table === 'Request' ? 'request_number' : 
                    table === 'expenses' ? 'expense_number' : 
                    table === 'timesheets' ? 'timesheet_number' :
                    table === 'invoices' ? 'invoice_number' : null;
    
    if (!colName) return `${prefix}-0001`;

    const { data, error } = await supabase
      .from(table)
      .select(colName)
      .like(colName, `${prefix}-%`)
      .order(colName, { ascending: false })
      .limit(20); 
    
    if (error) {
      console.error(`Error getting sequence for ${table}:`, error);
      return `${prefix}-0001`;
    }
    
    const sequentialRecords = data?.filter(r => {
      const val = r[colName];
      if (!val) return false;
      const parts = val.split('-');
      return parts.length === 2 && !isNaN(parseInt(parts[1])) && parts[1].length === 4;
    });

    const lastNum = sequentialRecords?.[0]?.[colName];
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
        ...sanitize(record),
        request_number,
        submitted_by: user?.id,
        created_by_id: user?.id,
        updated_by_id: user?.id,
        submitted_by_name: currentUser?.full_name || 'System',
        created_by_name: currentUser?.full_name || 'System',
        updated_by_name: currentUser?.full_name || 'System'
      })
      .select('*, created_by:User!created_by_id(full_name), updated_by:User!updated_by_id(full_name), assigned_user:User!assigned_to_id(full_name)')
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
        ...sanitize(record),
        updated_at: new Date().toISOString(),
        updated_by_id: user?.id,
        updated_by_name: currentUser?.full_name || 'System'
      })
      .eq('id', id)
      .select('*, created_by:User!created_by_id(full_name), updated_by:User!updated_by_id(full_name), assigned_user:User!assigned_to_id(full_name)')
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

      // Notify Submitter
      await api.createNotification({
        user_id: data.submitted_by,
        title: 'Mandate Status Updated',
        message: `${data.request_number}: ${data.title} is now ${data.status.replace('_', ' ')}.`,
        type: 'request',
        related_id: data.id,
        sender_name: currentUser?.full_name || 'System'
      });
    }

    // Notify Assigned Professional if changed
    if (record.assigned_to && record.assigned_to !== oldRecord?.assigned_to) {
      await api.createNotification({
        user_id: record.assigned_to,
        title: 'Mandate Assigned',
        message: `You have been assigned to Mandate: ${data.request_number}.`,
        type: 'request',
        related_id: data.id,
        sender_name: currentUser?.full_name || 'System'
      });
    }

    return data as Request;
  },

  // --- TIMESHEETS ---
  getTimesheets: async (recordId?: string): Promise<TimesheetEntry[]> => {
    let query = supabase.from('timesheets').select('*, created_by:User!created_by_id(full_name), updated_by:User!updated_by_id(full_name)').order('date', { ascending: false });
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
        ...sanitize(entry),
        timesheet_number,
        user_id: user?.id,
        created_by_id: user?.id,
        updated_by_id: user?.id,
        logged_by: currentUser?.full_name || 'System',
        created_by_name: currentUser?.full_name || 'System',
        updated_by_name: currentUser?.full_name || 'System'
      })
      .select('*, created_by:User!created_by_id(full_name), updated_by:User!updated_by_id(full_name)')
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
        ...sanitize(entry),
        updated_at: new Date().toISOString(),
        updated_by_id: user?.id,
        updated_by_name: currentUser?.full_name || 'System'
      })
      .eq('id', id)
      .select('*, created_by:User!created_by_id(full_name), updated_by:User!updated_by_id(full_name)')
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

      // Notify submitter (user_id)
      if (data.user_id) {
        await api.createNotification({
          user_id: data.user_id,
          title: 'Timesheet Status Updated',
          message: `${data.timesheet_number} has been ${data.status}.`,
          type: 'timesheet',
          related_id: data.id,
          sender_name: currentUser?.full_name || 'System Governance'
        });
      }
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
      .select('*, created_by:User!created_by_id(full_name), updated_by:User!updated_by_id(full_name)');
    
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
    let query = supabase.from('expenses').select('*, created_by:User!created_by_id(full_name), updated_by:User!updated_by_id(full_name)').order('date', { ascending: false });
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
        ...sanitize(entry),
        expense_number,
        user_id: user?.id,
        created_by_id: user?.id,
        updated_by_id: user?.id,
        created_by_name: currentUser?.full_name || 'System',
        updated_by_name: currentUser?.full_name || 'System'
      })
      .select('*, created_by:User!created_by_id(full_name), updated_by:User!updated_by_id(full_name)')
      .single();
    
    if (error) throw error;
    await api.createAuditLog({
      table_name: 'expenses',
      record_id: data.id,
      action: 'LOG_EXPENSE',
      field_name: 'expense_number',
      new_value: expense_number,
    });

    // Notify Admin if High Value (> 10000 for example)
    if (parseFloat(data.amount?.toString()) > 10000) {
      const { data: admins } = await supabase.from('User').select('id').eq('role', 'admin');
      if (admins) {
        for (const admin of admins) {
          await api.createNotification({
            user_id: admin.id,
            title: 'High-Value Expense Alert',
            message: `${expense_number}: ${data.amount} for ${data.category}.`,
            type: 'expense',
            related_id: data.id,
            sender_name: currentUser?.full_name || 'System'
          });
        }
      }
    }

    return data as ExpenseEntry;
  },

  updateExpense: async (id: string, entry: Partial<ExpenseEntry>): Promise<ExpenseEntry> => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: currentUser } = await supabase.from('User').select('full_name').eq('id', user?.id).single();

    const { data: oldEntry } = await supabase.from('expenses').select('*').eq('id', id).single();

    const { data, error } = await supabase
      .from('expenses')
      .update({
        ...sanitize(entry),
        updated_at: new Date().toISOString(),
        updated_by_id: user?.id,
        updated_by_name: currentUser?.full_name || 'System'
      })
      .eq('id', id)
      .select('*, created_by:User!created_by_id(full_name), updated_by:User!updated_by_id(full_name)')
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

      // Notify submitter (user_id)
      if (data.user_id) {
        await api.createNotification({
          user_id: data.user_id,
          title: 'Expense Status Updated',
          message: `${data.expense_number} has been ${data.status}.`,
          type: 'expense',
          related_id: data.id,
          sender_name: currentUser?.full_name || 'System Governance'
        });
      }
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
      .select('*, created_by:User!created_by_id(full_name), updated_by:User!updated_by_id(full_name)');
    
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
      new_value: String(cleanLog.new_value || details || 'Action performed'),
      changed_by: user?.id,
      changed_by_name: user?.user_metadata?.full_name || user?.user_metadata?.firstName ? `${user.user_metadata.firstName} ${user.user_metadata.lastName}` : 'System'
    };

    await supabase.from('audit_logs').insert(finalLog);
  },

  getAuditLogs: async (): Promise<UIHistoryItem[]> => {
    const [logs, records, expenses, timesheets] = await Promise.all([
      supabase.from('audit_logs').select('*, changed_by_user:User!changed_by(full_name)').order('created_at', { ascending: false }),
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
      user_name: l.changed_by_user?.full_name || l.changed_by_name, 
      record_id: l.record_id, 
      record_ref: refMap[l.record_id] || l.record_id?.substring(0, 8) || 'N/A',
      table_name: l.table_name,
    }));
  },

  getHistoryByRecord: async (record_id: string): Promise<AuditLog[]> => {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*, changed_by_user:User!changed_by(full_name)')
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

    // Notify User of Verification Change
    if (updates.status) {
      await api.createNotification({
        user_id: id,
        title: updates.status === 'approved' ? 'Account Verified' : 'Account Update',
        message: updates.status === 'approved' ? 'Welcome! Your account has been approved.' : `Your account status is now ${updates.status}.`,
        type: 'system',
        sender_name: 'System Governance'
      });
    }

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
      .select('*, sender:User!sender_id(full_name)')
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
        sender_id: (await supabase.auth.getUser()).data.user?.id,
        is_read: false,
        created_at: new Date().toISOString()
      });
    if (error) throw error;
  },

  // === FILE STORAGE ===
  uploadFile: async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `mandates/${fileName}`;
    const bucketName = 'mandate-files';

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file);

    if (uploadError) {
      console.error("Supabase Storage Error:", uploadError);
      throw new Error(`Storage Error: ${uploadError.message || 'Upload failed'}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return publicUrl;
  },

  // === ADMIN / GOVERNANCE ACTIONS ===
  adminCreateUser: async (email: string, firstName: string, lastName: string, role: User['role']): Promise<void> => {
    // Note: In a real production app, this would be an Edge Function using the Service Role Key.
    // For this environment, we'll attempt a signup which creates the Auth user.
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password: 'TemporaryPassword123!', // User will need to reset this
      options: {
        data: {
          full_name: `${firstName} ${lastName}`,
          first_name: firstName,
          last_name: lastName,
          role: role
        }
      }
    });

    if (authError) throw authError;

    if (data.user) {
      // Create the profile in public.User table
      const { error: profileError } = await supabase
        .from('User')
        .insert({
          id: data.user.id,
          email,
          full_name: `${firstName} ${lastName}`,
          first_name: firstName,
          last_name: lastName,
          role,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (profileError) throw profileError;
    }
  },

  adminDeleteUser: async (id: string): Promise<void> => {
    // Delete from public.User (RLS should allow if admin)
    const { error: profileError } = await supabase
      .from('User')
      .delete()
      .eq('id', id);
    
    if (profileError) throw profileError;
    
    // Note: Auth user deletion usually requires service role. 
    // We'll log the action.
    await api.createAuditLog({
      table_name: 'User',
      record_id: id,
      action: 'ADMIN_DELETE_USER',
      field_name: 'id',
      new_value: id
    });
  },

  adminResetPassword: async (email: string): Promise<void> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/portal/reset-password`,
    });
    if (error) throw error;
  },

  adminSetPassword: async (userId: string, newPassword: string): Promise<void> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated. Please log in again.');

    const response = await fetch('/api/admin-set-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ userId, newPassword })
    });

    const responseText = await response.text();
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (err) {
      // If Vercel crashes heavily (e.g. 504 timeout), it returns an HTML page instead of JSON.
      console.error("Non-JSON response from server:", responseText);
      throw new Error("Server communication failed. The endpoint returned an invalid format.");
    }

    if (!response.ok) {
      throw new Error(result?.error || 'Failed to set password due to a server error.');
    }
  },

  adminSendInvite: async (email: string, firstName: string, lastName: string, role: string): Promise<void> => {
    // In Supabase, this is usually done via admin.inviteUserByEmail.
    // From client, we can trigger a password reset or similar if the user exists.
    // For now, we'll re-trigger a password reset as a "re-invite".
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },

  // === REQUEST MESSAGES (CHATTER) ===
  getRequestMessages: async (requestId: string): Promise<RequestMessage[]> => {
    const { data, error } = await supabase
      .from('request_messages')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data as RequestMessage[];
  },

  sendRequestMessage: async (requestId: string, message: string): Promise<RequestMessage> => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: currentUser } = await supabase.from('User').select('full_name, role').eq('id', user?.id).single();

    const { data, error } = await supabase
      .from('request_messages')
      .insert({
        request_id: requestId,
        sender_id: user?.id,
        sender_name: currentUser?.full_name || 'System',
        sender_role: currentUser?.role || 'unknown',
        message
      })
      .select('*')
      .single();
    
    if (error) throw error;
    return data as RequestMessage;
  },

  // === PAYMENT METHODS ===
  getPaymentMethods: async (): Promise<PaymentMethod[]> => {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data as PaymentMethod[];
  },

  createPaymentMethod: async (pm: Partial<PaymentMethod>): Promise<PaymentMethod> => {
    const { data, error } = await supabase
      .from('payment_methods')
      .insert({ ...sanitize(pm) })
      .select('*')
      .single();
    if (error) throw error;
    return data as PaymentMethod;
  },

  updatePaymentMethod: async (id: string, pm: Partial<PaymentMethod>): Promise<PaymentMethod> => {
    const { data, error } = await supabase
      .from('payment_methods')
      .update({ ...sanitize(pm), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data as PaymentMethod;
  },

  deletePaymentMethod: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('payment_methods')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  // === INVOICE SENDERS ===
  getInvoiceSenders: async (): Promise<InvoiceSender[]> => {
    const { data, error } = await supabase
      .from('invoice_senders')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data as InvoiceSender[];
  },

  createInvoiceSender: async (sender: Partial<InvoiceSender>): Promise<InvoiceSender> => {
    const { data, error } = await supabase
      .from('invoice_senders')
      .insert({ ...sanitize(sender) })
      .select('*')
      .single();
    if (error) throw error;
    return data as InvoiceSender;
  },

  updateInvoiceSender: async (id: string, sender: Partial<InvoiceSender>): Promise<InvoiceSender> => {
    const { data, error } = await supabase
      .from('invoice_senders')
      .update({ ...sanitize(sender), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data as InvoiceSender;
  },

  deleteInvoiceSender: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('invoice_senders')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  // === INVOICES ===
  getInvoices: async (): Promise<Invoice[]> => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map((inv: any) => ({
      ...inv,
      line_items: Array.isArray(inv.line_items) ? inv.line_items : 
        (typeof inv.line_items === 'string' ? JSON.parse(inv.line_items) : [])
    })) as Invoice[];
  },

  getInvoicesByAccount: async (accountId: string): Promise<Invoice[]> => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map((inv: any) => ({
      ...inv,
      line_items: Array.isArray(inv.line_items) ? inv.line_items :
        (typeof inv.line_items === 'string' ? JSON.parse(inv.line_items) : [])
    })) as Invoice[];
  },

  getInvoiceById: async (id: string): Promise<Invoice | null> => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return {
      ...data,
      line_items: Array.isArray(data.line_items) ? data.line_items :
        (typeof data.line_items === 'string' ? JSON.parse(data.line_items) : [])
    } as Invoice;
  },

  createInvoice: async (invoice: Partial<Invoice>): Promise<Invoice> => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: currentUser } = await supabase.from('User').select('full_name').eq('id', user?.id).single();

    const invoice_number = await api.getNextSequenceNumber('invoices', 'INV');

    const payload: any = {
      ...sanitize(invoice),
      invoice_number,
      created_by_id: user?.id,
      created_by_name: currentUser?.full_name || 'System'
    };

    let data: any;
    let error: any;

    const res = await supabase
      .from('invoices')
      .insert(payload)
      .select('*')
      .single();
    
    data = res.data;
    error = res.error;

    if (error) {
      if (error.message && error.message.includes('invoice_type')) {
        console.warn("Database missing 'invoice_type' column. Retrying without it.");
        const { invoice_type, ...fallbackPayload } = payload;
        const retryRes = await supabase
          .from('invoices')
          .insert(fallbackPayload)
          .select('*')
          .single();
        data = retryRes.data;
        error = retryRes.error;
      }
    }

    if (error) throw error;

    await api.createAuditLog({
      table_name: 'invoices',
      record_id: data.id,
      action: 'CREATE_INVOICE',
      field_name: 'invoice_number',
      new_value: invoice_number,
    });

    return {
      ...data,
      line_items: Array.isArray(data.line_items) ? data.line_items : []
    } as Invoice;
  },

  updateInvoice: async (id: string, invoice: Partial<Invoice>): Promise<Invoice> => {
    const payload: any = {
      ...sanitize(invoice),
      updated_at: new Date().toISOString()
    };

    let data: any;
    let error: any;

    const res = await supabase
      .from('invoices')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    data = res.data;
    error = res.error;

    if (error) {
      if (error.message && error.message.includes('invoice_type')) {
        console.warn("Database missing 'invoice_type' column. Retrying update without it.");
        const { invoice_type, ...fallbackPayload } = payload;
        const retryRes = await supabase
          .from('invoices')
          .update(fallbackPayload)
          .eq('id', id)
          .select('*')
          .single();
        data = retryRes.data;
        error = retryRes.error;
      }
    }

    if (error) throw error;

    return {
      ...data,
      line_items: Array.isArray(data.line_items) ? data.line_items : []
    } as Invoice;
  }
};
