import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar as CalendarIcon, Clock, Briefcase, FileText, Plus, Edit2, Trash2 } from 'lucide-react';
import { User } from '../types';
import { getApiUrl } from '../config';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

import { dataService } from '../services/dataService';

export const CalendarPage = ({ user }: { user: User }) => {
    const [sessions, setSessions] = useState<any[]>([]);
    const [cases, setCases] = useState<any[]>([]); // For dropdown
    const [loading, setLoading] = useState(true);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingSession, setEditingSession] = useState<any>(null);
    const [sessionForm, setSessionForm] = useState({ case_id: '', session_date: '', notes: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const fetchSessions = async () => {
        try {
            const data = await dataService.getSessions(user.id);
            setSessions(data);
        } catch (e) {
            console.error("Error fetching sessions", e);
        } finally {
            setLoading(false);
        }
    };

    const fetchCases = async () => {
        try {
            const data = await dataService.getCases(user.id);
            setCases(data);
        } catch (e) {
            console.error("Error fetching cases", e);
        }
    };

    useEffect(() => {
        fetchSessions();
        fetchCases();
    }, [user.id]);

    const handleAddSession = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            await dataService.addSession({
                case_id: Number(sessionForm.case_id),
                session_date: sessionForm.session_date,
                notes: sessionForm.notes
            });
            await fetchSessions();
            setShowAddModal(false);
            setSessionForm({ case_id: '', session_date: '', notes: '' });
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditSession = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSession) return;
        setIsSubmitting(true);
        setError('');

        try {
            await dataService.updateSession(editingSession.id, {
                session_date: sessionForm.session_date,
                notes: sessionForm.notes
            });
            await fetchSessions();
            setShowEditModal(false);
            setEditingSession(null);
            setSessionForm({ case_id: '', session_date: '', notes: '' });
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteSession = async (id: number) => {
        if (!window.confirm("هل أنت متأكد من حذف هذه الجلسة؟")) return;
        try {
            await dataService.deleteSession(id);
            await fetchSessions();
        } catch (e: any) {
            alert(e.message || "حدث خطأ أثناء الحذف");
        }
    };

    const formatForInput = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-l from-white to-slate-400 mb-2">
                        التقويم والجلسات
                    </h1>
                    <p className="text-slate-400 font-medium">متابعة مواعيد الجلسات والمهام القادمة</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl transition-all shadow-lg shadow-indigo-500/25 font-bold shrink-0"
                >
                    <Plus className="w-5 h-5" />
                    <span>جلسة جديدة</span>
                </button>
            </div>

            <div className="glass-panel p-6 rounded-[2.5rem]">
                {loading ? (
                    <div className="h-64 flex items-center justify-center text-slate-400">جاري التحميل...</div>
                ) : sessions.length > 0 ? (
                    <div className="space-y-4">
                        {sessions.map((session: any) => {
                            const dateObj = new Date(session.session_date);
                            const isPast = dateObj < new Date();

                            return (
                                <motion.div
                                    key={session.id}
                                    whileHover={{ x: -10 }}
                                    className={`p-6 bg-white/5 border border-white/5 rounded-3xl flex items-center gap-4 md:gap-6 group transition-colors hover:bg-white/10 ${isPast ? 'opacity-50' : 'border-l-4 border-l-indigo-500'}`}
                                >
                                    <div className="flex flex-col items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-indigo-500/10 text-indigo-400 shrink-0 border border-indigo-500/20">
                                        <span className="text-xl md:text-2xl font-black">{format(dateObj, 'dd')}</span>
                                        <span className="text-xs md:text-sm font-bold">{format(dateObj, 'MMM', { locale: ar })}</span>
                                    </div>

                                    <div className="flex-1">
                                        <h3 className="text-lg md:text-xl font-bold text-white mb-2">{session.case_title}</h3>
                                        <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-slate-400">
                                            <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-lg">
                                                <Clock className="w-4 h-4 text-indigo-400" />
                                                <span className="font-mono">{format(dateObj, 'hh:mm a', { locale: ar })}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Briefcase className="w-4 h-4" />
                                                <span className="font-mono">قضية #{session.case_number}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {session.notes && (
                                        <div className="hidden lg:flex items-center gap-2 p-4 bg-black/20 rounded-2xl w-1/3 border border-white/5">
                                            <FileText className="w-5 h-5 text-slate-500 shrink-0" />
                                            <p className="text-sm text-slate-400 line-clamp-2">{session.notes}</p>
                                        </div>
                                    )}

                                    <div className="flex gap-1 shrink-0">
                                        <button
                                            onClick={() => {
                                                setEditingSession(session);
                                                setSessionForm({ case_id: session.case_id, session_date: formatForInput(session.session_date), notes: session.notes || '' });
                                                setShowEditModal(true);
                                            }}
                                            className="p-2 md:p-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-indigo-400 rounded-xl transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteSession(session.id)}
                                            className="p-2 md:p-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-rose-400 rounded-xl transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                        <CalendarIcon className="w-12 h-12 mb-4 opacity-50" />
                        <p className="text-lg">لا توجد جلسات أو مواعيد مسجلة</p>
                    </div>
                )}
            </div>

            {/* Add Session Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => !isSubmitting && setShowAddModal(false)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#1e2336] border border-white/10 rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-2xl font-black text-white mb-6">إضافة جلسة جديدة</h3>
                        {error && <div className="p-3 mb-4 bg-rose-500/10 text-rose-400 rounded-xl text-sm font-medium">{error}</div>}

                        <form onSubmit={handleAddSession} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">القضية المرتبطة</label>
                                <select
                                    required
                                    value={sessionForm.case_id}
                                    onChange={e => setSessionForm({ ...sessionForm, case_id: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50"
                                >
                                    <option value="" className="bg-slate-800 text-slate-400">اختر قضية...</option>
                                    {cases.map(c => (
                                        <option key={c.id} value={c.id} className="bg-slate-800">
                                            {c.title} (#{c.case_number})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">موعد الجلسة</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={sessionForm.session_date}
                                    onChange={e => setSessionForm({ ...sessionForm, session_date: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">ملاحظات (اختياري)</label>
                                <textarea
                                    value={sessionForm.notes}
                                    onChange={e => setSessionForm({ ...sessionForm, notes: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50 h-24 resize-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 px-4 bg-white/5 text-slate-300 rounded-xl font-bold">إلغاء</button>
                                <button type="submit" disabled={isSubmitting} className="flex-[2] py-3 px-4 bg-indigo-500 text-white rounded-xl font-bold">حفظ الجلسة</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Edit Session Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => !isSubmitting && setShowEditModal(false)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#1e2336] border border-white/10 rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-2xl font-black text-white mb-6">تعديل موعد الجلسة</h3>
                        {error && <div className="p-3 mb-4 bg-rose-500/10 text-rose-400 rounded-xl text-sm font-medium">{error}</div>}

                        <form onSubmit={handleEditSession} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">القضية المرتبطة</label>
                                <input
                                    type="text"
                                    disabled
                                    value={editingSession?.case_title}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-400 outline-none cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">موعد الجلسة</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={sessionForm.session_date}
                                    onChange={e => setSessionForm({ ...sessionForm, session_date: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">ملاحظات (اختياري)</label>
                                <textarea
                                    value={sessionForm.notes}
                                    onChange={e => setSessionForm({ ...sessionForm, notes: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500/50 h-24 resize-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-3 px-4 bg-white/5 text-slate-300 rounded-xl font-bold">إلغاء</button>
                                <button type="submit" disabled={isSubmitting} className="flex-[2] py-3 px-4 bg-amber-500 text-white rounded-xl font-bold">حفظ التعديلات</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
};
