import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Search, Download, Trash2, Plus, Eye, X } from 'lucide-react';
import { User } from '../types';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { dataService } from '../services/dataService';
import { documentStorage } from '../services/documentStorage';
import { db } from '../db';

export const DocumentsPage = ({ user }: { user: User }) => {
    const [documents, setDocuments] = useState<any[]>([]);
    const [cases, setCases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [showAddModal, setShowAddModal] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [selectedCaseId, setSelectedCaseId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewType, setPreviewType] = useState<'image' | 'pdf' | 'other' | null>(null);

    const fetchDocs = async () => {
        try {
            const data = await dataService.getDocuments(user.id);
            setDocuments(data);
        } catch (e) {
            console.error("Error fetching documents", e);
        } finally {
            setLoading(false);
        }
    };

    const fetchCases = async () => {
        try {
            const data = await dataService.getCases(user.id);
            setCases(data);
        } catch (e) {
            console.error("Error fetching cases", e);
        }
    };

    useEffect(() => {
        fetchDocs();
        fetchCases();
    }, [user.id]);

    const handleAddDocument = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !selectedCaseId) {
            setError('الرجاء اختيار المستند والقضية');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const localFileName = await documentStorage.saveFile(file);
            await dataService.addDocument({
              case_id: parseInt(selectedCaseId),
              file_name: file.name,
              file_path: localFileName,
              uploaded_by: user.id
            });

            await fetchDocs();
            setShowAddModal(false);
            setFile(null);
            setSelectedCaseId('');
        } catch (e: any) {
            console.error(e);
            setError('حدث خطأ أثناء حفظ الملف محلياً');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteDocument = async (id: number) => {
        if (!window.confirm("هل أنت متأكد من حذف هذا المستند نهائياً؟")) return;
        try {
            const doc = documents.find(d => d.id === id);
            if (doc) {
              await documentStorage.deleteFile(doc.file_path);
            }
            await db.documents.delete(id);
            await fetchDocs();
        } catch (e: any) {
            alert("حدث خطأ أثناء الحذف");
        }
    };

    const filteredDocs = documents.filter(d =>
        (d.file_name || '').includes(search) ||
        (d.case_title || '').includes(search)
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-l from-white to-slate-400 mb-2">
                        لوحة المستندات
                    </h1>
                    <p className="text-slate-400 font-medium">استعراض جميع المرفقات والأدلة للقضايا</p>
                </div>

                <div className="flex gap-4 items-center">
                    <div className="relative">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="بحث في المستندات..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-2xl py-3 pr-12 pl-6 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all w-full md:w-64"
                        />
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl transition-all shadow-lg shadow-indigo-500/25 font-bold shrink-0"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="hidden sm:inline">رفع مستند</span>
                    </button>
                </div>
            </div>

            <div className="glass-panel p-6 rounded-[2.5rem]">
                {loading ? (
                    <div className="h-64 flex items-center justify-center text-slate-400">جاري التحميل...</div>
                ) : filteredDocs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredDocs.map((doc: any) => (
                            <motion.div
                                key={doc.id}
                                whileHover={{ y: -5 }}
                                className="p-5 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-colors group relative overflow-hidden flex flex-col"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-700/50 border border-slate-600 flex items-center justify-center text-slate-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <button
                                        onClick={() => handleDeleteDocument(doc.id)}
                                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-white/10 rounded-lg transition-colors"
                                        title="حذف المستند"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <h3 className="text-sm font-bold text-white mb-2 line-clamp-2" title={doc.file_name}>{doc.file_name}</h3>

                                <div className="space-y-2 mb-6 flex-1">
                                    <div className="text-xs text-slate-400 bg-black/20 px-3 py-1.5 rounded-lg border border-white/5 truncate">
                                        قضية: {doc.case_title}
                                    </div>
                                    <div className="text-[10px] text-slate-500 flex justify-between">
                                        <span>بواسطة: {doc.uploader_name}</span>
                                        <span>{format(new Date(doc.created_at), 'dd MMM yyyy', { locale: ar })}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-4 border-t border-white/5 mt-auto">
                                    <button
                                        onClick={async () => {
                                            const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(doc.file_name);
                                            const isPdf = /\.pdf$/i.test(doc.file_name);
                                            const uri = await documentStorage.getFileUri(doc.file_path);
                                            setPreviewUrl(uri);
                                            setPreviewType(isImg ? 'image' : isPdf ? 'pdf' : 'other');
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl transition-colors text-sm font-bold"
                                        title="معاينة"
                                    >
                                        <Eye className="w-4 h-4" />
                                        معاينة
                                    </button>
                                    <button
                                        onClick={async () => {
                                            const uri = await documentStorage.getFileUri(doc.file_path);
                                            window.open(uri, '_blank');
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-500/10 hover:bg-slate-500/20 text-slate-400 rounded-xl transition-colors text-sm font-bold"
                                        title="فتح"
                                    >
                                        <Download className="w-4 h-4" />
                                        فتح
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                        <FileText className="w-12 h-12 mb-4 opacity-50" />
                        <p className="text-lg">لا توجد مستندات مرفوعة بعد</p>
                    </div>
                )}
            </div>

            {/* Add Document Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => !isSubmitting && setShowAddModal(false)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#1e2336] border border-white/10 rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-2xl font-black text-white mb-6">رفع مستند جديد</h3>
                        {error && <div className="p-3 mb-4 bg-rose-500/10 text-rose-400 rounded-xl text-sm font-medium">{error}</div>}

                        <form onSubmit={handleAddDocument} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">القضية المرتبطة</label>
                                <select
                                    required
                                    value={selectedCaseId}
                                    onChange={e => setSelectedCaseId(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50"
                                >
                                    <option value="" className="bg-slate-800 text-slate-400">اختر قضية...</option>
                                    {cases.map(c => (
                                        <option key={c.id} value={c.id} className="bg-slate-800">
                                            {c.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">اختر الملف</label>
                                <input
                                    type="file"
                                    required
                                    onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 px-4 bg-white/5 text-slate-300 rounded-xl font-bold">إلغاء</button>
                                <button type="submit" disabled={isSubmitting} className="flex-[2] py-3 px-4 bg-indigo-500 text-white rounded-xl font-bold">رفع المستند</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
            {/* Preview Modal */}
            <AnimatePresence>
                {previewUrl && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[300] bg-[#0a0e1a]/95 flex items-center justify-center p-4 backdrop-blur-md"
                        onClick={() => setPreviewUrl(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-[#131d33] border border-white/10 rounded-[2.5rem] w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col relative shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center">
                                        <Eye className="w-5 h-5" />
                                    </div>
                                    معاينة المستند
                                </h3>
                                <button
                                    onClick={() => setPreviewUrl(null)}
                                    className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all flex items-center justify-center"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="flex-1 bg-black/40 flex items-center justify-center overflow-auto p-4 custom-scrollbar">
                                {previewType === 'image' ? (
                                    <img
                                        src={previewUrl}
                                        alt="Document Preview"
                                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                                    />
                                ) : previewType === 'pdf' ? (
                                    <iframe
                                        src={previewUrl}
                                        className="w-full h-full border-none rounded-lg bg-white"
                                        title="PDF Preview"
                                    />
                                ) : (
                                    <div className="text-center space-y-4">
                                        <div className="w-20 h-20 bg-white/5 text-slate-500 rounded-3xl flex items-center justify-center mx-auto">
                                            <FileText className="w-10 h-10" />
                                        </div>
                                        <p className="text-slate-400 font-bold">هذا النوع من الملفات لا يدعم المعاينة المباشرة</p>
                                        <button
                                            onClick={async () => {
                                                const uri = await documentStorage.getFileUri(previewUrl);
                                                window.open(uri, '_blank');
                                            }}
                                            className="btn-primary inline-flex mt-4"
                                        >
                                            فتح الملف الآن
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
