import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scale, AlertCircle, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../types';
import { getApiUrl } from '../config';

import { dataService } from '../services/dataService';

export const LoginPage = ({ onLogin }: { onLogin: (user: User) => void }) => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Check local users first
            const user = await dataService.login(identifier);
            
            if (user) {
                // Verify password locally
                if (user.password && user.password !== password) {
                    setError('كلمة المرور غير صحيحة');
                } else {
                    onLogin(user);
                }
            } else {
                setError('المستخدم غير موجود، تأكد من البريد أو رقم الهاتف');
            }
        } catch (err) {
            setError('حدث خطأ في الوصول للبيانات المحلية');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0e1a] bg-mesh relative overflow-hidden">
            {/* Decorative orbs */}
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px]" />

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-2xl glass-panel-strong p-12 rounded-[3rem] relative z-10"
            >
                <div className="flex flex-col items-center mb-10">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.2 }}
                        className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl flex items-center justify-center mb-5 shadow-2xl shadow-indigo-500/30 glow-indigo"
                    >
                        <Scale className="w-10 h-10 text-white" />
                    </motion.div>
                    <h1 className="text-3xl font-black text-white text-center mb-2">المحامي محمد أحمد الكامل</h1>
                    <p className="text-slate-400 font-medium text-lg">نظام الإدارة القانونية الرقمي</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                    {/* Security barrier for autocompletion */}
                    <input type="text" name="b_id" style={{ position: 'absolute', opacity: 0, height: 0 }} tabIndex={-1} />
                    <input type="password" name="b_ps" style={{ position: 'absolute', opacity: 0, height: 0 }} tabIndex={-1} />
                    
                    <div>
                        <label className="block text-sm font-bold text-slate-400 mb-3 mr-1">رقم الهاتف أو البريد الإلكتروني</label>
                        <input
                            name={`lawyer_u_${Math.random().toString(36).substring(7)}`}
                            type="text"
                            className="input-field py-4 px-6 text-lg w-full"
                            placeholder="أدخل المعرف (بريد أو هاتف)..."
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            required
                            autoComplete="off"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-400 mb-3 mr-1">كلمة المرور الشخصية</label>
                        <input
                            name={`lawyer_p_${Math.random().toString(36).substring(7)}`}
                            type="password"
                            className="input-field py-4 px-6 text-lg w-full"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                        />
                    </div>

                    {error && (
                        <div className="p-4 bg-red-500/10 text-red-400 rounded-2xl text-sm flex items-center gap-3 border border-red-500/20">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="font-bold">{error}</span>
                        </div>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={loading}
                        className="w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-black text-xl shadow-2xl shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all disabled:opacity-50 flex items-center justify-center gap-4 mt-4"
                    >
                        <Shield className="w-6 h-6" />
                        {loading ? 'جاري التحقق...' : 'دخول آمن للمنصة'}
                    </motion.button>
                </form>

                <div className="mt-10 pt-8 border-t border-white/5 text-center">
                    <Link to="/recover" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-bold tracking-wide">
                        🔐 هل تواجه مشكلة في الوصول؟
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};
