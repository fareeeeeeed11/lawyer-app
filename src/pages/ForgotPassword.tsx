import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, Key } from 'lucide-react';
import { motion } from 'motion/react';
import { getApiUrl } from '../config';

export const ForgotPassword = () => {
    const [phone, setPhone] = useState('');
    const [dob, setDob] = useState('');
    const [result, setResult] = useState<{ email?: string, password?: string } | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const res = await fetch(getApiUrl('/api/recover'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, dob })
            });

            if (res.ok) {
                const data = await res.json();
                setResult(data);
            } else {
                const data = await res.json();
                setError(data.error || 'البيانات المدخلة غير صحيحة');
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
                className="w-full max-w-md glass-panel p-8 rounded-3xl shadow-xl relative"
            >
                <Link to="/login" className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors">
                    <ArrowRight className="w-6 h-6" />
                </Link>

                <div className="flex flex-col items-center mb-8 mt-4">
                    <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4 shadow-sm shadow-indigo-200">
                        <Key className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 text-center">استعادة بيانات الدخول</h1>
                    <p className="text-slate-500 text-center mt-2 text-sm">أدخل رقم الهاتف وتاريخ الميلاد لاستعادة بيانات حساب المحامي</p>
                </div>

                {!result ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهاتف</label>
                            <input
                                type="text"
                                className="input-field dir-ltr text-right"
                                placeholder="777400733"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ الميلاد</label>
                            <input
                                type="text"
                                className="input-field dir-ltr text-right"
                                placeholder="19791979mm"
                                value={dob}
                                onChange={(e) => setDob(e.target.value)}
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
                            {loading ? 'جاري التحقق...' : 'استعادة'}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                            <h3 className="text-green-800 font-bold mb-3">بيانات الدخول الخاصة بك:</h3>
                            <div className="space-y-2">
                                <div>
                                    <span className="text-sm text-green-600 block">البريد الإلكتروني:</span>
                                    <span className="font-mono bg-white px-2 py-1 rounded text-slate-800 border border-green-200 block mt-1 select-all">{result.email}</span>
                                </div>
                                <div>
                                    <span className="text-sm text-green-600 block">كلمة المرور:</span>
                                    <span className="font-mono bg-white px-2 py-1 rounded text-slate-800 border border-green-200 block mt-1 select-all">{result.password}</span>
                                </div>
                            </div>
                        </div>

                        <Link to="/login" className="btn-primary w-full py-3 text-lg mt-4 inline-block text-center hover:opacity-90">
                            العودة لتسجيل الدخول
                        </Link>
                    </div>
                )}
            </motion.div>
        </div>
    );
};
