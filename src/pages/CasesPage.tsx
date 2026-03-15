import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Briefcase, Search, Plus, ExternalLink, Activity, ArrowUpRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { User } from '../types';
import { getApiUrl } from '../config';

import { dataService } from '../services/dataService';

export const CasesPage = ({ user }: { user: User }) => {
    const [cases, setCases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCases = async () => {
            try {
                const data = await dataService.getCases(user.id);
                setCases(data);
            } catch (e) {
                console.error("Error fetching cases", e);
            } finally {
                setLoading(false);
            }
        };
        fetchCases();
    }, [user.id]);

    const filteredCases = cases.filter(c =>
        (c.title || '').includes(search) ||
        (c.case_number || '').includes(search) ||
        (c.client_name || '').includes(search)
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-l from-white to-slate-400 mb-2">
                        القضايا
                    </h1>
                    <p className="text-slate-400 font-medium">إدارة جميع القضايا الموكلة إليك</p>
                </div>

                <div className="flex gap-4 items-center">
                    <div className="relative">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="بحث برقم أو اسم..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-2xl py-3 pr-12 pl-6 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all w-full md:w-64"
                        />
                    </div>
                    <button
                        onClick={() => navigate('/new-case')}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl transition-all shadow-lg shadow-indigo-500/25 font-bold"
                    >
                        <Plus className="w-5 h-5" />
                        <span>قضية جديدة</span>
                    </button>
                </div>
            </div>

            {/* Cases Grid */}
            <div className="glass-panel p-6 rounded-[2.5rem]">
                {loading ? (
                    <div className="h-64 flex items-center justify-center text-slate-400">جاري التحميل...</div>
                ) : filteredCases.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCases.map((c: any) => (
                            <Link key={c.id} to={`/case/${c.id}`}>
                                <motion.div
                                    whileHover={{ y: -5 }}
                                    className="p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-colors group relative overflow-hidden"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl">
                                            <Briefcase className="w-6 h-6" />
                                        </div>
                                        <span className={`px-3 py-1 rounded-xl text-xs font-bold ${c.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                                            c.status === 'closed' ? 'bg-rose-500/20 text-rose-400' :
                                                'bg-amber-500/20 text-amber-400'
                                            }`}>
                                            {c.status === 'active' ? 'نشطة' : c.status === 'closed' ? 'مغلقة' : 'قيد الانتظار'}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-2 leading-tight">{c.title}</h3>
                                    <p className="text-slate-400 text-sm mb-6 line-clamp-2">
                                        {c.type} • {c.court}
                                    </p>

                                    <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                                                <img src={`https://ui-avatars.com/api/?name=${c.client_name}&background=334155&color=fff`} className="w-full h-full object-cover" />
                                            </div>
                                            <span className="text-sm font-medium text-slate-300">
                                                {c.client_name}
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-500 font-medium font-mono bg-black/20 px-2 py-1 rounded-md">
                                            #{c.case_number}
                                        </div>
                                    </div>

                                    {/* Hover Arrow */}
                                    <div className="absolute top-6 left-6 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all">
                                        <ArrowUpRight className="w-5 h-5 text-indigo-400" />
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                        <Briefcase className="w-12 h-12 mb-4 opacity-50" />
                        <p className="text-lg">لا توجد قضايا حتى الآن</p>
                        <button
                            onClick={() => navigate('/new-case')}
                            className="mt-4 px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
                        >
                            أضف قضيتك الأولى
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
