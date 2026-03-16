import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Circle, ChevronLeft, User, MoreHorizontal, Calendar } from 'lucide-react';

export const TaskWidget = ({ tasks }: { tasks: any[] }) => {
    const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set());

    const toggleTask = (taskId: number) => {
        setCompletedTasks(prev => {
            const next = new Set(prev);
            if (next.has(taskId)) {
                next.delete(taskId);
            } else {
                next.add(taskId);
            }
            return next;
        });
    };

    const formatTime = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
        } catch { return ''; }
    };

    return (
        <div className="glass-panel p-6 rounded-[2.5rem] flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-white">المهام اليومية</h3>
                <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full">
                    {tasks.length} مهام
                </span>
            </div>

            <div className="space-y-3 flex-1">
                {tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-slate-500 text-sm h-32 gap-2">
                        <Calendar className="w-8 h-8 opacity-30" />
                        لا توجد مهام لليوم
                    </div>
                ) : (
                    tasks.map(task => {
                        const isDone = completedTasks.has(task.id);
                        const taskTitle = task.case_title || task.title || 'جلسة';
                        const taskTime = task.session_date ? formatTime(task.session_date) : (task.time || '');
                        
                        return (
                            <motion.div
                                key={task.id}
                                layout
                                className={`p-4 rounded-2xl flex items-center justify-between transition-all cursor-pointer group ${
                                    isDone 
                                        ? 'bg-emerald-500/5 border border-emerald-500/20' 
                                        : 'bg-white/5 border border-white/5 hover:bg-white/8'
                                }`}
                                onClick={() => toggleTask(task.id)}
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    <button className="flex-shrink-0">
                                        {isDone ? (
                                            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                        ) : (
                                            <Circle className="w-6 h-6 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                                        )}
                                    </button>
                                    <div>
                                        <p className={`text-sm font-bold transition-all ${
                                            isDone 
                                                ? 'text-slate-500 line-through' 
                                                : 'text-white group-hover:text-indigo-300'
                                        }`}>
                                            {taskTitle}
                                        </p>
                                        {taskTime && (
                                            <p className="text-[10px] text-slate-500 mt-1">{taskTime}</p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
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
