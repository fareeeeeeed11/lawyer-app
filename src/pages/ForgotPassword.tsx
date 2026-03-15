import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, Key } from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../db';

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
            // Search locally in IndexedDB
            const user = await db.users
                .filter(u => u.phone === phone)
                .first();

            if (user) {
                setResult({
                    email: user.email,
                    password: user.password || '(كلمة المرور مشفرة)'
                });
            } else {
                setError('لم يتم العثور على حساب بهذا الرقم');
            }
        } catch (err) {
            setError('حدث خطأ في البحث في البيانات المحلية');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0e1a] bg-mesh relative overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md glass-panel-strong p-10 rounded-[2.5rem] relative z-10"
            >
                <Link to="/login" className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-xl">
                    <ArrowRight className="w-6 h-6" />
                </Link>

                <div className="flex flex-col items-center mb-8 mt-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mb-4 shadow-2xl shadow-amber-500/20">
                        <Key className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-xl font-black text-white text-center">استعادة بيانات الدخول</h1>
                    <p className="text-slate-500 text-center mt-2 text-sm font-medium">أدخل رقم الهاتف وتاريخ الميلاد لاستعادة بيانات حساب المحامي</p>
                </div>

                {!result ? (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-400 mb-2">رقم الهاتف</label>
                            <input type="text" className="input-field dir-ltr text-right" placeholder="777400733"
                                value={phone} onChange={(e) => setPhone(e.target.value)} required />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-400 mb-2">تاريخ الميلاد</label>
                            <input type="text" className="input-field dir-ltr text-right" placeholder="19791979mm"
                                value={dob} onChange={(e) => setDob(e.target.value)} required />
                        </div>

                        {error && (
                            <div className="p-4 bg-red-500/10 text-red-400 rounded-2xl text-sm flex items-center gap-2 border border-red-500/20">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl font-black text-lg shadow-2xl shadow-amber-500/20 transition-all disabled:opacity-50"
                        >
                            {loading ? 'جاري التحقق...' : 'استعادة البيانات'}
                        </motion.button>
                    </form>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                        <div className="p-6 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                            <h3 className="text-emerald-400 font-black mb-4">بيانات الدخول الخاصة بك:</h3>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-sm text-emerald-400/70 block mb-1">البريد الإلكتروني:</span>
                                    <span className="font-mono bg-white/5 px-4 py-2 rounded-xl text-white border border-white/5 block select-all">{result.email}</span>
                                </div>
                                <div>
                                    <span className="text-sm text-emerald-400/70 block mb-1">كلمة المرور:</span>
                                    <span className="font-mono bg-white/5 px-4 py-2 rounded-xl text-white border border-white/5 block select-all">{result.password}</span>
                                </div>
                            </div>
                        </div>

                        <Link to="/login" className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black rounded-2xl text-center shadow-2xl shadow-indigo-500/20 block">
                            العودة لتسجيل الدخول
                        </Link>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};
