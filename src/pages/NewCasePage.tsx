import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { User } from '../types';
import { getApiUrl } from '../config';

export const NewCasePage = ({ user }: { user: User }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        case_number: '',
        title: '',
        court: '',
        type: 'جنائية',
        client_name: '',
        client_email: '',
        fees: 0,
        currency: 'ر.س'
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(getApiUrl('/api/cases'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, lawyer_id: user.id })
            });
            if (res.ok) {
                navigate('/');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-8">
            <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-6 transition-colors">
                <ChevronLeft className="w-5 h-5 rotate-180" />
                <span>العودة للرئيسية</span>
            </Link>

            <div className="glass-panel p-8 rounded-3xl">
                <h1 className="text-2xl font-bold text-slate-900 mb-6">إضافة قضية جديدة</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">رقم القضية</label>
                            <input
                                type="text"
                                className="input-field"
                                required
                                value={formData.case_number}
                                onChange={e => setFormData({ ...formData, case_number: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">نوع القضية</label>
                            <select
                                className="input-field"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option>جنائية</option>
                                <option>مدنية</option>
                                <option>أحوال شخصية</option>
                                <option>تجارية</option>
                                <option>عمالية</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">عنوان القضية</label>
                        <input
                            type="text"
                            className="input-field"
                            required
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">المحكمة</label>
                        <input
                            type="text"
                            className="input-field"
                            required
                            value={formData.court}
                            onChange={e => setFormData({ ...formData, court: e.target.value })}
                        />
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">بيانات الموكل</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">اسم الموكل</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    required
                                    value={formData.client_name}
                                    onChange={e => setFormData({ ...formData, client_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">البريد الإلكتروني للموكل</label>
                                <input
                                    type="email"
                                    className="input-field"
                                    required
                                    value={formData.client_email}
                                    onChange={e => setFormData({ ...formData, client_email: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">الأتعاب المالية</h3>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">إجمالي الأتعاب المتفق عليها</label>
                            <div className="relative group flex">
                                <input
                                    type="number"
                                    className="input-field flex-1 pl-32 h-14 text-lg font-bold"
                                    placeholder="0.00"
                                    value={formData.fees}
                                    onChange={e => setFormData({ ...formData, fees: Number(e.target.value) })}
                                />
                                <div className="absolute left-2 top-2 bottom-2 w-28 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden group-focus-within:border-indigo-300 transition-colors">
                                    <select
                                        className="w-full h-full bg-transparent px-2 text-xs font-bold text-slate-600 outline-none cursor-pointer appearance-none text-center"
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
                                        <option value="دينار بحريني">دينار بحريني</option>
                                        <option value="ريال عماني">ريال عماني</option>
                                        <option value="ريال قطري">ريال قطري</option>
                                        <option value="دينار أردني">دينار أردني</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <Link to="/" className="btn-secondary">إلغاء</Link>
                        <button type="submit" disabled={loading} className="btn-primary px-8">
                            {loading ? 'جاري الحفظ...' : 'حفظ القضية'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
