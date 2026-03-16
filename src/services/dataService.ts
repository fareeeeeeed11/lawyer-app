import { db } from '../db';
import { User, Case, Session, Document, Message } from '../types';
import { notificationService } from './notificationService';

export const dataService = {
  // Users
  async getUsers(): Promise<User[]> {
    return await db.users.toArray();
  },
  
  async login(identifier: string): Promise<User | null> {
    const user = await db.users
      .filter(u => u.email === identifier || u.phone === identifier)
      .first();
    return user || null;
  },

  // Cases
  async getCases(userId: number): Promise<Case[]> {
    return await db.cases.where('lawyer_id').equals(userId).toArray();
  },

  async getCaseById(id: number): Promise<any | undefined> {
    const caseData = await db.cases.get(id);
    if (!caseData) return undefined;
    
    const sessions = await db.sessions.where('case_id').equals(id).toArray();
    const documents = await db.documents.where('case_id').equals(id).toArray();
    
    return {
      ...caseData,
      sessions: sessions || [],
      documents: documents || []
    };
  },

  async updateCaseFees(id: number, feesData: any): Promise<void> {
    await db.cases.update(id, feesData);
  },

  async deleteCase(id: number): Promise<void> {
    await db.cases.delete(id);
  },

  async addCase(caseData: Omit<Case, 'id' | 'created_at'>): Promise<number> {
    return await db.cases.add({
      ...caseData,
      status: 'active',
      created_at: new Date().toISOString()
    } as Case);
  },

  // Clients (Users with role 'client')
  async getClients(lawyerId: number): Promise<User[]> {
    return await db.users.where('role').equals('client').toArray();
  },

  async addClient(clientData: { name: string, phone: string }): Promise<number> {
    return await db.users.add({
      ...clientData,
      role: 'client',
      email: `${Date.now()}@client.lawyer` // Mock email for key
    } as User);
  },

  async updateClient(id: number, clientData: { name: string, phone: string }): Promise<void> {
    await db.users.update(id, clientData);
  },

  async deleteClient(id: number): Promise<void> {
    // Check if client has active cases
    const caseCount = await db.cases.where('client_id').equals(id).count();
    if (caseCount > 0) throw new Error('لا يمكن حذف عميل لديه قضية نشطة');
    await db.users.delete(id);
  },

  // Sessions
  async getSessions(userId: number): Promise<Session[]> {
    const cases = await this.getCases(userId);
    const caseIds = cases.map(c => c.id);
    const sessions = await db.sessions.where('case_id').anyOf(caseIds).toArray();
    
    // Enrich sessions with case info for notifications/UI
    for (const session of sessions) {
      const caseData = await db.cases.get(session.case_id);
      if (caseData) {
        session.case_title = caseData.title;
        session.case_number = caseData.case_number;
      }
    }
    return sessions;
  },

  async addSession(sessionData: Omit<Session, 'id'>): Promise<number> {
    const id = await db.sessions.add(sessionData as Session);
    
    // Schedule notification
    const caseData = await db.cases.get(sessionData.case_id);
    if (caseData) {
      await notificationService.scheduleSessionNotification({
        id,
        case_title: caseData.title,
        session_date: sessionData.session_date,
        client_name: caseData.client_name
      });
    }
    
    return id;
  },

  async updateSession(id: number, sessionData: any): Promise<void> {
    await db.sessions.update(id, sessionData);
    
    // Reschedule notification
    const fullSession = await db.sessions.get(id);
    if (fullSession) {
      const caseData = await db.cases.get(fullSession.case_id);
      if (caseData) {
        await notificationService.scheduleSessionNotification({
          id,
          case_title: caseData.title,
          session_date: fullSession.session_date
        });
      }
    }
  },

  async deleteSession(id: number): Promise<void> {
    await db.sessions.delete(id);
    await notificationService.cancelNotification(id);
  },

  // Documents
  async getDocuments(userId: number): Promise<Document[]> {
    const cases = await this.getCases(userId);
    const caseIds = cases.map(c => c.id);
    return await db.documents.where('case_id').anyOf(caseIds).toArray();
  },

  async addDocument(documentData: Omit<Document, 'id' | 'created_at'>): Promise<number> {
    return await db.documents.add({
      ...documentData,
      created_at: new Date().toISOString()
    } as Document);
  },

  // Stats
  async getStats(userId: number) {
    const cases = await this.getCases(userId);
    const clients = await this.getClients(userId);
    const sessions = await this.getSessions(userId);
    
    return {
      activeCases: cases.filter(c => !c.status || c.status === 'active').length,
      totalClients: clients.length,
      upcomingSessions: sessions.filter(s => new Date(s.session_date) > new Date()).length,
      recentClients: clients.slice(0, 5),
      todayTasks: sessions.filter(s => {
        const d = new Date(s.session_date);
        const today = new Date();
        return d.toDateString() === today.toDateString();
      })
    };
  }
};
