import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Search, Trash2, Plus, Eye, X, FolderPlus, Folder, ChevronLeft, Upload, Music, Image, FileType, Download, FileSpreadsheet } from 'lucide-react';
import { User } from '../types';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { dataService } from '../services/dataService';
import { documentStorage } from '../services/documentStorage';
import { db, Folder as FolderType } from '../db';

export const DocumentsPage = ({ user }: { user: User }) => {
    const [documents, setDocuments] = useState<any[]>([]);
    const [folders, setFolders] = useState<FolderType[]>([]);
    const [cases, setCases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Current folder navigation
    const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
    const [currentFolderName, setCurrentFolderName] = useState('');

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [selectedCaseId, setSelectedCaseId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Folder form
    const [folderName, setFolderName] = useState('');
    const [folderNumber, setFolderNumber] = useState('');

    // Preview
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewType, setPreviewType] = useState<'image' | 'pdf' | 'audio' | 'text' | 'office' | 'other' | null>(null);
    const [previewFileName, setPreviewFileName] = useState('');
    const [textContent, setTextContent] = useState('');

    const audioRef = useRef<HTMLAudioElement>(null);

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

    const fetchFolders = async () => {
        try {
            const data = await db.folders.toArray();
            setFolders(data);
        } catch (e) {
            console.error("Error fetching folders", e);
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
        fetchFolders();
        fetchCases();
    }, [user.id]);

    const handleAddDocument = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError('الرجاء اختيار الملف');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const localFileName = await documentStorage.saveFile(file);
            await db.documents.add({
                case_id: selectedCaseId ? parseInt(selectedCaseId) : 0,
                file_name: file.name,
                file_path: localFileName,
                uploaded_by: user.id,
                folder_id: currentFolderId || undefined,
                created_at: new Date().toISOString()
            } as any);

            await fetchDocs();
            setShowAddModal(false);
            setFile(null);
            setSelectedCaseId('');
        } catch (e: any) {
            console.error(e);
            setError('حدث خطأ أثناء حفظ الملف');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!folderName.trim()) return;

        try {
            await db.folders.add({
                name: folderName,
                number: folderNumber,
                created_at: new Date().toISOString()
            });
            await fetchFolders();
            setShowFolderModal(false);
            setFolderName('');
            setFolderNumber('');
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteFolder = async (id: number) => {
        if (!window.confirm("هل أنت متأكد من حذف هذا المجلد؟ (الوثائق بداخله ستبقى)")) return;
        await db.folders.delete(id);
        await fetchFolders();
    };

    const handleDeleteDocument = async (id: number) => {
        if (!window.confirm("هل أنت متأكد من حذف هذا المستند نهائياً؟")) return;
        try {
            const doc = documents.find(d => d.id === id);
            if (doc) {
                try { await documentStorage.deleteFile(doc.file_path); } catch {}
            }
            await db.documents.delete(id);
            await fetchDocs();
        } catch (e: any) {
            alert("حدث خطأ أثناء الحذف");
        }
    };

    const getFileType = (fileName: string): 'image' | 'pdf' | 'audio' | 'text' | 'office' | 'other' => {
        const ext = fileName.toLowerCase().split('.').pop() || '';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return 'image';
        if (ext === 'pdf') return 'pdf';
        if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'wma'].includes(ext)) return 'audio';
        if (['txt', 'md', 'csv', 'json', 'xml', 'html', 'css', 'js'].includes(ext)) return 'text';
        if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return 'office';
        return 'other';
    };

    const getFileIcon = (fileName: string) => {
        const type = getFileType(fileName);
        if (type === 'image') return <Image className="w-6 h-6" />;
        if (type === 'audio') return <Music className="w-6 h-6" />;
        if (type === 'pdf') return <FileType className="w-6 h-6" />;
        if (type === 'office') return <FileSpreadsheet className="w-6 h-6" />;
        return <FileText className="w-6 h-6" />;
    };

    const handlePreview = async (doc: any) => {
        const type = getFileType(doc.file_name);
        setPreviewFileName(doc.file_name);
        setPreviewType(type);
        setTextContent('');

        try {
            if (type === 'text') {
                // Read text content from base64
                const uri = await documentStorage.getFileUri(doc.file_path);
                try {
                    const res = await fetch(uri);
                    const text = await res.text();
                    setTextContent(text);
                } catch {
                    setTextContent('تعذر قراءة محتوى الملف');
                }
                setPreviewUrl(uri);
            } else {
                const uri = await documentStorage.getFileUri(doc.file_path);
                setPreviewUrl(uri);
            }
        } catch (e) {
            console.error('Preview error:', e);
            setPreviewUrl(null);
        }
    };

    // Filter documents by current folder
    const currentDocs = documents.filter(d => {
        const inFolder = currentFolderId ? (d.folder_id === currentFolderId) : (!d.folder_id);
        const matchesSearch = !search || (d.file_name || '').includes(search);
        return inFolder && matchesSearch;
    });

    const filteredFolders = folders.filter(f =>
        !search || f.name.includes(search) || f.number.includes(search)
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-l from-white to-slate-400 mb-1">
                        {currentFolderId ? `📁 ${currentFolderName}` : 'لوحة المستندات'}
                    </h1>
                    {currentFolderId ? (
                        <button
                            onClick={() => { setCurrentFolderId(null); setCurrentFolderName(''); }}
                            className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-sm font-bold mt-1"
                        >
                            <ChevronLeft className="w-4 h-4 rotate-180" />
                            العودة للرئيسية
                        </button>
                    ) : (
                        <p className="text-slate-400 font-medium">إدارة الملفات والمجلدات</p>
                    )}
                </div>

                <div className="flex gap-3 items-center flex-wrap">
                    <div className="relative">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="بحث..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-2xl py-3 pr-12 pl-4 outline-none focus:border-indigo-500/50 transition-all w-48"
                        />
                    </div>
                    {!currentFolderId && (
                        <button
                            onClick={() => setShowFolderModal(true)}
                            className="flex items-center gap-2 px-4 py-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 rounded-2xl transition-all font-bold shrink-0"
                        >
                            <FolderPlus className="w-5 h-5" />
                            <span className="hidden sm:inline">مجلد جديد</span>
                        </button>
                    )}
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl transition-all shadow-lg shadow-indigo-500/25 font-bold shrink-0"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="hidden sm:inline">رفع وثيقة</span>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="glass-panel p-6 rounded-[2.5rem]">
                {loading ? (
                    <div className="h-64 flex items-center justify-center text-slate-400">جاري التحميل...</div>
                ) : (
                    <>
                        {/* Folders (only in root) */}
                        {!currentFolderId && filteredFolders.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-sm font-bold text-slate-400 mb-3">📁 المجلدات</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {filteredFolders.map(folder => (
                                        <motion.div
                                            key={folder.id}
                                            whileHover={{ y: -3 }}
                                            className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl cursor-pointer hover:bg-amber-500/10 transition-all group relative"
                                            onClick={() => { setCurrentFolderId(folder.id!); setCurrentFolderName(folder.name); }}
                                        >
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id!); }}
                                                className="absolute top-2 left-2 p-1 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                            <div className="flex items-center gap-3">
                                                <Folder className="w-10 h-10 text-amber-400" />
                                                <div>
                                                    <p className="font-bold text-white text-sm">{folder.name}</p>
                                                    {folder.number && (
                                                        <p className="text-[10px] text-slate-500">رقم: {folder.number}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Documents */}
                        {currentDocs.length > 0 ? (
                            <div>
                                {!currentFolderId && filteredFolders.length > 0 && (
                                    <h3 className="text-sm font-bold text-slate-400 mb-3">📄 الملفات</h3>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {currentDocs.map((doc: any) => {
                                        const fileType = getFileType(doc.file_name);
                                        return (
                                            <motion.div
                                                key={doc.id}
                                                whileHover={{ y: -4 }}
                                                className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors group relative flex flex-col"
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                                        fileType === 'image' ? 'bg-emerald-500/10 text-emerald-400' :
                                                        fileType === 'audio' ? 'bg-violet-500/10 text-violet-400' :
                                                        fileType === 'pdf' ? 'bg-red-500/10 text-red-400' :
                                                        fileType === 'office' ? 'bg-blue-500/10 text-blue-400' :
                                                        'bg-slate-500/10 text-slate-400'
                                                    }`}>
                                                        {getFileIcon(doc.file_name)}
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteDocument(doc.id)}
                                                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <h3 className="text-sm font-bold text-white mb-1 line-clamp-2" title={doc.file_name}>
                                                    {doc.file_name}
                                                </h3>
                                                <p className="text-[10px] text-slate-500 mb-3">
                                                    {doc.created_at ? format(new Date(doc.created_at), 'dd MMM yyyy', { locale: ar }) : ''}
                                                </p>

                                                <button
                                                    onClick={() => handlePreview(doc)}
                                                    className="mt-auto w-full flex items-center justify-center gap-2 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl transition-colors text-sm font-bold"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    معاينة
                                                </button>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            !(!currentFolderId && filteredFolders.length > 0) && (
                                <div className="h-48 flex flex-col items-center justify-center text-slate-500 gap-3">
                                    <FileText className="w-12 h-12 opacity-30" />
                                    <p>{currentFolderId ? 'لا توجد وثائق في هذا المجلد' : 'لا توجد وثائق بعد'}</p>
                                </div>
                            )
                        )}
                    </>
                )}
            </div>

            {/* Add Document Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => !isSubmitting && setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 100 }}
                            className="bg-[#111827] border border-white/10 rounded-t-3xl md:rounded-2xl p-6 w-full md:max-w-md shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-xl font-black text-white mb-4">📎 رفع وثيقة جديدة</h3>
                            {error && <div className="p-3 mb-3 bg-rose-500/10 text-rose-400 rounded-xl text-sm font-medium">{error}</div>}

                            <form onSubmit={handleAddDocument} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-300 mb-2">القضية (اختياري)</label>
                                    <select
                                        value={selectedCaseId}
                                        onChange={e => setSelectedCaseId(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                                    >
                                        <option value="" className="bg-slate-800">بدون قضية</option>
                                        {cases.map(c => (
                                            <option key={c.id} value={c.id} className="bg-slate-800">{c.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-300 mb-2">اختر الملف</label>
                                    <input
                                        type="file"
                                        required
                                        accept="image/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json,.xml"
                                        onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-500/10 file:text-indigo-400"
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-white/5 text-slate-300 rounded-xl font-bold">إلغاء</button>
                                    <button type="submit" disabled={isSubmitting} className="flex-[2] py-3 bg-indigo-500 text-white rounded-xl font-bold">
                                        {isSubmitting ? 'جاري الرفع...' : '📤 رفع الوثيقة'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Folder Modal */}
            <AnimatePresence>
                {showFolderModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowFolderModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 100 }}
                            className="bg-[#111827] border border-white/10 rounded-t-3xl md:rounded-2xl p-6 w-full md:max-w-md shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-xl font-black text-white mb-4">📁 إنشاء مجلد جديد</h3>

                            <form onSubmit={handleAddFolder} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-300 mb-2">اسم المجلد</label>
                                    <input
                                        type="text"
                                        required
                                        value={folderName}
                                        onChange={e => setFolderName(e.target.value)}
                                        placeholder="مثال: مستندات قضية أحمد"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none placeholder-slate-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-300 mb-2">رقم المجلد</label>
                                    <input
                                        type="text"
                                        required
                                        value={folderNumber}
                                        onChange={e => setFolderNumber(e.target.value)}
                                        placeholder="مثال: 001"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none placeholder-slate-600"
                                        dir="ltr"
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setShowFolderModal(false)} className="flex-1 py-3 bg-white/5 text-slate-300 rounded-xl font-bold">إلغاء</button>
                                    <button type="submit" className="flex-[2] py-3 bg-amber-500 text-white rounded-xl font-bold">📁 إنشاء المجلد</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Preview Modal */}
            <AnimatePresence>
                {previewUrl && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[300] bg-[#0a0e1a]/95 flex items-center justify-center p-4 backdrop-blur-md"
                        onClick={() => { setPreviewUrl(null); if (audioRef.current) audioRef.current.pause(); }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#131d33] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Preview Header */}
                            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-indigo-500/10 text-indigo-400 rounded-lg flex items-center justify-center">
                                        <Eye className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-bold text-white truncate max-w-[200px]">{previewFileName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={previewUrl!}
                                        download={previewFileName}
                                        className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl text-emerald-400 hover:text-emerald-300 transition-all"
                                        title="تحميل"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <Download className="w-5 h-5" />
                                    </a>
                                    <button
                                        onClick={() => { setPreviewUrl(null); if (audioRef.current) audioRef.current.pause(); }}
                                        className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Preview Content */}
                            <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[300px]">
                                {previewType === 'image' ? (
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
                                    />
                                ) : previewType === 'pdf' ? (
                                    <iframe
                                        src={previewUrl}
                                        className="w-full h-[70vh] border-none rounded-lg bg-white"
                                        title="PDF Preview"
                                    />
                                ) : previewType === 'audio' ? (
                                    <div className="text-center space-y-6 w-full max-w-md">
                                        <div className="w-24 h-24 bg-violet-500/10 text-violet-400 rounded-full flex items-center justify-center mx-auto">
                                            <Music className="w-12 h-12" />
                                        </div>
                                        <p className="text-white font-bold text-lg">{previewFileName}</p>
                                        <audio
                                            ref={audioRef}
                                            src={previewUrl}
                                            controls
                                            autoPlay
                                            className="w-full"
                                            style={{ filter: 'invert(1) hue-rotate(180deg)' }}
                                        />
                                    </div>
                                ) : previewType === 'text' ? (
                                    <div className="w-full max-h-[70vh] overflow-auto bg-black/30 rounded-xl p-6 border border-white/10">
                                        <pre className="text-white text-sm whitespace-pre-wrap font-mono leading-relaxed" dir="auto">
                                            {textContent || 'جاري تحميل المحتوى...'}
                                        </pre>
                                    </div>
                                ) : previewType === 'office' ? (
                                    <div className="text-center space-y-4">
                                        <div className="w-20 h-20 bg-blue-500/10 text-blue-400 rounded-3xl flex items-center justify-center mx-auto">
                                            <FileSpreadsheet className="w-10 h-10" />
                                        </div>
                                        <p className="text-white font-bold text-lg">{previewFileName}</p>
                                        <p className="text-slate-400 text-sm">ملف أوفيس — اضغط تحميل لفتحه في تطبيق مناسب</p>
                                        <a
                                            href={previewUrl!}
                                            download={previewFileName}
                                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-bold"
                                        >
                                            <Download className="w-5 h-5" />
                                            تحميل الملف
                                        </a>
                                    </div>
                                ) : (
                                    <div className="text-center space-y-4">
                                        <div className="w-20 h-20 bg-white/5 text-slate-500 rounded-3xl flex items-center justify-center mx-auto">
                                            <FileText className="w-10 h-10" />
                                        </div>
                                        <p className="text-white font-bold">{previewFileName}</p>
                                        <p className="text-slate-400">هذا النوع لا يدعم المعاينة المباشرة</p>
                                        <a
                                            href={previewUrl!}
                                            download={previewFileName}
                                            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-xl font-bold"
                                        >
                                            <Download className="w-5 h-5" />
                                            تحميل الملف
                                        </a>
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
