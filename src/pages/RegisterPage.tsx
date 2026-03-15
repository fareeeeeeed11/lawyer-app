import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../types';
import { db } from '../db';

export const RegisterPage = ({ onLogin }: { onLogin: (user: User) => void }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
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
            // Check if email already exists locally
            const existing = await db.users.where('email').equals(formData.email).first();
            if (existing) {
                setError('هذا البريد مسجل بالفعل');
                setLoading(false);
                return;
            }

            const id = await db.users.add({
                ...formData,
                role: 'lawyer'
            } as User);

            const user = { ...formData, id, role: 'lawyer' as const };
            onLogin(user as User);
            navigate('/');
        } catch (err) {
            setError('حدث خطأ في إنشاء الحساب');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0e1a] bg-mesh relative overflow-hidden">
            <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px]" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md glass-panel-strong p-10 rounded-[2.5rem] relative z-10"
            >
                <div className="flex flex-col items-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.2 }}
                        className="w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-2xl shadow-violet-500/30"
                    >
                        <UserPlus className="w-8 h-8 text-white" />
                    </motion.div>
                    <h1 className="text-2xl font-black text-white">إنشاء حساب جديد</h1>
                    <p className="text-slate-500 mt-1 font-medium">قم بتسجيل حسابك لإدارة قضاياك</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-400 mb-2">الاسم الكامل</label>
                        <input type="text" className="input-field" required value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-400 mb-2">البريد الإلكتروني</label>
                        <input type="email" className="input-field" required value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-400 mb-2">كلمة المرور</label>
                        <input type="password" className="input-field" required value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })} />
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
                        className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-black text-lg shadow-2xl shadow-violet-500/20 transition-all disabled:opacity-50"
                    >
                        {loading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
                    </motion.button>
                </form>

                <div className="mt-6 text-center">
                    <Link to="/login" className="text-slate-500 hover:text-indigo-400 text-sm transition-colors">لديك حساب بالفعل؟ سجل دخولك</Link>
                </div>
            </motion.div>
        </div>
    );
};
