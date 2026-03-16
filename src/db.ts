import Dexie, { Table } from 'dexie';
import { User, Case, Session, Document, Message } from './types';

export interface Folder {
  id?: number;
  name: string;
  number: string;
  created_at: string;
}

export class LawyerAppDatabase extends Dexie {
  users!: Table<User>;
  cases!: Table<Case>;
  sessions!: Table<Session>;
  documents!: Table<Document>;
  messages!: Table<Message>;
  folders!: Table<Folder>;

  constructor() {
    super('LawyerAppDB');
    this.version(1).stores({
      users: '++id, email, phone, role',
      cases: '++id, case_number, title, lawyer_id, client_id, status',
      sessions: '++id, case_id, session_date',
      documents: '++id, case_id, file_name',
      messages: '++id, case_id, sender_id, created_at'
    });
    this.version(2).stores({
      users: '++id, email, phone, role',
      cases: '++id, case_number, title, lawyer_id, client_id, status',
      sessions: '++id, case_id, session_date',
      documents: '++id, case_id, file_name, folder_id',
      messages: '++id, case_id, sender_id, created_at',
      folders: '++id, name, number'
    });
  }
}

export const db = new LawyerAppDatabase();

