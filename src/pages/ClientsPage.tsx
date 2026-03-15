import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, Search, Plus, Mail, Phone, Briefcase, Edit2, Trash2 } from 'lucide-react';
import { User } from '../types';
import { getApiUrl } from '../config';

import { dataService } from '../services/dataService';

export const ClientsPage = ({ user }: { user: User }) => {
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingClient, setEditingClient] = useState<any>(null);

    // Client Form State
    const [clientForm, setClientForm] = useState({ name: '', phone: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const fetchClients = async () => {
        try {
            const data = await dataService.getClients(user.id);
            setClients(data);
        } catch (e) {
            console.error("Error fetching clients", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, [user.id]);

    const handleAddClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            await dataService.addClient(clientForm);
            await fetchClients();
            setShowAddModal(false);
            setClientForm({ name: '', phone: '' });
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingClient) return;
        setIsSubmitting(true);
        setError('');

        try {
            await dataService.updateClient(editingClient.id, clientForm);
            await fetchClients();
            setShowEditModal(false);
            setEditingClient(null);
            setClientForm({ name: '', phone: '' });
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClient = async (id: number) => {
        if (!window.confirm("هل أنت متأكد من حذف هذا العميل نهائياً؟")) return;
        try {
            await dataService.deleteClient(id);
            await fetchClients();
        } catch (e: any) {
            console.error(e);
            alert(e.message || "حدث خطأ أثناء الحذف");
        }
    };

    const filteredClients = clients.filter(c =>
        (c.name || '').includes(search) ||
        (c.phone || '').includes(search) ||
        (c.email || '').includes(search)
    );



    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-l from-white to-slate-400 mb-2">
                        العملاء
                    </h1>
                    <p className="text-slate-400 font-medium">إدارة جميع العملاء المضافين إلى مكتبك</p>
                </div>

                <div className="flex gap-4 items-center">
                    <div className="relative">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="بحث بالاسم أو الرقم..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-2xl py-3 pr-12 pl-6 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all w-full md:w-64"
                        />
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl transition-all shadow-lg shadow-emerald-500/25 font-bold shrink-0"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="hidden sm:inline">عميل جديد</span>
                    </button>
                </div>
            </div>

            {/* Clients Grid */}
            <div className="glass-panel p-6 rounded-[2.5rem]">
                {loading ? (
                    <div className="h-64 flex items-center justify-center text-slate-400">جاري التحميل...</div>
                ) : filteredClients.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredClients.map((client: any) => (
                            <motion.div
                                key={client.id}
                                whileHover={{ y: -5 }}
                                className="p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all group relative overflow-hidden flex flex-col"
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0 border border-indigo-500/30 overflow-hidden">
                                            <img src={`https://ui-avatars.com/api/?name=${client.name}&background=6366f1&color=fff&bold=true`} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white mb-1">{client.name}</h3>
                                            <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
                                                <span className="px-2 py-0.5 bg-black/30 rounded-md">ID: {client.id}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => {
                                                setEditingClient(client);
                                                setClientForm({ name: client.name, phone: client.phone || '' });
                                                setShowEditModal(true);
                                            }}
                                            className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-indigo-400 rounded-lg transition-colors"
                                            title="تعديل"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClient(client.id)}
                                            className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                                            title="حذف"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6 flex-1">
                                    <div className="flex items-center gap-3 text-sm text-slate-300">
                                        <div className="p-2 bg-white/5 rounded-lg text-slate-400"><Phone className="w-4 h-4" /></div>
                                        <span className="font-mono">{client.phone || 'غير متوفر'}</span>
                                    </div>
                                    {client.email && !client.email.endsWith('@client.lawyer') && (
                                        <div className="flex items-center gap-3 text-sm text-slate-300">
                                            <div className="p-2 bg-white/5 rounded-lg text-slate-400"><Mail className="w-4 h-4" /></div>
                                            <span className="truncate">{client.email}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                                    <div className="flex items-center gap-2 text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-xl text-sm font-bold">
                                        <Briefcase className="w-4 h-4" />
                                        <span>{client.total_cases} قضايا مسجلة</span>
                                    </div>
                                    {client.active_cases > 0 && (
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" title={`${client.active_cases} قضية نشطة`}></span>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                        <Users className="w-12 h-12 mb-4 opacity-50" />
                        <p className="text-lg">لا يوجد عملاء حتى الآن</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="mt-4 px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
                        >
                            أضف العميل الأول
                        </button>
                    </div>
                )}
            </div>

            {/* Add Client Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => !isSubmitting && setShowAddModal(false)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#1e2336] border border-white/10 rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full" />
                        <h3 className="text-2xl font-black text-white mb-2 relative z-10">إضافة عميل جديد</h3>
                        <p className="text-slate-400 text-sm mb-6 relative z-10">قم بتسجيل بيانات العميل لإضافته إلى مكتبك. سيتم تعيين كلمة مرور افتراضية (123456).</p>

                        {error && (
                            <div className="p-3 mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleAddClient} className="space-y-4 relative z-10">
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">اسم العميل الرباعي</label>
                                <input
                                    type="text"
                                    required
                                    value={clientForm.name}
                                    onChange={e => setClientForm({ ...clientForm, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all text-white"
                                    placeholder="أدخل الاسم..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">رقم الهاتف</label>
                                <input
                                    type="text"
                                    required
                                    value={clientForm.phone}
                                    onChange={e => setClientForm({ ...clientForm, phone: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all text-white font-mono text-right"
                                    placeholder="مثال: 777123456"
                                    dir="ltr"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowAddModal(false); setClientForm({ name: '', phone: '' }); }}
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-all font-bold"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-[2] py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all shadow-lg shadow-emerald-500/25 font-bold disabled:opacity-50"
                                >
                                    {isSubmitting ? 'جاري الإضافة...' : 'إضافة العميل'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Edit Client Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => !isSubmitting && setShowEditModal(false)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#1e2336] border border-white/10 rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
                        <h3 className="text-2xl font-black text-white mb-2 relative z-10">تعديل بيانات العميل</h3>
                        <p className="text-slate-400 text-sm mb-6 relative z-10">تحديث معلومات الاتصال والاسم الخاص بالعميل.</p>

                        {error && (
                            <div className="p-3 mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleEditClient} className="space-y-4 relative z-10">
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">اسم العميل الرباعي</label>
                                <input
                                    type="text"
                                    required
                                    value={clientForm.name}
                                    onChange={e => setClientForm({ ...clientForm, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">رقم الهاتف</label>
                                <input
                                    type="text"
                                    required
                                    value={clientForm.phone}
                                    onChange={e => setClientForm({ ...clientForm, phone: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all text-white font-mono text-right"
                                    dir="ltr"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowEditModal(false); setClientForm({ name: '', phone: '' }); setEditingClient(null); }}
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-all font-bold"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-[2] py-3 px-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/25 font-bold disabled:opacity-50"
                                >
                                    {isSubmitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
};
