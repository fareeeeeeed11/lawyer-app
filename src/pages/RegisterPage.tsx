import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { getApiUrl } from '../config';
import { User } from '../types';

export const RegisterPage = ({ onLogin }: { onLogin: (user: User) => void }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch(getApiUrl('/api/register'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                const user = await res.json();
                onLogin(user);
                navigate('/');
            } else {
                const data = await res.json();
                setError(data.error || 'خطأ في إنشاء الحساب');
            }
        } catch (err) {
            setError('حدث خطأ في الاتصال بالخادم');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md glass-panel p-8 rounded-3xl shadow-xl"
            >
                <h1 className="text-2xl font-bold text-slate-900 mb-2">إنشاء حساب موكل جديد</h1>
                <p className="text-slate-500 mb-8">يرجى إدخال بياناتك لمتابعة قضاياك</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">الاسم الكامل</label>
                        <input
                            type="text"
                            className="input-field"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">البريد الإلكتروني</label>
                        <input
                            type="email"
                            className="input-field"
                            required
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهاتف</label>
                        <input
                            type="tel"
                            className="input-field"
                            required
                            placeholder="05XXXXXXXX"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">كلمة المرور</label>
                        <input
                            type="password"
                            className="input-field"
                            required
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full py-3 mt-2"
                    >
                        {loading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link to="/login" className="text-slate-500 hover:text-indigo-600 text-sm">لديك حساب بالفعل؟ سجل دخولك</Link>
                </div>
            </motion.div>
        </div>
    );
};
