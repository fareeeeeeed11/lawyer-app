import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Scale, Briefcase } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../types';

import { dataService } from '../services/dataService';

export const NewCasePage = ({ user }: { user: User }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        case_number: '',
        title: '',
        court: '',
        type: 'جنائية',
        client_id: null as number | null,
        client_name: '',
        client_phone: '',
        fees: '' as string | number,
        currency: 'ريال سعودي'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [clients, setClients] = useState<any[]>([]);
    const [showNameDropdown, setShowNameDropdown] = useState(false);
    const [showPhoneDropdown, setShowPhoneDropdown] = useState(false);

    React.useEffect(() => {
        const fetchClients = async () => {
            try {
                const data = await dataService.getClients(user.id);
                setClients(data);
            } catch (err) {
                console.error("Failed to fetch clients", err);
            }
        };
        fetchClients();
    }, [user.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await dataService.addCase({
                ...formData,
                lawyer_id: user.id
            } as any);
            navigate('/');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'حدث خطأ أثناء حفظ القضية');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-indigo-400 mb-6 transition-colors">
                <ChevronLeft className="w-5 h-5 rotate-180" />
                <span>العودة للرئيسية</span>
            </Link>

            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative p-8 rounded-[2rem] overflow-hidden mb-8"
            >
                <div className="absolute inset-0 glass-panel rounded-[2rem]" />
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/15 to-violet-600/10" />
                <div className="absolute -right-10 -top-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl" />

                <div className="relative z-10 flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl shadow-lg shadow-indigo-500/20">
                        <Briefcase className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white">إضافة قضية جديدة</h1>
                        <p className="text-slate-500 font-medium">قم بتعبئة البيانات أدناه لفتح ملف قضية جديد</p>
                    </div>
                </div>
            </motion.header>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-panel p-8 md:p-10 rounded-[2rem]"
            >
                <form onSubmit={handleSubmit} className="space-y-8">
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 font-bold text-sm">
                            {error}
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-400 mb-2">رقم القضية</label>
                            <input type="text" className="input-field" required
                                value={formData.case_number}
                                onChange={e => setFormData({ ...formData, case_number: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-400 mb-2">نوع القضية</label>
                            <select className="input-field" value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                <option>جنائية</option>
                                <option>مدنية</option>
                                <option>أحوال شخصية</option>
                                <option>تجارية</option>
                                <option>عمالية</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-400 mb-2">عنوان القضية</label>
                        <input type="text" className="input-field" required
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })} />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-400 mb-2">المحكمة</label>
                        <input type="text" className="input-field" required
                            value={formData.court}
                            onChange={e => setFormData({ ...formData, court: e.target.value })} />
                    </div>

                    {/* Client Section */}
                    <div className="space-y-6 pt-6 border-t border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                <Scale className="w-5 h-5 text-emerald-400" />
                            </div>
                            <h3 className="text-lg font-black text-white">بيانات الموكل</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="relative">
                                <label className="block text-sm font-bold text-slate-400 mb-2">اسم الموكل</label>
                                <input type="text" className="input-field" required
                                    value={formData.client_name}
                                    onFocus={() => setShowNameDropdown(true)}
                                    onBlur={() => setTimeout(() => setShowNameDropdown(false), 200)}
                                    onChange={e => setFormData({ ...formData, client_name: e.target.value, client_id: null })} />
                                {showNameDropdown && clients.filter(c => c.name.includes(formData.client_name) && c.name !== formData.client_name).length > 0 && (
                                    <div className="absolute z-50 w-full mt-2 bg-[#1e2336] border border-white/10 rounded-2xl shadow-xl shadow-black/50 overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                                        {clients.filter(c => c.name.includes(formData.client_name) && c.name !== formData.client_name).map(client => (
                                            <div
                                                key={client.id}
                                                className="px-4 py-3 hover:bg-white/5 cursor-pointer flex justify-between items-center transition-colors"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    setFormData({ ...formData, client_id: client.id, client_name: client.name, client_phone: client.phone || '' });
                                                    setShowNameDropdown(false);
                                                }}
                                            >
                                                <span className="text-white font-medium">{client.name}</span>
                                                <span className="text-xs text-slate-500">{client.phone}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="relative">
                                <label className="block text-sm font-bold text-slate-400 mb-2">رقم هاتف الموكل</label>
                                <input type="tel" className="input-field" required
                                    value={formData.client_phone}
                                    onFocus={() => setShowPhoneDropdown(true)}
                                    onBlur={() => setTimeout(() => setShowPhoneDropdown(false), 200)}
                                    onChange={e => setFormData({ ...formData, client_phone: e.target.value, client_id: null })} />
                                {showPhoneDropdown && clients.filter(c => (c.phone || '').includes(formData.client_phone) && c.phone !== formData.client_phone).length > 0 && (
                                    <div className="absolute z-50 w-full mt-2 bg-[#1e2336] border border-white/10 rounded-2xl shadow-xl shadow-black/50 overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                                        {clients.filter(c => (c.phone || '').includes(formData.client_phone) && c.phone !== formData.client_phone).map(client => (
                                            <div
                                                key={client.id}
                                                className="px-4 py-3 hover:bg-white/5 cursor-pointer flex gap-3 items-center transition-colors"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    setFormData({ ...formData, client_id: client.id, client_name: client.name, client_phone: client.phone || '' });
                                                    setShowPhoneDropdown(false);
                                                }}
                                            >
                                                <span className="text-white font-medium">{client.phone}</span>
                                                <span className="text-xs text-slate-500">{client.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Fees Section */}
                    <div className="space-y-6 pt-6 border-t border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                <Scale className="w-5 h-5 text-amber-400" />
                            </div>
                            <h3 className="text-lg font-black text-white">الأتعاب المالية</h3>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-400 mb-2">إجمالي الأتعاب المتفق عليها</label>
                            <div className="relative flex items-center">
                                <input
                                    type="number"
                                    className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 text-2xl font-black text-white outline-none transition-all placeholder-slate-600 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                                    placeholder="0.00"
                                    value={formData.fees}
                                    onChange={e => setFormData({ ...formData, fees: Number(e.target.value) })}
                                />
                                <div className="absolute left-3 p-2 bg-white/5 border border-white/10 rounded-xl">
                                    <select
                                        className="bg-transparent px-2 py-1 font-black text-xs text-indigo-400 outline-none cursor-pointer appearance-none"
                                        value={formData.currency}
                                        onChange={e => setFormData({ ...formData, currency: e.target.value })}
                                    >
                                        <option value="ريال سعودي">ريال سعودي</option>
                                        <option value="ريال يمني">ريال يمني</option>
                                        <option value="دولار">دولار</option>
                                        <option value="يورو">يورو</option>
                                        <option value="درهم إماراتي">درهم إماراتي</option>
                                        <option value="دينار كويتي">دينار كويتي</option>
                                        <option value="جنية مصري">جنية مصري</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end gap-4 pt-6 border-t border-white/5">
                        <Link to="/" className="px-8 py-4 text-slate-400 font-bold hover:bg-white/5 rounded-2xl transition-all">إلغاء</Link>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="px-10 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black rounded-2xl shadow-2xl shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all disabled:opacity-50"
                        >
                            {loading ? 'جاري الحفظ...' : 'اعتماد وحفظ القضية'}
                        </motion.button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};
