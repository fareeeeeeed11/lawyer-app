import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scale, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../types';
import { getApiUrl } from '../config';

export const LoginPage = ({ onLogin }: { onLogin: (user: User) => void }) => {
    const [identifier, setIdentifier] = useState(''); // Email or Phone
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch(getApiUrl('/api/login'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password })
            });

            if (res.ok) {
                const user = await res.json();
                onLogin(user);
            } else {
                const data = await res.json();
                setError(data.error || 'خطأ في بيانات الدخول');
            }
        } catch (err) {
            setError('حدث خطأ في الاتصال بالخادم');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-100 via-slate-50 to-slate-100">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md glass-panel p-8 rounded-3xl shadow-xl"
            >
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
                        <Scale className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 text-center">المحامي محمد أحمد الكامل</h1>
                    <p className="text-slate-500">نظام إدارة القضايا القانونية</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">البريد الإلكتروني أو رقم الهاتف</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="example@mail.com أو 05..."
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">كلمة المرور</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
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
                        className="btn-primary w-full py-3 text-lg mt-2"
                    >
                        {loading ? 'جاري التحميل...' : 'تسجيل الدخول'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-slate-500 mb-2">ليس لديك حساب؟ (للموكلين فقط)</p>
                    <Link to="/register" className="text-indigo-600 font-bold hover:underline">إنشاء حساب جديد</Link>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 text-center flex flex-col gap-3">
                    <Link to="/recover" className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors">
                        هل نسيت البريد الإلكتروني أو كلمة المرور؟
                    </Link>
                    <p className="text-xs text-slate-400">
                        حساب المحامي: mohammedalkamel@gmail.com
                    </p>
                </div>
            </motion.div>
        </div>
    );
};
