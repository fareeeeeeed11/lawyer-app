import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const StatCard = ({ title, value, icon: Icon, percentage, trend, sparklineData }: {
    title: string,
    value: string | number,
    icon: any,
    percentage?: string,
    trend?: 'up' | 'down' | 'none',
    sparklineData?: number[]
}) => {
    // Basic SVG Sparkline path generator
    const generatePath = (data: number[]) => {
        if (!data || data.length < 2) return "";
        const width = 120;
        const height = 40;
        const max = Math.max(...data);
        const min = Math.min(...data);
        const range = max - min || 1;

        return data.map((d, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((d - min) / range) * height;
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');
    };

    return (
        <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-stat-card p-6 rounded-3xl relative overflow-hidden group cursor-default"
        >
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                    <Icon className="w-6 h-6 text-indigo-400" />
                </div>
                {percentage && trend !== 'none' && (
                    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${trend === 'up' ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'
                        }`}>
                        {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>{percentage}</span>
                    </div>
                )}
            </div>

            <div className="relative z-10 mb-4">
                <p className="text-slate-400 text-sm font-bold mb-1">{title}</p>
                <p className="text-4xl font-black text-white tabular-nums">{value}</p>
            </div>

            {/* Sparkline */}
            {sparklineData && sparklineData.length > 0 && trend !== 'none' && (
                <div className="relative h-12 w-full mt-2">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 120 40" preserveAspectRatio="none">
                        <motion.path
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                            d={generatePath(sparklineData)}
                            fill="none"
                            stroke={trend === 'up' ? '#34d399' : '#fb7185'}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        {/* Gradient Under fill */}
                        <path
                            d={`${generatePath(sparklineData)} L 120 40 L 0 40 Z`}
                            fill={`url(#grad-${title.replace(/\s+/g, '-')})`}
                            className="opacity-20"
                        />
                        <defs>
                            <linearGradient id={`grad-${title.replace(/\s+/g, '-')}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor={trend === 'up' ? '#34d399' : '#fb7185'} />
                                <stop offset="100%" stopColor="transparent" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
            )}
        </motion.div>
    );
};
