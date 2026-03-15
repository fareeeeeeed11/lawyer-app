import React from 'react';
import { Link } from 'react-router-dom';
import { Scale, Users, LogOut } from 'lucide-react';
import { User } from '../types';

export const Navbar = ({ user, onLogout }: { user: User | null, onLogout: () => void }) => {
  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 glass-panel-strong border-b border-white/5 px-4 py-3">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-shadow">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-black text-lg hidden md:block">المحامي محمد أحمد الكامل</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-2xl text-sm font-bold">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span>سيادة المحامي</span>
          </div>

          <button
            onClick={onLogout}
            className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20"
            title="تسجيل الخروج"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
};
