export type UserRole = 'lawyer' | 'client';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
}

export interface Case {
  id: number;
  case_number: string;
  title: string;
  court: string;
  type: string;
  status: string;
  lawyer_id: number;
  client_id: number;
  fees: number;
  paid_amount: number;
  created_at: string;
  client_name?: string;
  lawyer_name?: string;
  client_email?: string;
}

export interface Session {
  id: number;
  case_id: number;
  session_date: string;
  notes: string;
}

export interface Message {
  id: number;
  case_id: number;
  sender_id: number;
  sender_name: string;
  sender_role: UserRole;
  content: string;
  created_at: string;
}

export interface Document {
  id: number;
  case_id: number;
  file_name: string;
  file_path: string;
  uploaded_by: number;
  created_at: string;
}

export interface LawyerStats {
  activeCases: number;
  totalClients: number;
  upcomingSessions: number;
}
