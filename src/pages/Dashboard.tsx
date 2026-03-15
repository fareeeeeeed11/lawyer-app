import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
    Search,
    Bell,
    Plus,
    Users,
    Briefcase,
    Calendar,
    ArrowUpRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { User, Case } from '../types';
import { getApiUrl } from '../config';
import { StatCard } from '../components/StatCard';
import { DashboardChart } from '../components/DashboardChart';
import { TaskWidget, ClientsWidget } from '../components/DashboardExtraPanels';

import { dataService } from '../services/dataService';

export const Dashboard = ({ user }: { user: User }) => {
    const [stats, setStats] = useState<any>({
        activeCases: 0,
        totalClients: 0,
        upcomingSessions: 0,
        recentClients: [],
        todayTasks: []
    });
    const [loading, setLoading] = useState(true);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{ cases: any[], clients: any[] }>({ cases: [], clients: [] });
    const [isSearching, setIsSearching] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    // Search Logic (Mocked locally for now)
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults({ cases: [], clients: [] });
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const allCases = await dataService.getCases(user.id);
                const allClients = await dataService.getUsers(); // Simplified
                
                const filteredCases = allCases.filter(c => c.title.includes(searchQuery));
                const filteredClients = allClients.filter(c => c.role === 'client' && c.name.includes(searchQuery));
                
                setSearchResults({ cases: filteredCases, clients: filteredClients });
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, user.id]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const data = await dataService.getStats(user.id);
                setStats(data);
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [user.id]);

    return (
        <div className="space-y-8 pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-white glow-text mb-2">
                        لوحة التحكم - أهلاً بك يا سيادة المحامي
                    </h1>
                    <p className="text-slate-400 font-medium">نظرة عامة على نشاط المكتب اليوم</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group z-50">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="بحث عن قضية أو عميل..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                            className="bg-white/5 border border-white/10 rounded-2xl py-3 pr-12 pl-6 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all w-64 md:w-80"
                        />

                        {/* Search Results Dropdown */}
                        {isSearchFocused && searchQuery.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute top-full mt-2 w-full bg-[#1e2336] border border-white/10 rounded-2xl shadow-xl shadow-black/50 overflow-hidden"
                            >
                                {isSearching ? (
                                    <div className="p-4 text-center text-slate-400 text-sm">جاري البحث...</div>
                                ) : searchResults.cases.length === 0 && searchResults.clients.length === 0 ? (
                                    <div className="p-4 text-center text-slate-400 text-sm">لا توجد نتائج مطابقة</div>
                                ) : (
                                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                        {searchResults.cases.length > 0 && (
                                            <div className="p-2">
                                                <div className="text-xs font-bold text-slate-500 mb-2 px-2">القضايا</div>
                                                {searchResults.cases.map((c: any) => (
                                                    <Link
                                                        key={`case-${c.id}`}
                                                        to={`/case/${c.id}`}
                                                        className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors"
                                                    >
                                                        <Briefcase className="w-4 h-4 text-indigo-400" />
                                                        <div>
                                                            <div className="text-sm text-white font-medium">{c.title}</div>
                                                            <div className="text-[10px] text-slate-500">{c.case_number} - {c.date}</div>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                        {searchResults.clients.length > 0 && (
                                            <div className="p-2 border-t border-white/5">
                                                <div className="text-xs font-bold text-slate-500 mb-2 px-2">العملاء</div>
                                                {searchResults.clients.map((c: any) => (
                                                    <Link
                                                        key={`client-${c.id}`}
                                                        to="/clients"
                                                        className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors"
                                                    >
                                                        <Users className="w-4 h-4 text-amber-400" />
                                                        <div>
                                                            <div className="text-sm text-white font-medium">{c.name}</div>
                                                            <div className="text-[10px] text-slate-500">{c.phone}</div>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>

                    {/* Notifications Dropdown */}
                    <div className="relative z-40">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-indigo-400 hover:bg-white/10 transition-all relative"
                        >
                            <Bell className="w-6 h-6" />
                            {stats.todayTasks?.length > 0 && (
                                <span className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#030712]" />
                            )}
                        </button>

                        {showNotifications && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className="absolute left-0 top-full mt-2 w-80 bg-[#1e2336] border border-white/10 rounded-2xl shadow-xl shadow-black/50 overflow-hidden"
                            >
                                <div className="p-4 border-b border-white/5 flex justify-between items-center">
                                    <h3 className="font-bold text-white text-sm">الإشعارات</h3>
                                    <span className="text-xs text-indigo-400">{stats.todayTasks?.length || 0} جديد</span>
                                </div>
                                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                    {stats.todayTasks?.length > 0 ? (
                                        stats.todayTasks.map((task: any) => (
                                            <div key={`notif-${task.id}`} className="p-4 hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors cursor-pointer">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                                                        <Calendar className="w-4 h-4 text-indigo-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-white font-medium leading-tight mb-1">تذكير: {task.title}</p>
                                                        <p className="text-xs text-slate-500">{task.time}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-slate-500 text-sm flex flex-col items-center">
                                            <Bell className="w-8 h-8 mb-2 opacity-50" />
                                            لا توجد إشعارات جديدة
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </div>
                    <div className="flex items-center gap-3 pr-4 border-r border-white/10">
                        <div className="text-left md:text-right">
                            <p className="font-bold text-white text-sm">{user.name}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">المحامي</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white/10">
                            <img
                                src={`https://ui-avatars.com/api/?name=${user.name}&background=6366f1&color=fff&bold=true`}
                                alt="U"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="القضايا النشطة"
                    value={stats.activeCases || 0}
                    icon={Briefcase}
                    percentage={stats.activeCases > 0 ? "+ 4.2% +" : ""}
                    trend={stats.activeCases > 0 ? "up" : "none"}
                    sparklineData={stats.activeCases > 0 ? [30, 45, 35, 60, 50, 80, 70] : []}
                />
                <StatCard
                    title="العملاء"
                    value={stats.totalClients || 0}
                    icon={Users}
                    percentage={stats.totalClients > 0 ? "+ 6.7% +" : ""}
                    trend={stats.totalClients > 0 ? "up" : "none"}
                    sparklineData={stats.totalClients > 0 ? [40, 50, 45, 70, 60, 90, 85] : []}
                />
                <StatCard
                    title="الجلسات القادمة"
                    value={stats.upcomingSessions || 0}
                    icon={Calendar}
                    percentage={stats.upcomingSessions > 0 ? "غداً: 09:00 ص" : ""}
                    trend={stats.upcomingSessions > 0 ? "up" : "none"}
                    sparklineData={stats.upcomingSessions > 0 ? [20, 30, 25, 40, 35, 50, 45] : []}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Chart Area */}
                <div className="lg:col-span-2 space-y-8">
                    <DashboardChart chartData={stats.chartInfo} />

                    {/* Recent Cases Section */}
                    <div className="glass-panel p-8 rounded-[2.5rem]">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black text-white">إجراءات سريعة</h3>
                            <Link to="/new-case" className="btn-primary-glow flex items-center gap-2">
                                <Plus className="w-5 h-5" />
                                <span>قضية جديدة</span>
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Link to="/new-case" className="group p-6 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-between hover:bg-white/10 transition-all cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                        <Briefcase className="w-6 h-6" />
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-white">إضافة قضية</p>
                                        <p className="text-[10px] text-slate-500">تسجيل ملف جديد فوراً</p>
                                    </div>
                                </div>
                                <ArrowUpRight className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
                            </Link>
                            <Link to="/calendar" className="group p-6 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-between hover:bg-white/10 transition-all cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-white">إضافة جلسة جديدة</p>
                                        <p className="text-[10px] text-slate-500">جدولة وتذكيرات الجلسات</p>
                                    </div>
                                </div>
                                <ArrowUpRight className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Right Panels */}
                <div className="space-y-8">
                    <TaskWidget tasks={stats.todayTasks || []} />
                    <ClientsWidget clients={stats.recentClients || []} />
                </div>
            </div>
        </div>
    );
};
