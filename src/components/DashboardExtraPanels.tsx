import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Circle, ChevronLeft, User, MoreHorizontal } from 'lucide-react';

export const TaskWidget = ({ tasks }: { tasks: any[] }) => {
    return (
        <div className="glass-panel p-6 rounded-[2.5rem] flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-white">المهام اليومية</h3>
                <button className="text-slate-500 hover:text-white transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-4 flex-1">
                {tasks.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-500 text-sm h-32">
                        لا توجد مهام حالياً
                    </div>
                ) : (
                    tasks.map(task => (
                        <div key={task.id} className={`p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between border-r-4 ${task.color} hover:bg-white/8 transition-all cursor-pointer group`}>
                            <div>
                                <p className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">{task.title}</p>
                                <p className="text-[10px] text-slate-500 mt-1">{task.time}</p>
                            </div>
                            <Circle className="w-5 h-5 text-slate-600 group-hover:text-indigo-500 transition-colors" />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export const ClientsWidget = ({ clients }: { clients: any[] }) => {
    return (
        <div className="glass-panel p-6 rounded-[2.5rem] flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-white">العملاء</h3>
                <div className="flex gap-2">
                    <button className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all">
                        <ChevronLeft className="w-4 h-4 rotate-180" />
                    </button>
                    <button className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="space-y-4 flex-1">
                {clients.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-500 text-sm h-32">
                        لا يوجد عملاء مضافين بعد
                    </div>
                ) : (
                    clients.map(client => (
                        <div key={client.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between hover:bg-white/8 transition-all cursor-pointer group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">{client.name}</p>
                                    <p className="text-[10px] text-slate-500">موكل</p>
                                </div>
                            </div>
                            <button className="p-2 text-slate-600 hover:text-white transition-colors">
                                <MoreHorizontal className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
