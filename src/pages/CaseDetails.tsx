import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
    Scale,
    Calendar,
    Users,
    FileText,
    MessageSquare,
    Plus,
    ChevronLeft,
    Upload,
    Download,
    Send,
    Clock,
    CheckCircle2,
    AlertCircle,
    Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { User, Session, Message, Document } from '../types';
import { getApiUrl, API_BASE_URL } from '../config';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const CaseDetails = ({ user }: { user: User }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [caseData, setCaseData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'details' | 'sessions' | 'documents' | 'chat' | 'ai_chat'>('details');
    const [socket, setSocket] = useState<Socket | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [uploading, setUploading] = useState(false);

    const [isEditingFees, setIsEditingFees] = useState(false);
    const [feesData, setFeesData] = useState({ fees: '', paid_amount: '', currency: 'ريال سعودي' });
    const [generatingAi, setGeneratingAi] = useState(false);
    const [aiChatHistory, setAiChatHistory] = useState<{ role: 'user' | 'model', parts: { text: string }[] }[]>([]);
    const [aiChatInput, setAiChatInput] = useState('');
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [aiChatMessages, setAiChatMessages] = useState<any[]>([]);
    const [aiError, setAiError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const res = await fetch(getApiUrl(`/api/cases/${id}`));
            const data = await res.json();
            setCaseData(data);
            setFeesData({
                fees: data.fees.toString(),
                paid_amount: data.paid_amount.toString(),
                currency: data.currency || 'ريال سعودي'
            });
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
        const newSocket = io(API_BASE_URL || window.location.origin);
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
            const res = await fetch(getApiUrl(`/api/cases/${id}/fees`), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fees: Number(feesData.fees) || 0,
                    paid_amount: Number(feesData.paid_amount) || 0,
                    currency: feesData.currency
                })
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
            const res = await fetch(getApiUrl(`/api/cases/${id}`), { method: 'DELETE' });
            if (res.ok) navigate('/');
        } catch (err) {
            console.error(err);
        }
    };

    const handleGenerateAiSummary = async () => {
        setGeneratingAi(true);
        setAiError(null);
        try {
            const res = await fetch(getApiUrl('/api/ai/chat'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    caseId: id,
                    message: "قدم لي ملخصاً قانونياً للموقف الحالي بناءً على البيانات المتوفرة في القضية.",
                    history: []
                })
            });
            const data = await res.json();
            if (data.text) {
                const aiMsg = {
                    id: Date.now(),
                    case_id: Number(id),
                    sender_id: 0,
                    sender_name: 'المستشار القانوني الخاص',
                    content: data.text,
                    created_at: new Date().toISOString()
                };
                setAiChatMessages([aiMsg]);
                setAiChatHistory([{ role: 'model', parts: [{ text: data.text }] }]);
                setActiveTab('ai_chat');
            } else if (data.error) {
                setAiError(data.error);
            }
        } catch (err) {
            console.error("AI Summary Error:", err);
            setAiError("فشل الاتصال بخدمة المستشار الذكي. يرجى المحاولة مرة أخرى.");
        } finally {
            setGeneratingAi(false);
        }
    };

    const handleAiChatResponse = async (userMsg: string) => {
        setIsAiThinking(true);
        setAiError(null);
        try {
            const res = await fetch(getApiUrl('/api/ai/chat'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    caseId: id,
                    message: userMsg,
                    history: aiChatHistory
                })
            });
            const data = await res.json();
            if (data.text) {
                const aiMsg = {
                    id: Date.now() + 1,
                    case_id: Number(id),
                    sender_id: 0,
                    sender_name: 'المستشار القانوني الخاص',
                    content: data.text,
                    created_at: new Date().toISOString()
                };
                setAiChatMessages(prev => [...prev, aiMsg]);
                setAiChatHistory(prev => [...prev,
                { role: 'user', parts: [{ text: userMsg }] },
                { role: 'model', parts: [{ text: data.text }] }
                ]);
            } else if (data.error) {
                setAiError(data.error);
            }
        } catch (err) {
            console.error("AI Chat Error:", err);
            setAiError("فشل الحصول على رد من المستشار. يرجى التحقق من اتصالك بالإنترنت.");
        } finally {
            setIsAiThinking(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const content = newMessage.trim();
        setNewMessage('');

        if (activeTab === 'ai_chat') {
            const userMsg = {
                id: Date.now(),
                sender_id: user.id,
                sender_name: user.name,
                content: content,
                created_at: new Date().toISOString()
            };
            setAiChatMessages(prev => [...prev, userMsg]);
            handleAiChatResponse(content);
        } else if (socket) {
            socket.emit('send-message', {
                case_id: id,
                sender_id: user.id,
                content: content
            });
        }
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
            const res = await fetch(getApiUrl('/api/documents'), {
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
            const res = await fetch(getApiUrl('/api/sessions'), {
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
                        <span>{generatingAi ? 'جاري التحضير...' : 'استشارة سريعة'}</span>
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


            <div className="flex border-b border-slate-200 gap-8 overflow-x-auto no-scrollbar">
                {[
                    { id: 'details', label: 'التفاصيل', icon: FileText },
                    { id: 'sessions', label: 'الجلسات', icon: Calendar },
                    { id: 'documents', label: 'المستندات', icon: Upload },
                    { id: 'chat', label: 'المراسلات', icon: MessageSquare },
                    { id: 'ai_chat', label: 'المستشار الذكي', icon: Sparkles },
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
                                        <div className="md:col-span-2 p-5 bg-gradient-to-br from-indigo-50/50 to-white border border-indigo-100 rounded-2xl relative group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                                                        <Scale className="w-4 h-4" />
                                                        الموقف المالي
                                                    </h4>
                                                    <p className="text-[10px] text-indigo-400">إدارة الأتعاب والتحصيل</p>
                                                </div>
                                                {user.role === 'lawyer' && !isEditingFees && (
                                                    <button
                                                        onClick={() => setIsEditingFees(true)}
                                                        className="p-2 hover:bg-white rounded-xl shadow-sm border border-indigo-50 transition-all text-indigo-600 font-bold text-xs flex items-center gap-1"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                        تعديل
                                                    </button>
                                                )}
                                            </div>

                                            {isEditingFees ? (
                                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-bold text-indigo-600 mr-1">إجمالي الأتعاب</label>
                                                            <div className="relative flex group">
                                                                <input
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    className="w-full bg-white border-2 border-indigo-100 focus:border-indigo-500 rounded-xl p-3 pl-24 text-sm outline-none transition-all font-bold"
                                                                    placeholder="0"
                                                                    value={feesData.fees}
                                                                    onChange={e => {
                                                                        const val = e.target.value.replace(/[^0-9.]/g, '');
                                                                        setFeesData({ ...feesData, fees: val });
                                                                    }}
                                                                />
                                                                <select
                                                                    className="absolute left-2 top-2 bottom-2 w-20 bg-indigo-50 border-none rounded-lg text-[10px] font-bold text-indigo-600 outline-none cursor-pointer text-center appearance-none"
                                                                    value={feesData.currency}
                                                                    onChange={e => setFeesData({ ...feesData, currency: e.target.value })}
                                                                >
                                                                    <option value="ريال سعودي">ر.سعودي</option>
                                                                    <option value="ريال يمني">ر.يمني</option>
                                                                    <option value="دولار">دولار</option>
                                                                    <option value="يورو">يورو</option>
                                                                    <option value="درهم">درهم</option>
                                                                    <option value="دينار">دينار</option>
                                                                    <option value="جنية">جنية</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-bold text-emerald-600 mr-1">المبلغ المدفوع</label>
                                                            <div className="relative flex">
                                                                <input
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    className="w-full bg-white border-2 border-emerald-100 focus:border-emerald-500 rounded-xl p-3 pl-12 text-sm outline-none transition-all font-bold"
                                                                    placeholder="0"
                                                                    value={feesData.paid_amount}
                                                                    onChange={e => {
                                                                        const val = e.target.value.replace(/[^0-9.]/g, '');
                                                                        setFeesData({ ...feesData, paid_amount: val });
                                                                    }}
                                                                />
                                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-500">
                                                                    {feesData.currency === 'ريال سعودي' ? 'ر.س' : feesData.currency === 'ريال يمني' ? 'ر.ي' : feesData.currency === 'دولار' ? '$' : feesData.currency === 'يورو' ? '€' : feesData.currency}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-3 mt-2">
                                                        <button
                                                            onClick={handleUpdateFees}
                                                            className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
                                                        >
                                                            حفظ التغييرات
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setIsEditingFees(false);
                                                                setFeesData({
                                                                    fees: caseData.fees.toString(),
                                                                    paid_amount: caseData.paid_amount.toString(),
                                                                    currency: caseData.currency || 'ريال سعودي'
                                                                });
                                                            }}
                                                            className="px-6 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200"
                                                        >
                                                            إلغاء
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-5">
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div className="text-center">
                                                            <p className="text-[10px] text-slate-400 mb-1">الإجمالي</p>
                                                            <p className="font-black text-indigo-700 text-lg">{caseData.fees.toLocaleString()} <span className="text-[10px] font-bold">{caseData.currency || 'ريال سعودي'}</span></p>
                                                        </div>
                                                        <div className="text-center border-x border-slate-100">
                                                            <p className="text-[10px] text-slate-400 mb-1">المدفوع</p>
                                                            <p className="font-black text-emerald-600 text-lg">{caseData.paid_amount.toLocaleString()} <span className="text-[10px] font-bold">{caseData.currency || 'ريال سعودي'}</span></p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-[10px] text-slate-400 mb-1">المتبقي</p>
                                                            <p className="font-black text-red-500 text-lg">{(caseData.fees - caseData.paid_amount).toLocaleString()} <span className="text-[10px] font-bold">{caseData.currency || 'ريال سعودي'}</span></p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-end">
                                                            <span className="text-[10px] font-bold text-slate-500">نسبة التحصيل</span>
                                                            <span className="text-xs font-black text-indigo-600">
                                                                {Math.round((caseData.paid_amount / (caseData.fees || 1)) * 100)}%
                                                            </span>
                                                        </div>
                                                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-white shadow-inner">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${(caseData.paid_amount / (caseData.fees || 1)) * 100}%` }}
                                                                className={cn(
                                                                    "h-full rounded-full shadow-sm",
                                                                    (caseData.paid_amount / (caseData.fees || 1)) >= 1 ? "bg-emerald-500" : "bg-indigo-600"
                                                                )}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
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
                                            <p className="text-sm text-slate-500">
                                                {(() => {
                                                    try {
                                                        const d = new Date(caseData.created_at);
                                                        return isNaN(d.getTime()) ? 'تاريخ غير معروف' : format(d, 'dd/MM/yyyy');
                                                    } catch { return 'تاريخ غير معروف'; }
                                                })()}
                                            </p>
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
                                                    {(() => {
                                                        try {
                                                            const d = new Date(s.session_date);
                                                            if (isNaN(d.getTime())) {
                                                                return <p className="font-bold text-red-500 text-xs">تاريخ غير صالح: {s.session_date}</p>;
                                                            }
                                                            return (
                                                                <>
                                                                    <p className="font-bold text-slate-900">
                                                                        {format(d, 'EEEE, dd MMMM yyyy', { locale: ar })}
                                                                    </p>
                                                                    <p className="text-sm text-slate-500">
                                                                        {format(d, 'hh:mm a', { locale: ar })}
                                                                    </p>
                                                                </>
                                                            );
                                                        } catch {
                                                            return <p className="font-bold text-red-500 text-xs">خطأ في التاريخ</p>;
                                                        }
                                                    })()}
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
                                            href={getApiUrl(`/api/download/${d.file_path}`)}
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

                    {activeTab === 'ai_chat' && (
                        <motion.div
                            key="ai_chat"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="glass-panel rounded-3xl overflow-hidden flex flex-col h-[600px] shadow-2xl border-indigo-100"
                        >
                            <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                        <Sparkles className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">المستشار القانوني الخاص</p>
                                        <p className="text-xs text-indigo-600 flex items-center gap-1">
                                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                                            مستعد للتحليل والرد
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleGenerateAiSummary}
                                    disabled={generatingAi}
                                    className="btn-secondary text-xs py-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                >
                                    <Sparkles className={cn("w-3 h-3 ml-1", generatingAi && "animate-spin")} />
                                    {generatingAi ? 'جاري التحضير...' : 'بدء استشارة جديدة'}
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                                {aiError && (
                                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 mb-4">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                        <p className="text-sm font-bold">{aiError}</p>
                                    </div>
                                )}
                                {aiChatMessages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center space-y-6 p-8">
                                        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center animate-bounce duration-[3000ms]">
                                            <Sparkles className="w-10 h-10" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800 mb-2">مرحباً بك في الاستشارة القانونية الذكية</h3>
                                            <p className="text-slate-500 max-w-sm mx-auto">أنا مساعدك الرقمي المتخصص. يمكنك سؤالي عن أي شيء يخص القانون أو هذه القضية مباشرة.</p>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
                                            {[
                                                "ما هي الثغرات القانونية المحتملة؟",
                                                "قدم لي ملخصاً سريعاً للقضية",
                                                "ما هي المواد القانونية المتعلقة؟",
                                                "اقترح لي الخطوات التالية"
                                            ].map((q, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => {
                                                        const userMsg = {
                                                            id: Date.now(),
                                                            sender_id: user.id,
                                                            sender_name: user.name,
                                                            content: q,
                                                            created_at: new Date().toISOString()
                                                        };
                                                        setAiChatMessages(prev => [...prev, userMsg]);
                                                        handleAiChatResponse(q);
                                                    }}
                                                    className="p-3 text-sm text-right bg-white border border-slate-100 rounded-xl hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-sm"
                                                >
                                                    {q}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    aiChatMessages.map((m: any, idx: number) => (
                                        <motion.div
                                            key={m.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className={cn(
                                                "flex flex-col max-w-[85%]",
                                                m.sender_id === user.id ? "mr-auto items-end" : "ml-auto items-start"
                                            )}
                                        >
                                            <div className={cn(
                                                "p-4 rounded-2xl text-sm shadow-sm transition-all hover:shadow-md",
                                                m.sender_id === user.id
                                                    ? "bg-indigo-600 text-white rounded-tl-none"
                                                    : "bg-white text-slate-800 border border-indigo-100 rounded-tr-none shadow-indigo-100/30"
                                            )}>
                                                {m.sender_id !== user.id ? (
                                                    <div className="prose prose-sm prose-indigo max-w-none">
                                                        <ReactMarkdown>{m.content}</ReactMarkdown>
                                                    </div>
                                                ) : m.content}
                                            </div>
                                            <span className="text-[10px] text-slate-400 mt-1 px-1">
                                                {m.sender_name} • {format(new Date(m.created_at), 'HH:mm')}
                                            </span>
                                        </motion.div>
                                    ))
                                )}
                                {isAiThinking && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex ml-auto items-start">
                                        <div className="bg-white border border-indigo-100 p-4 rounded-2xl rounded-tr-none shadow-sm flex items-center gap-3">
                                            <div className="flex gap-1">
                                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
                                            </div>
                                            <span className="text-xs text-indigo-400 font-bold">جاري تحليل البيانات...</span>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2">
                                <input
                                    type="text"
                                    className="input-field shadow-inner"
                                    placeholder="اكتب استفسارك القانوني هنا..."
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    disabled={isAiThinking}
                                />
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    type="submit"
                                    className="btn-primary p-3 rounded-xl shadow-lg shadow-indigo-100"
                                    disabled={!newMessage.trim() || isAiThinking}
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
