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
    Scale
} from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../types';

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

    // Settings Edit State
    const [editMode, setEditMode] = React.useState(false);
    const [settingsForm, setSettingsForm] = React.useState({ name: user.name, email: user.email, phone: user.phone || '' });
    const [isSaving, setIsSaving] = React.useState(false);

    const handleSaveSettings = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`http://localhost:3000/api/users/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settingsForm)
            });
            if (res.ok) {
                // Update local storage and reload ideally, or wait for context update.
                // Since user state is in App.tsx, we can alert the user to re-login to see changes
                // for simplicity or trigger a reload.
                alert("تم تحديث البيانات بنجاح. يرجى تسجيل الدخول مجدداً لتطبيق التغييرات.");
                setEditMode(false);
                setShowSettings(false);
                onLogout();
            } else {
                alert("حدث خطأ أثناء التحديث");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <div className="fixed right-0 top-0 h-screen w-20 md:w-24 glass-sidebar z-[100] flex flex-col py-8 items-center border-l border-white/5">
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

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowSettings(false)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#1e2336] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">إعدادات الحساب</h3>
                            {!editMode && (
                                <button onClick={() => setEditMode(true)} className="text-indigo-400 text-sm hover:text-indigo-300">
                                    تعديل
                                </button>
                            )}
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 bg-white/5 rounded-xl">
                                <p className="text-sm text-slate-400">الاسم</p>
                                {editMode ? (
                                    <input
                                        type="text"
                                        value={settingsForm.name}
                                        onChange={e => setSettingsForm({ ...settingsForm, name: e.target.value })}
                                        className="w-full bg-transparent border-b border-indigo-500 text-white outline-none mt-1"
                                    />
                                ) : (
                                    <p className="text-white font-medium">{user.name}</p>
                                )}
                            </div>
                            <div className="p-4 bg-white/5 rounded-xl">
                                <p className="text-sm text-slate-400">البريد الإلكتروني</p>
                                {editMode ? (
                                    <input
                                        type="email"
                                        value={settingsForm.email}
                                        onChange={e => setSettingsForm({ ...settingsForm, email: e.target.value })}
                                        className="w-full bg-transparent border-b border-indigo-500 text-white outline-none mt-1"
                                    />
                                ) : (
                                    <p className="text-white font-medium">{user.email}</p>
                                )}
                            </div>
                        </div>
                        {editMode ? (
                            <div className="flex gap-2 mt-6">
                                <button
                                    onClick={handleSaveSettings}
                                    disabled={isSaving}
                                    className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-colors font-medium"
                                >
                                    {isSaving ? "جاري الحفظ..." : "حفظ"}
                                </button>
                                <button
                                    onClick={() => setEditMode(false)}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors font-medium border border-white/10"
                                >
                                    إلغاء
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowSettings(false)}
                                className="mt-6 w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors font-medium"
                            >
                                إغلاق
                            </button>
                        )}
                    </motion.div>
                </div>
            )}
        </>
    );
};
