import React, { useEffect, useRef } from 'react';
import { User, Session } from '../types';
import { dataService } from '../services/dataService';

interface NotificationManagerProps {
    user: User | null;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({ user }) => {
    const notifiedSessions = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!user || user.role !== 'lawyer') return;

        // Request permission on mount
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        const checkSessions = async () => {
            try {
                // Use local dataService instead of server API
                const sessions = await dataService.getSessions(user.id);
                console.log(`Notifications: found ${sessions.length} sessions`);

                const now = new Date();

                sessions.forEach(session => {
                    const sessionDate = new Date(session.session_date);
                    const diffMs = sessionDate.getTime() - now.getTime();
                    const diffMins = Math.ceil(diffMs / 60000);

                    console.log(`Checking session ${session.id}: ${session.case_title}, diff: ${diffMins}m`);

                    // Notification thresholds: 30, 15, 5, 2, 0 mins
                    const thresholds = [30, 15, 5, 2, 0];

                    thresholds.forEach(threshold => {
                        const key = `${session.id}-${threshold}`;

                        if (diffMins <= threshold && diffMins > threshold - 2 && !notifiedSessions.current.has(key)) {
                            console.log(`Triggering notification for ${threshold}m threshold`);
                            showNotification(session, threshold);
                            notifiedSessions.current.add(key);
                        }
                    });
                });
            } catch (err) {
                console.error('Failed to check sessions:', err);
            }
        };

        const showNotification = (session: Session, minutesLeft: number) => {
            console.log('Attempting to show notification...', Notification.permission);
            if (!('Notification' in window) || Notification.permission !== 'granted') {
                console.warn('Notifications not granted or supported');
                return;
            }

            try {
                const title = minutesLeft <= 0
                    ? `موعد الجلسة الآن: ${session.case_title || 'قضية'}`
                    : `تذكير: جلسة بعد قليل (${minutesLeft} دقيقة)`;

                const body = `رقم القضية: ${session.case_number || 'غير معروف'}
المكان: ${session.notes || 'راجع ملاحظات الجلسة'}
التوقيت: ${new Date(session.session_date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`;

                const n = new Notification(title, {
                    body,
                    icon: '/favicon.ico',
                    badge: '/favicon.ico',
                    requireInteraction: true
                });

                n.onclick = () => {
                    window.focus();
                    window.location.href = `/case/${session.case_id}`;
                };
            } catch (err) {
                console.error('Error creating notification:', err);
            }
        };

        // Check every minute
        const interval = setInterval(checkSessions, 60000);
        checkSessions(); // Initial check

        return () => clearInterval(interval);
    }, [user]);

    return null; // This component doesn't render anything
};
