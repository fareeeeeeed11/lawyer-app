import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Home,
    Briefcase,
    Users,
    Calendar,
    FileText,
    Settings,
    LogOut,
    Scale,
    X
} from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../types';
import { db } from '../db';

export const Sidebar = ({ user, onLogout }: { user: User | null, onLogout: () => void }) => {
    const location = useLocation();
    if (!user) return null;

    const navItems = [
        { icon: Home, label: 'الرئيسية', path: '/' },
        { icon: Briefcase, label: 'القضايا', path: '/cases' },
        { icon: Users, label: 'العملاء', path: '/clients' },
        { icon: Calendar, label: 'التقويم', path: '/calendar' },
        { icon: FileText, label: 'الوثائق', path: '/documents' },
    ];

    const [showSettings, setShowSettings] = React.useState(false);
    const [editMode, setEditMode] = React.useState(false);
    const [settingsForm, setSettingsForm] = React.useState({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        password: '',
        newPassword: ''
    });
    const [isSaving, setIsSaving] = React.useState(false);
    const [saveMsg, setSaveMsg] = React.useState('');

    const handleSaveSettings = async () => {
        setIsSaving(true);
        setSaveMsg('');
        try {
            const updateData: any = {
                name: settingsForm.name,
                email: settingsForm.email,
                phone: settingsForm.phone
            };

            // If user wants to change password
            if (settingsForm.newPassword) {
                updateData.password = settingsForm.newPassword;
            }

            await db.users.update(user.id!, updateData);

            // Update localStorage
            const updatedUser = { ...user, ...updateData };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            setSaveMsg('تم حفظ التغييرات بنجاح ✅');
            setEditMode(false);

            // Reload after 1 second to apply changes
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            console.error(error);
            setSaveMsg('حدث خطأ أثناء الحفظ');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            {/* ===== MOBILE: Bottom Tab Bar ===== */}
            <div className="fixed bottom-0 left-0 right-0 z-[100] glass-bottom-bar flex items-center justify-around py-2 px-1 md:hidden safe-area-bottom">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className="relative flex flex-col items-center gap-0.5 flex-1"
                        >
                            <div className={`p-2 rounded-xl transition-all duration-300 ${isActive
                                ? 'bg-indigo-500/20 text-indigo-400'
                                : 'text-slate-500'
                                }`}>
                                <item.icon className="w-5 h-5" />
                            </div>
                            <span className={`text-[9px] font-bold ${isActive ? 'text-indigo-400' : 'text-slate-500'}`}>
                                {item.label}
                            </span>
                            {isActive && (
                                <motion.div
                                    layoutId="active-mobile-nav"
                                    className="absolute -bottom-1 left-1/4 right-1/4 h-0.5 bg-indigo-500 rounded-full"
                                />
                            )}
                        </Link>
                    );
                })}
                {/* Settings button in bottom bar */}
                <button
                    onClick={() => setShowSettings(true)}
                    className="relative flex flex-col items-center gap-0.5 flex-1"
                >
                    <div className="p-2 rounded-xl text-slate-500">
                        <Settings className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-bold text-slate-500">إعدادات</span>
                </button>
            </div>

            {/* ===== DESKTOP: Right Sidebar ===== */}
            <div className="hidden md:flex fixed right-0 top-0 h-screen w-20 md:w-24 glass-sidebar z-[100] flex-col py-8 items-center border-l border-white/5">
                {/* Logo */}
                <Link to="/" className="mb-12">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl shadow-lg shadow-indigo-500/30">
                        <Scale className="w-6 h-6 text-white" />
                    </div>
                </Link>

                {/* Nav Items */}
                <div className="flex-1 flex flex-col gap-6 w-full">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className="relative group w-full flex flex-col items-center gap-1 group"
                            >
                                <div className={`p-3 rounded-xl transition-all duration-300 ${isActive
                                    ? 'bg-indigo-500/20 text-indigo-400'
                                    : 'text-slate-500 group-hover:bg-white/5 group-hover:text-slate-300'
                                    }`}>
                                    <item.icon className="w-6 h-6" />
                                </div>
                                <span className={`text-[10px] font-bold ${isActive ? 'text-indigo-400' : 'text-slate-500'} group-hover:text-slate-300`}>
                                    {item.label}
                                </span>
                                {isActive && (
                                    <motion.div
                                        layoutId="active-nav"
                                        className="absolute right-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-full"
                                    />
                                )}
                            </Link>
                        )
                    })}
                </div>

                {/* Bottom Actions */}
                <div className="mt-auto flex flex-col gap-6 w-full items-center">
                    <button
                        onClick={() => setShowSettings(true)}
                        className="relative group w-full flex flex-col items-center gap-1"
                    >
                        <div className="p-3 rounded-xl text-slate-500 group-hover:bg-white/5 group-hover:text-slate-300 transition-all">
                            <Settings className="w-6 h-6" />
                        </div>
                    </button>
                    <button
                        onClick={onLogout}
                        className="p-3 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="تسجيل الخروج"
                    >
                        <LogOut className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* ===== Settings Modal (Full Screen on Mobile) ===== */}
            {showSettings && (
                <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowSettings(false)}>
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#111827] border border-white/10 rounded-t-3xl md:rounded-2xl p-6 w-full md:max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-white">⚙️ إعدادات الحساب</h3>
                            <button onClick={() => setShowSettings(false)} className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Profile Header */}
                        <div className="flex items-center gap-4 mb-6 p-4 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 rounded-2xl border border-indigo-500/20">
                            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <Scale className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <p className="text-white font-bold text-lg">{user.name}</p>
                                <p className="text-slate-400 text-sm">محامي</p>
                            </div>
                        </div>

                        {/* Settings Fields */}
                        <div className="space-y-4">
                            <div className="p-4 bg-white/5 rounded-xl">
                                <p className="text-sm text-slate-400 mb-1">الاسم</p>
                                {editMode ? (
                                    <input
                                        type="text"
                                        value={settingsForm.name}
                                        onChange={e => setSettingsForm({ ...settingsForm, name: e.target.value })}
                                        className="w-full bg-transparent border-b border-indigo-500 text-white outline-none py-1"
                                    />
                                ) : (
                                    <p className="text-white font-medium">{user.name}</p>
                                )}
                            </div>

                            <div className="p-4 bg-white/5 rounded-xl">
                                <p className="text-sm text-slate-400 mb-1">البريد الإلكتروني</p>
                                {editMode ? (
                                    <input
                                        type="email"
                                        value={settingsForm.email}
                                        onChange={e => setSettingsForm({ ...settingsForm, email: e.target.value })}
                                        className="w-full bg-transparent border-b border-indigo-500 text-white outline-none py-1"
                                        dir="ltr"
                                    />
                                ) : (
                                    <p className="text-white font-medium" dir="ltr">{user.email}</p>
                                )}
                            </div>

                            <div className="p-4 bg-white/5 rounded-xl">
                                <p className="text-sm text-slate-400 mb-1">رقم الهاتف</p>
                                {editMode ? (
                                    <input
                                        type="tel"
                                        value={settingsForm.phone}
                                        onChange={e => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                                        className="w-full bg-transparent border-b border-indigo-500 text-white outline-none py-1"
                                        dir="ltr"
                                    />
                                ) : (
                                    <p className="text-white font-medium" dir="ltr">{user.phone || 'غير محدد'}</p>
                                )}
                            </div>

                            {editMode && (
                                <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/20">
                                    <p className="text-sm text-amber-400 mb-1">🔑 كلمة مرور جديدة (اختياري)</p>
                                    <input
                                        type="password"
                                        value={settingsForm.newPassword}
                                        onChange={e => setSettingsForm({ ...settingsForm, newPassword: e.target.value })}
                                        placeholder="اتركها فارغة إذا لا تريد التغيير"
                                        className="w-full bg-transparent border-b border-amber-500/50 text-white outline-none py-1 placeholder-slate-600"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Save Message */}
                        {saveMsg && (
                            <div className={`mt-4 p-3 rounded-xl text-center text-sm font-bold ${saveMsg.includes('✅') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                {saveMsg}
                            </div>
                        )}

                        {/* Actions */}
                        {editMode ? (
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleSaveSettings}
                                    disabled={isSaving}
                                    className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-bold shadow-lg"
                                >
                                    {isSaving ? "جاري الحفظ..." : "💾 حفظ التغييرات"}
                                </button>
                                <button
                                    onClick={() => setEditMode(false)}
                                    className="flex-1 py-3 bg-white/5 text-white rounded-xl font-medium border border-white/10"
                                >
                                    إلغاء
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3 mt-6">
                                <button
                                    onClick={() => setEditMode(true)}
                                    className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-bold shadow-lg"
                                >
                                    ✏️ تعديل البيانات
                                </button>
                                <button
                                    onClick={() => { setShowSettings(false); onLogout(); }}
                                    className="w-full py-3 bg-red-500/10 text-red-400 rounded-xl font-bold border border-red-500/20 md:hidden"
                                >
                                    🚪 تسجيل الخروج
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </>
    );
};
