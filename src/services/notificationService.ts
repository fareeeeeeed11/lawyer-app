import { LocalNotifications } from '@capacitor/local-notifications';

export const notificationService = {
  async requestPermissions() {
    const { display } = await LocalNotifications.checkPermissions();
    if (display !== 'granted') {
      await LocalNotifications.requestPermissions();
    }
  },

  async scheduleSessionNotification(session: { id: number, case_title: string, session_date: string }) {
    await this.requestPermissions();

    const sessionDate = new Date(session.session_date);
    // Schedule notification 1 hour before the session (or immediate for testing if needed)
    const notificationDate = new Date(sessionDate.getTime() - 60 * 60 * 1000);

    // If the session is within an hour, schedule it for 1 minute from now
    const now = new Date();
    const scheduleDate = notificationDate > now ? notificationDate : new Date(now.getTime() + 60 * 1000);

    await LocalNotifications.schedule({
      notifications: [
        {
          title: 'تذكير بموعد جلسة وكبسة زر! ⚖️',
          body: `لديك جلسة قادمة لقضية: ${session.case_title}`,
          id: session.id,
          schedule: { at: scheduleDate },
          sound: 'default', // Requires 'default' to ensure audio plays
          actionTypeId: '',
          extra: {
            caseId: session.id
          }
        }
      ]
    });
  },

  async cancelNotification(id: number) {
    await LocalNotifications.cancel({
      notifications: [{ id }]
    });
  }
};
