import { LocalNotifications } from '@capacitor/local-notifications';

export const notificationService = {
  async requestPermissions() {
    const { display } = await LocalNotifications.checkPermissions();
    if (display !== 'granted') {
      await LocalNotifications.requestPermissions();
    }
  },

  async scheduleSessionNotification(session: { 
    id: number, 
    case_title: string, 
    session_date: string,
    client_name?: string 
  }) {
    await this.requestPermissions();

    const sessionDate = new Date(session.session_date);
    const now = new Date();

    // Schedule exact notification at session time
    if (sessionDate > now) {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: `⚖️ سيادة المحامي الكامل`,
            body: `لديك جلسة: ${session.case_title}\nالموكل: ${session.client_name || 'غير محدد'}\nالتوقيت: ${sessionDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`,
            id: session.id,
            schedule: { at: sessionDate, allowWhileIdle: true },
            sound: 'default',
            channelId: 'session-alerts',
            actionTypeId: 'SESSION_ALERT',
            extra: {
              caseId: session.id,
              caseTitle: session.case_title,
              clientName: session.client_name || ''
            }
          }
        ]
      });
    }
  },

  async cancelNotification(id: number) {
    await LocalNotifications.cancel({
      notifications: [{ id }]
    });
  },

  async setupNotificationActions() {
    // Register action types for snooze/dismiss
    await LocalNotifications.registerActionTypes({
      types: [
        {
          id: 'SESSION_ALERT',
          actions: [
            {
              id: 'snooze',
              title: 'تأجيل 5 دقائق ⏰'
            },
            {
              id: 'dismiss',
              title: 'موافق ✅',
              destructive: false
            }
          ]
        }
      ]
    });

    // Listen for action performed
    LocalNotifications.addListener('localNotificationActionPerformed', async (notification) => {
      const actionId = notification.actionId;
      const extra = notification.notification.extra;

      if (actionId === 'snooze' && extra) {
        // Reschedule notification 5 minutes from now
        const snoozeDate = new Date(Date.now() + 5 * 60 * 1000);
        const snoozeId = extra.caseId + 10000; // Offset ID for snooze
        
        await LocalNotifications.schedule({
          notifications: [
            {
              title: `⚖️ تذكير متكرر - سيادة المحامي`,
              body: `لديك جلسة: ${extra.caseTitle}\nالموكل: ${extra.clientName || 'غير محدد'}`,
              id: snoozeId,
              schedule: { at: snoozeDate, allowWhileIdle: true },
              sound: 'default',
              channelId: 'session-alerts',
              actionTypeId: 'SESSION_ALERT',
              extra: extra
            }
          ]
        });
      }
    });
  },

  async createNotificationChannel() {
    try {
      await LocalNotifications.createChannel({
        id: 'session-alerts',
        name: 'تنبيهات الجلسات',
        description: 'تنبيهات مواعيد الجلسات القضائية',
        importance: 5, // MAX importance
        visibility: 1, // PUBLIC
        sound: 'default',
        vibration: true,
        lights: true
      });
    } catch (e) {
      // Channel creation not supported on web
      console.log('Channel creation skipped (web)');
    }
  }
};
