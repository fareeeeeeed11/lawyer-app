import React from 'react';
import { Construction } from 'lucide-react';
import { motion } from 'motion/react';

export const PlaceholderPage = ({ title }: { title: string }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6"
            >
                <Construction className="w-12 h-12 text-indigo-400" />
            </motion.div>
            <h1 className="text-3xl font-black text-white mb-2">{title}</h1>
            <p className="text-slate-400 max-w-md mx-auto">
                هذه الصفحة قيد التطوير حالياً وسيتم إضافتها قريباً كجزء من التحديثات القادمة للنظام.
            </p>
        </div>
    );
};
