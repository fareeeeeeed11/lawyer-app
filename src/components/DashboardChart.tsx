import React from 'react';
import { motion } from 'motion/react';

export const DashboardChart = ({ chartData }: { chartData?: { labels: string[], series1: number[], series2: number[] } }) => {
    // Large Chart Data
    const data1 = chartData?.series1 || [20, 45, 30, 65, 55, 60, 40]; // Teal - Cases
    const data2 = chartData?.series2 || [10, 35, 45, 25, 65, 50, 75]; // Indigo - Sessions
    const days = chartData?.labels || ['Sun', 'Man', 'Wed', 'Thu', 'Fri', 'San']; // Matching image labels

    const generatePath = (data: number[]) => {
        const width = 600;
        const height = 200;
        const max = 100;
        return data.map((d, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - (d / max) * height;
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');
    };

    return (
        <div className="glass-panel p-8 rounded-[2.5rem] relative overflow-hidden">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-xl font-black text-white">ملخص القضايا</h3>
                    <p className="text-xs text-slate-400">Active Case Trend</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#34d399]" />
                        <span className="text-[10px] text-slate-400">القضية</span>
                    </div>
                </div>
            </div>

            <div className="relative h-[250px] w-full">
                {/* Horizontal Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between opacity-10 pointer-events-none">
                    {[100, 80, 60, 40, 20, 0].map(v => (
                        <div key={v} className="flex items-center gap-4">
                            <span className="text-[10px] text-slate-500 w-6">{v}</span>
                            <div className="flex-1 h-[1px] bg-slate-500" />
                        </div>
                    ))}
                </div>

                {/* SVG Chart */}
                {data1.every(d => d === 0) && data2.every(d => d === 0) ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-slate-500 text-sm font-medium">لا توجد تحركات في آخر 7 أيام</p>
                    </div>
                ) : (
                    <svg className="absolute inset-0 w-full h-full p-4 overflow-visible" viewBox="0 0 600 200" preserveAspectRatio="none">
                        {/* Line 1 - Teal */}
                        <motion.path
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 2, delay: 0.5 }}
                            d={generatePath(data1)}
                            fill="none"
                            stroke="#34d399"
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                        {/* Line 2 - Indigo */}
                        <motion.path
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 2, delay: 0.8 }}
                            d={generatePath(data2)}
                            fill="none"
                            stroke="#6366f1"
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                    </svg>
                )}
            </div>

            {/* X-Axis Labels */}
            <div className="flex justify-between mt-4 px-10">
                {days.map(d => (
                    <span key={d} className="text-[11px] text-slate-500 font-bold">{d}</span>
                ))}
            </div>
        </div>
    );
};
