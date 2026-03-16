import React, { useEffect, useRef, useState } from 'react';
import { User, Session } from '../types';
import { dataService } from '../services/dataService';
import { notificationService } from '../services/notificationService';

interface NotificationManagerProps {
    user: User | null;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({ user }) => {
    const notifiedSessions = useRef<Set<string>>(new Set());
    const [activeAlert, setActiveAlert] = useState<{
        session: Session;
        visible: boolean;
    } | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const snoozeTimers = useRef<Map<number, NodeJS.Timeout>>(new Map());

    useEffect(() => {
        if (!user || user.role !== 'lawyer') return;

        // Request permission on mount
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        // Setup native notification actions
        notificationService.createNotificationChannel().catch(() => {});
        notificationService.setupNotificationActions().catch(() => {});

        const checkSessions = async () => {
            try {
                const sessions = await dataService.getSessions(user.id);
                const now = new Date();

                sessions.forEach(session => {
                    const sessionDate = new Date(session.session_date);
                    const diffMs = sessionDate.getTime() - now.getTime();
                    const diffSecs = Math.ceil(diffMs / 1000);
                    const key = `${session.id}-exact`;

                    // Fire exactly when time arrives (within 5 second window)
                    if (diffSecs <= 0 && diffSecs > -5 && !notifiedSessions.current.has(key)) {
                        notifiedSessions.current.add(key);
                        triggerAlert(session);
                    }
                });
            } catch (err) {
                console.error('Failed to check sessions:', err);
            }
        };

        const triggerAlert = (session: Session) => {
            // Show in-app alert with sound
            setActiveAlert({ session, visible: true });
            playAlarmSound();

            // Also show system notification
            showSystemNotification(session);
        };

        const showSystemNotification = (session: Session) => {
            if (!('Notification' in window) || Notification.permission !== 'granted') return;

            try {
                const n = new Notification(`⚖️ سيادة المحامي الكامل`, {
                    body: `لديك جلسة: ${session.case_title || 'قضية'}\nالموكل: ${(session as any).client_name || 'غير محدد'}\nالتوقيت: ${new Date(session.session_date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`,
                    icon: '/favicon.ico',
                    badge: '/favicon.ico',
                    requireInteraction: true,
                    tag: `session-${session.id}`
                });

                n.onclick = () => {
                    window.focus();
                    window.location.href = `/case/${session.case_id}`;
                };
            } catch (err) {
                console.error('Error creating notification:', err);
            }
        };

        // Check every 3 seconds for precise timing
        const interval = setInterval(checkSessions, 3000);
        checkSessions();

        return () => {
            clearInterval(interval);
            snoozeTimers.current.forEach(t => clearTimeout(t));
        };
    }, [user]);

    const playAlarmSound = () => {
        try {
            // Use Web Audio API for reliable sound
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            
            const playTone = (freq: number, startTime: number, duration: number) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.frequency.value = freq;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.3, startTime);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
                osc.start(startTime);
                osc.stop(startTime + duration);
            };

            // Play a pleasant alarm pattern
            const now = audioCtx.currentTime;
            playTone(880, now, 0.2);
            playTone(1100, now + 0.25, 0.2);
            playTone(880, now + 0.5, 0.2);
            playTone(1100, now + 0.75, 0.2);
            playTone(1320, now + 1.0, 0.4);
        } catch (e) {
            console.log('Audio playback failed:', e);
        }
    };

    const handleDismiss = () => {
        setActiveAlert(null);
    };

    const handleSnooze = () => {
        if (!activeAlert) return;
        const session = activeAlert.session;
        setActiveAlert(null);

        // Re-trigger after 5 minutes
        const timer = setTimeout(() => {
            setActiveAlert({ session, visible: true });
            playAlarmSound();
            showSnoozeSystemNotification(session);
        }, 5 * 60 * 1000);

        snoozeTimers.current.set(session.id, timer);
    };

    const showSnoozeSystemNotification = (session: Session) => {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;
        try {
            new Notification(`⚖️ تذكير متكرر - سيادة المحامي`, {
                body: `لديك جلسة: ${session.case_title || 'قضية'}\nحان الوقت!`,
                icon: '/favicon.ico',
                requireInteraction: true,
                tag: `session-snooze-${session.id}`
            });
        } catch {}
    };

    if (!activeAlert?.visible) return null;

    const session = activeAlert.session;
    const timeStr = new Date(session.session_date).toLocaleTimeString('ar-EG', { 
        hour: '2-digit', minute: '2-digit' 
    });

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg" style={{ direction: 'rtl' }}>
            <div className="bg-[#111827] border-2 border-indigo-500/50 rounded-3xl p-8 max-w-sm w-full shadow-2xl shadow-indigo-500/20 text-center animate-in fade-in zoom-in duration-300">
                {/* Pulsing icon */}
                <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <span className="text-4xl">⚖️</span>
                </div>

                {/* Title */}
                <h2 className="text-xl font-black text-white mb-2">
                    سيادة المحامي الكامل
                </h2>
                <p className="text-indigo-400 font-bold text-lg mb-4">لديك جلسة الآن!</p>

                {/* Session Details */}
                <div className="bg-white/5 rounded-2xl p-4 space-y-3 mb-6 text-right">
                    <div className="flex justify-between items-center">
                        <span className="text-white font-bold">{session.case_title || 'قضية'}</span>
                        <span className="text-xs text-slate-400">📋 القضية</span>
                    </div>
                    <div className="border-t border-white/10"></div>
                    <div className="flex justify-between items-center">
                        <span className="text-white font-bold">{(session as any).client_name || 'غير محدد'}</span>
                        <span className="text-xs text-slate-400">👤 الموكل</span>
                    </div>
                    <div className="border-t border-white/10"></div>
                    <div className="flex justify-between items-center">
                        <span className="text-white font-bold" dir="ltr">{timeStr}</span>
                        <span className="text-xs text-slate-400">🕐 التوقيت</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={handleSnooze}
                        className="flex-1 py-4 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl font-bold text-sm hover:bg-amber-500/20 transition-all"
                    >
                        ⏰ تأجيل 5 دقائق
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-bold text-sm hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                    >
                        ✅ موافق
                    </button>
                </div>
            </div>
        </div>
    );
};
