import React from 'react';
import { Link } from 'react-router-dom';
import { Scale, Users, LogOut } from 'lucide-react';
import { User } from '../types';

export const Navbar = ({ user, onLogout }: { user: User | null, onLogout: () => void }) => {
  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-slate-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 text-indigo-700 font-bold text-lg md:text-xl">
          <Scale className="w-6 h-6 md:w-8 md:h-8" />
          <span>المحامي محمد أحمد الكامل</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
            <Users className="w-4 h-4" />
            <span>{user.role === 'lawyer' ? 'مرحباً بك سيادة المحامي محمد الكامل' : user.name}</span>
          </div>
          
          <button 
            onClick={onLogout}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="تسجيل الخروج"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
};
