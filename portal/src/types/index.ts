export const AdverisTypesCanary = "V1.0";

export type UserRole = 'admin' | 'employee' | 'client';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  expertise_tags?: string[];
  account_id?: string;
}

export interface Address {
  house_no?: string;
  street_1?: string;
  street_2?: string;
  street_3?: string;
  landmark?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
}

export interface Account extends Address {
  id: string;
  account_name: string;
  pan_number?: string;
  cin_number?: string;
  gstin_number?: string;
  industry?: string;
  created_at: string;
  created_by_name: string;
  updated_at: string;
  updated_by_name: string;
}

export interface Client extends Address {
  id: string;
  account_id: string;
  client_name: string;
  designation?: string;
  email_1: string;
  email_2?: string;
  email_3?: string;
  phone_1: string;
  phone_2?: string;
  phone_3?: string;
  created_at: string;
  created_by_name: string;
  updated_at: string;
  updated_by_name: string;
}

export interface ServiceRecord {
  id: string;
  account_id: string;
  account_name: string;
  request_number: string;
  title: string;
  primary_service: string;
  sub_service: string;
  status: 'pending' | 'active' | 'completed' | 'on_hold';
  priority: 'Standard' | 'High' | 'Urgent';
  assigned_to?: string;
  submitted_by: string;
  submitted_by_name: string;
  description?: string;
  verification_status: 'Pending' | 'Verified' | 'Rejected';
  verification_remarks?: string;
  additional_services?: string;
  sub_services?: string[];
  due_date?: string;
  approved_date?: string;
  days_left?: number | string;
  hours_consumed?: number | string;
  attached_file?: { name: string; size: number; type: string; url: string };
  internal_notes?: string;
  client_comms?: string;
  created_at: string;
  created_by_name: string;
  updated_at: string;
  updated_by_name: string;
}

export interface TimesheetEntry {
  id: string;
  record_id: string;
  account_id: string;
  account_name: string;
  hours: number | string;
  date: string;
  task_details?: string;
  logged_by: string;
  status: 'submitted' | 'approved' | 'paid' | 'rejected';
  created_at: string;
  created_by_name: string;
  updated_at: string;
  updated_by_name: string;
}

export interface ExpenseEntry {
  id: string;
  record_id: string;
  account_id: string;
  account_name: string;
  amount: number | string;
  date: string;
  category: string;
  description?: string;
  url?: string;
  status: 'submitted' | 'approved' | 'paid' | 'rejected';
  created_at: string;
  created_by_name: string;
  updated_at: string;
  updated_by_name: string;
}

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: string;
  changed_by_name: string;
  created_at: string;
  timestamp?: string; // Some logs might use timestamp
  details?: string; // Some logs might use details
  user_name?: string; // Some logs might use user_name
}

export interface UIHistoryItem {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  user_name: string;
  record_id: string;
  table_name: string;
}
