import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { 
  Scale, 
  Calendar, 
  Users, 
  FileText, 
  MessageSquare, 
  Plus, 
  LogOut, 
  ChevronLeft, 
  Upload, 
  Download, 
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  LayoutDashboard,
  Briefcase,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { User, Case, Session, Message, Document, LawyerStats } from './types';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Navbar = ({ user, onLogout }: { user: User | null, onLogout: () => void }) => {
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

const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) => (
  <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
    <div className={cn("p-3 rounded-xl", color)}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-slate-500 text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  </div>
);

// --- Pages ---

const LoginPage = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [identifier, setIdentifier] = useState(''); // Email or Phone
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      
      if (res.ok) {
        const user = await res.json();
        onLogin(user);
      } else {
        const data = await res.json();
        setError(data.error || 'خطأ في بيانات الدخول');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-100 via-slate-50 to-slate-100">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-panel p-8 rounded-3xl shadow-xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
            <Scale className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 text-center">المحامي محمد أحمد الكامل</h1>
          <p className="text-slate-500">نظام إدارة القضايا القانونية</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">البريد الإلكتروني أو رقم الهاتف</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="example@mail.com أو 05..."
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">كلمة المرور</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full py-3 text-lg mt-2"
          >
            {loading ? 'جاري التحميل...' : 'تسجيل الدخول'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500 mb-2">ليس لديك حساب؟ (للموكلين فقط)</p>
          <Link to="/register" className="text-indigo-600 font-bold hover:underline">إنشاء حساب جديد</Link>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            حساب المحامي: Mohammedalkamel@gmail.com
          </p>
        </div>
      </motion.div>
    </div>
  );
};

const RegisterPage = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        const user = await res.json();
        onLogin(user);
        navigate('/');
      } else {
        const data = await res.json();
        setError(data.error || 'خطأ في إنشاء الحساب');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass-panel p-8 rounded-3xl shadow-xl"
      >
        <h1 className="text-2xl font-bold text-slate-900 mb-2">إنشاء حساب موكل جديد</h1>
        <p className="text-slate-500 mb-8">يرجى إدخال بياناتك لمتابعة قضاياك</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">الاسم الكامل</label>
            <input 
              type="text" 
              className="input-field" 
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">البريد الإلكتروني</label>
            <input 
              type="email" 
              className="input-field" 
              required
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهاتف</label>
            <input 
              type="tel" 
              className="input-field" 
              required
              placeholder="05XXXXXXXX"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">كلمة المرور</label>
            <input 
              type="password" 
              className="input-field" 
              required
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full py-3 mt-2"
          >
            {loading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-slate-500 hover:text-indigo-600 text-sm">لديك حساب بالفعل؟ سجل دخولك</Link>
        </div>
      </motion.div>
    </div>
  );
};

const Dashboard = ({ user }: { user: User }) => {
  const [cases, setCases] = useState<Case[]>([]);
  const [stats, setStats] = useState<LawyerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [casesRes, statsRes] = await Promise.all([
          fetch(`/api/cases?userId=${user.id}&role=${user.role}`),
          user.role === 'lawyer' ? fetch(`/api/stats/lawyer/${user.id}`) : Promise.resolve(null)
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

const NewCasePage = ({ user }: { user: User }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    case_number: '',
    title: '',
    court: '',
    type: 'جنائية',
    client_name: '',
    client_email: '',
    fees: 0
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, lawyer_id: user.id })
      });
      if (res.ok) {
        navigate('/');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-6 transition-colors">
        <ChevronLeft className="w-5 h-5 rotate-180" />
        <span>العودة للرئيسية</span>
      </Link>

      <div className="glass-panel p-8 rounded-3xl">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">إضافة قضية جديدة</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">رقم القضية</label>
              <input 
                type="text" 
                className="input-field" 
                required 
                value={formData.case_number}
                onChange={e => setFormData({...formData, case_number: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">نوع القضية</label>
              <select 
                className="input-field"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
              >
                <option>جنائية</option>
                <option>مدنية</option>
                <option>أحوال شخصية</option>
                <option>تجارية</option>
                <option>عمالية</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">عنوان القضية</label>
            <input 
              type="text" 
              className="input-field" 
              required 
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">المحكمة</label>
            <input 
              type="text" 
              className="input-field" 
              required 
              value={formData.court}
              onChange={e => setFormData({...formData, court: e.target.value})}
            />
          </div>

          <div className="pt-6 border-t border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">بيانات الموكل</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">اسم الموكل</label>
                <input 
                  type="text" 
                  className="input-field" 
                  required 
                  value={formData.client_name}
                  onChange={e => setFormData({...formData, client_name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">البريد الإلكتروني للموكل</label>
                <input 
                  type="email" 
                  className="input-field" 
                  required 
                  value={formData.client_email}
                  onChange={e => setFormData({...formData, client_email: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">الأتعاب المالية</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">إجمالي الأتعاب المتفق عليها</label>
              <div className="relative">
                <input 
                  type="number" 
                  className="input-field pl-12" 
                  placeholder="0.00"
                  value={formData.fees}
                  onChange={e => setFormData({...formData, fees: e.target.value})}
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">ريال</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Link to="/" className="btn-secondary">إلغاء</Link>
            <button type="submit" disabled={loading} className="btn-primary px-8">
              {loading ? 'جاري الحفظ...' : 'حفظ القضية'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CaseDetails = ({ user }: { user: User }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'sessions' | 'documents' | 'chat'>('details');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [uploading, setUploading] = useState(false);

  const [isEditingFees, setIsEditingFees] = useState(false);
  const [feesData, setFeesData] = useState({ fees: 0, paid_amount: 0 });
  const [aiSummary, setAiSummary] = useState('');
  const [generatingAi, setGeneratingAi] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/cases/${id}`);
      const data = await res.json();
      setCaseData(data);
      setFeesData({ fees: data.fees, paid_amount: data.paid_amount });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.emit('join-case', id);

    newSocket.on('new-message', (message) => {
      setCaseData((prev: any) => ({
        ...prev,
        messages: [...(prev?.messages || []), message]
      }));
    });

    return () => {
      newSocket.close();
    };
  }, [id]);

  const handleUpdateFees = async () => {
    try {
      const res = await fetch(`/api/cases/${id}/fees`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feesData)
      });
      if (res.ok) {
        setIsEditingFees(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCase = async () => {
    if (!window.confirm('هل أنت متأكد من حذف هذه القضية نهائياً؟')) return;
    try {
      const res = await fetch(`/api/cases/${id}`, { method: 'DELETE' });
      if (res.ok) navigate('/');
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateAiSummary = async () => {
    setGeneratingAi(true);
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: id })
      });
      const data = await res.json();
      if (data.summary) setAiSummary(data.summary);
      else if (data.error) alert(data.error);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;
    
    socket.emit('send-message', {
      case_id: id,
      sender_id: user.id,
      content: newMessage
    });
    setNewMessage('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('case_id', id!);
    formData.append('uploaded_by', user.id.toString());

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleAddSession = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const date = formData.get('date') as string;
    const notes = formData.get('notes') as string;

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_id: id, session_date: date, notes })
      });
      if (res.ok) {
        fetchData();
        (e.target as any).reset();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;
  if (!caseData) return <div className="p-8 text-center text-red-500">القضية غير موجودة</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-2 transition-colors">
        <ChevronLeft className="w-5 h-5 rotate-180" />
        <span>العودة للرئيسية</span>
      </Link>

      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">
              #{caseData.case_number}
            </span>
            <h1 className="text-2xl font-bold text-slate-900">{caseData.title}</h1>
          </div>
          <p className="text-slate-500 flex items-center gap-2">
            <Scale className="w-4 h-4" />
            <span>{caseData.court}</span>
            <span className="mx-2">•</span>
            <span>{caseData.type}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleGenerateAiSummary}
            disabled={generatingAi}
            className="btn-secondary flex items-center gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
          >
            <Sparkles className={cn("w-5 h-5", generatingAi && "animate-spin")} />
            <span>{generatingAi ? 'جاري التحليل...' : 'تحليل ذكي'}</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="text-left md:text-right">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">الموكل</p>
              <p className="font-bold text-slate-700">{caseData.client_name}</p>
            </div>
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
              <Users className="w-6 h-6" />
            </div>
          </div>
          {user.role === 'lawyer' && (
            <button 
              onClick={handleDeleteCase}
              className="p-3 text-red-500 hover:bg-red-50 rounded-2xl transition-colors"
              title="حذف القضية"
            >
              <AlertCircle className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {aiSummary && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="glass-panel p-6 rounded-3xl bg-gradient-to-br from-indigo-50 to-white border-indigo-100"
        >
          <div className="flex items-center gap-2 mb-4 text-indigo-700">
            <Sparkles className="w-6 h-6" />
            <h3 className="text-lg font-bold">التحليل القانوني الذكي (AI)</h3>
          </div>
          <div className="prose prose-indigo max-w-none text-slate-700">
            <ReactMarkdown>{aiSummary}</ReactMarkdown>
          </div>
          <button 
            onClick={() => setAiSummary('')}
            className="mt-4 text-sm text-slate-400 hover:text-slate-600"
          >
            إغلاق التحليل
          </button>
        </motion.div>
      )}

      <div className="flex border-b border-slate-200 gap-8 overflow-x-auto no-scrollbar">
        {[
          { id: 'details', label: 'التفاصيل', icon: FileText },
          { id: 'sessions', label: 'الجلسات', icon: Calendar },
          { id: 'documents', label: 'المستندات', icon: Upload },
          { id: 'chat', label: 'المراسلات', icon: MessageSquare },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 py-4 px-2 border-b-2 transition-all whitespace-nowrap",
              activeTab === tab.id 
                ? "border-indigo-600 text-indigo-600 font-bold" 
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {activeTab === 'details' && (
            <motion.div 
              key="details"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <div className="md:col-span-2 space-y-6">
                <div className="glass-panel p-6 rounded-2xl">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">ملخص القضية</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs text-slate-400 mb-1">تاريخ البدء</p>
                      <p className="font-bold">{format(new Date(caseData.created_at), 'dd MMMM yyyy', { locale: ar })}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs text-slate-400 mb-1">الحالة</p>
                      <p className="font-bold text-emerald-600">نشطة</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs text-slate-400 mb-1">المحكمة</p>
                      <p className="font-bold">{caseData.court}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs text-slate-400 mb-1">نوع القضية</p>
                      <p className="font-bold">{caseData.type}</p>
                    </div>
                    <div className="p-4 bg-indigo-50 rounded-xl relative group">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs text-indigo-400 mb-1">الموقف المالي</p>
                          {isEditingFees ? (
                            <div className="space-y-2 mt-2">
                              <div>
                                <label className="text-[10px] text-indigo-400">إجمالي الأتعاب</label>
                                <input 
                                  type="number" 
                                  className="w-full bg-white border border-indigo-200 rounded p-1 text-sm"
                                  value={feesData.fees}
                                  onChange={e => setFeesData({...feesData, fees: Number(e.target.value)})}
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-indigo-400">المبلغ المدفوع</label>
                                <input 
                                  type="number" 
                                  className="w-full bg-white border border-indigo-200 rounded p-1 text-sm"
                                  value={feesData.paid_amount}
                                  onChange={e => setFeesData({...feesData, paid_amount: Number(e.target.value)})}
                                />
                              </div>
                              <div className="flex gap-2 pt-1">
                                <button onClick={handleUpdateFees} className="text-[10px] bg-indigo-600 text-white px-2 py-1 rounded">حفظ</button>
                                <button onClick={() => setIsEditingFees(false)} className="text-[10px] bg-slate-200 text-slate-600 px-2 py-1 rounded">إلغاء</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="font-bold text-indigo-700">{caseData.fees} ريال (إجمالي)</p>
                              <p className="text-sm text-emerald-600 font-medium">{caseData.paid_amount} ريال (مدفوع)</p>
                              <p className="text-sm text-red-500 font-medium">المتبقي: {caseData.fees - caseData.paid_amount} ريال</p>
                            </>
                          )}
                        </div>
                        {user.role === 'lawyer' && !isEditingFees && (
                          <button 
                            onClick={() => setIsEditingFees(true)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-indigo-100 rounded transition-all"
                          >
                            <Plus className="w-4 h-4 text-indigo-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="glass-panel p-6 rounded-2xl">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">سير القضية</h3>
                  <div className="relative pr-8 space-y-8 before:absolute before:right-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                    <div className="relative">
                      <div className="absolute -right-8 top-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white shadow-sm flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                      <p className="font-bold text-slate-800">تم استلام القضية</p>
                      <p className="text-sm text-slate-500">{format(new Date(caseData.created_at), 'dd/MM/yyyy')}</p>
                    </div>
                    <div className="relative">
                      <div className="absolute -right-8 top-1 w-6 h-6 bg-indigo-500 rounded-full border-4 border-white shadow-sm flex items-center justify-center">
                        <Clock className="w-3 h-3 text-white" />
                      </div>
                      <p className="font-bold text-slate-800">قيد المراجعة والمرافعة</p>
                      <p className="text-sm text-slate-500">جاري العمل على الملف</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="glass-panel p-6 rounded-2xl">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">معلومات التواصل</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">الموكل</p>
                        <p className="font-bold text-sm">{caseData.client_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-lg flex items-center justify-center">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">البريد الإلكتروني</p>
                        <p className="font-bold text-sm">{caseData.client_email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'sessions' && (
            <motion.div 
              key="sessions"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              {user.role === 'lawyer' && (
                <div className="glass-panel p-6 rounded-2xl">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">إضافة جلسة جديدة</h3>
                  <form onSubmit={handleAddSession} className="flex flex-col md:flex-row gap-4">
                    <input name="date" type="datetime-local" className="input-field flex-1" required />
                    <input name="notes" type="text" placeholder="ملاحظات الجلسة..." className="input-field flex-[2]" />
                    <button type="submit" className="btn-primary whitespace-nowrap">إضافة موعد</button>
                  </form>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                {caseData.sessions.length > 0 ? (
                  caseData.sessions.map((s: Session) => (
                    <div key={s.id} className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                          <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">
                            {format(new Date(s.session_date), 'EEEE, dd MMMM yyyy', { locale: ar })}
                          </p>
                          <p className="text-sm text-slate-500">
                            {format(new Date(s.session_date), 'hh:mm a', { locale: ar })}
                          </p>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-600 bg-slate-50 p-3 rounded-lg text-sm border border-slate-100 italic">
                          {s.notes || 'لا توجد ملاحظات'}
                        </p>
                      </div>
                      <div className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1",
                        new Date(s.session_date) > new Date() ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"
                      )}>
                        {new Date(s.session_date) > new Date() ? (
                          <>
                            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                            قادمة
                          </>
                        ) : 'منتهية'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center glass-panel rounded-2xl">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">لا توجد جلسات مجدولة</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'documents' && (
            <motion.div 
              key="documents"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="glass-panel p-8 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">رفع مستند جديد</h3>
                <p className="text-slate-500 mb-6">يمكنك رفع ملفات PDF أو صور تتعلق بالقضية</p>
                <label className={cn(
                  "btn-primary cursor-pointer flex items-center gap-2",
                  uploading && "opacity-50 pointer-events-none"
                )}>
                  {uploading ? 'جاري الرفع...' : 'اختر ملفاً'}
                  <input type="file" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {caseData.documents.map((d: Document) => (
                  <div key={d.id} className="glass-panel p-4 rounded-xl flex items-center justify-between group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-bold text-sm text-slate-800 truncate" title={d.file_name}>{d.file_name}</p>
                        <p className="text-xs text-slate-400">{format(new Date(d.created_at), 'dd/MM/yyyy')}</p>
                      </div>
                    </div>
                    <a 
                      href={`/api/download/${d.file_path}`} 
                      download={d.file_name}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    >
                      <Download className="w-5 h-5" />
                    </a>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div 
              key="chat"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="glass-panel rounded-3xl overflow-hidden flex flex-col h-[600px] shadow-2xl border-indigo-100"
            >
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">المحادثة الفورية</p>
                  <p className="text-xs text-emerald-600 flex items-center gap-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    متصل الآن
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                {caseData.messages.map((m: Message, idx: number) => (
                  <motion.div 
                    key={m.id} 
                    initial={{ opacity: 0, x: m.sender_id === user.id ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={cn(
                      "flex flex-col max-w-[80%]",
                      m.sender_id === user.id ? "mr-auto items-end" : "ml-auto items-start"
                    )}
                  >
                    <div className={cn(
                      "p-3 rounded-2xl text-sm shadow-sm transition-all hover:shadow-md",
                      m.sender_id === user.id 
                        ? "bg-indigo-600 text-white rounded-tl-none" 
                        : "bg-white text-slate-800 border border-slate-100 rounded-tr-none"
                    )}>
                      {m.content}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 px-1">
                      {m.sender_name} • {format(new Date(m.created_at), 'HH:mm')}
                    </span>
                  </motion.div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2">
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="اكتب رسالتك هنا..." 
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                />
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit" 
                  className="btn-primary p-3 rounded-xl shadow-lg shadow-indigo-100"
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('justice_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('justice_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('justice_user');
  };

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar user={user} onLogout={handleLogout} />
        
        <main className="flex-1">
          <Routes>
            <Route 
              path="/login" 
              element={!user ? <LoginPage onLogin={handleLogin} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/register" 
              element={!user ? <RegisterPage onLogin={handleLogin} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/" 
              element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/new-case" 
              element={user?.role === 'lawyer' ? <NewCasePage user={user} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/case/:id" 
              element={user ? <CaseDetails user={user} /> : <Navigate to="/login" />} 
            />
          </Routes>
        </main>

        <footer className="py-8 text-center text-slate-400 text-sm border-t border-slate-100">
          <p>© {new Date().getFullYear()} نظام عدالة لإدارة القضايا القانونية. جميع الحقوق محفوظة.</p>
        </footer>
      </div>
    </Router>
  );
}
