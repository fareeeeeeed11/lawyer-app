import Dexie, { Table } from 'dexie';
import { User, Case, Session, Document, Message } from './types';

export class LawyerAppDatabase extends Dexie {
  users!: Table<User>;
  cases!: Table<Case>;
  sessions!: Table<Session>;
  documents!: Table<Document>;
  messages!: Table<Message>;

  constructor() {
    super('LawyerAppDB');
    this.version(1).stores({
      users: '++id, email, phone, role',
      cases: '++id, case_number, title, lawyer_id, client_id, status',
      sessions: '++id, case_id, session_date',
      documents: '++id, case_id, file_name',
      messages: '++id, case_id, sender_id, created_at'
    });
  }
}

export const db = new LawyerAppDatabase();
