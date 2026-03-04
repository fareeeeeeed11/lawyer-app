import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, Briefcase, FileText, Scale, Clock, ChevronLeft, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { User, Case, LawyerStats } from '../types';
import { StatCard } from '../components/StatCard';
import { getApiUrl } from '../config';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const Dashboard = ({ user }: { user: User }) => {
    const [cases, setCases] = useState<Case[]>([]);
    const [stats, setStats] = useState<LawyerStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [casesRes, statsRes] = await Promise.all([
                    fetch(getApiUrl(`/api/cases?userId=${user.id}&role=${user.role}`)),
                    user.role === 'lawyer' ? fetch(getApiUrl(`/api/cases/stats/lawyer/${user.id}`)) : Promise.resolve(null)
                ]);

                const casesData = await casesRes.json();
                setCases(casesData);

                if (statsRes) {
                    const statsData = await statsRes.json();
                    setStats(statsData);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">أهلاً بك، {user.name}</h1>
                    <p className="text-slate-500">إليك ملخص لأهم التحديثات في قضاياك</p>
                </div>
                {user.role === 'lawyer' && (
                    <Link to="/new-case" className="btn-primary flex items-center gap-2 shadow-lg shadow-indigo-200">
                        <Plus className="w-5 h-5" />
                        <span>إضافة قضية جديدة</span>
                    </Link>
                )}
            </header>

            {user.role === 'lawyer' && stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        title="القضايا النشطة"
                        value={stats.activeCases}
                        icon={Briefcase}
                        color="bg-blue-500"
                    />
                    <StatCard
                        title="إجمالي الموكلين"
                        value={stats.totalClients}
                        icon={Users}
                        color="bg-emerald-500"
                    />
                    <StatCard
                        title="الجلسات القادمة"
                        value={stats.upcomingSessions}
                        icon={Calendar}
                        color="bg-amber-500"
                    />
                </div>
            )}

            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        <span>القضايا الحالية</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cases.length > 0 ? (
                        cases.map((c) => (
                            <Link key={c.id} to={`/case/${c.id}`}>
                                <motion.div
                                    whileHover={{ y: -4 }}
                                    className="glass-panel p-6 rounded-2xl hover:border-indigo-300 transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                                            #{c.case_number}
                                        </span>
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-xs font-bold",
                                            c.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                                        )}>
                                            {c.status === 'active' ? 'نشطة' : 'منتهية'}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                                        {c.title}
                                    </h3>
                                    <div className="space-y-2 text-sm text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            <span>{user.role === 'lawyer' ? `الموكل: ${c.client_name}` : `المحامي: ${c.lawyer_name}`}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Scale className="w-4 h-4" />
                                            <span>{c.court}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            <span>{format(new Date(c.created_at), 'dd MMMM yyyy', { locale: ar })}</span>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex justify-end">
                                        <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                            <ChevronLeft className="w-5 h-5" />
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center glass-panel rounded-2xl">
                            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500">لا توجد قضايا مضافة حالياً</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};
