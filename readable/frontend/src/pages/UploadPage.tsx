import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Upload, Sparkles, User, FileText, ChevronRight, ImageIcon, Loader2, Wand2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { personalizeLesson, uploadLesson } from "../api/lessons";
import { ErrorBanner } from "../components/ErrorBanner";
import { getErrorMessage } from "../lib/errors";

export const UploadPage = () => {
  const [title, setTitle] = useState("");
  const [rawText, setRawText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [studentId, setStudentId] = useState("all");

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [file]);

  const uploadMutation = useMutation({
    mutationFn: uploadLesson,
    onSuccess: (data) => {
      toast.success("Lesson uploaded and processed!");
      if (data.processed_content) {
        setRawText(data.processed_content);
      }
    },
  });

  const personalizeMutation = useMutation({
    mutationFn: ({ lessonId, studentIdValue }: { lessonId: number; studentIdValue: string | number }) =>
      personalizeLesson(lessonId, studentIdValue),
    onSuccess: () => toast.success("AI-Personalized version created ✨"),
  });

  const isScanning = uploadMutation.isPending && file && file.type.startsWith("image/");

  return (
    <div className="max-w-7xl mx-auto space-y-10 py-10 px-6">
      <header className="relative overflow-hidden p-12 rounded-[40px] bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 text-white border-b-8 border-indigo-800 shadow-2xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          <div className="flex items-center gap-6 mb-6">
            <div className="h-20 w-20 rounded-3xl bg-white/20 backdrop-blur-xl flex items-center justify-center border-4 border-white/30 shadow-lg">
              <Upload className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-black tracking-tight mb-2">Lesson Workshop</h1>
              <p className="text-2xl font-bold text-indigo-100 opacity-90">Transform any content into magical reading experiences.</p>
            </div>
          </div>
        </motion.div>
        
        {/* Abstract background shapes */}
        <div className="absolute top-[-50px] right-[-50px] w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-50px] left-[-20px] w-64 h-64 bg-indigo-400/20 rounded-full blur-2xl" />
      </header>

      <div className="grid gap-10 lg:grid-cols-[1.2fr,0.8fr]">
        {/* Left Column: Upload Form */}
        <motion.form
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-[40px] p-12 border-4 border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden"
          onSubmit={(event) => {
            event.preventDefault();
            if (!title) return toast.error("Please add a title");
            uploadMutation.mutate({ title, rawText: rawText || undefined, file });
          }}
        >
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-sky-100 rounded-2xl">
                <FileText className="w-8 h-8 text-sky-500" />
              </div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Source Material</h2>
            </div>
            {uploadMutation.isSuccess && (
              <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full font-black text-sm border-2 border-green-200 animate-bounce">
                Processed Successfully!
              </span>
            )}
          </div>
          
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="block text-sm font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Lesson Title</label>
              <input
                required
                className="w-full rounded-2xl border-4 border-slate-50 bg-slate-50 px-8 py-5 text-xl text-slate-900 font-bold outline-none transition-all focus:border-sky-300 focus:bg-white focus:ring-8 focus:ring-sky-50"
                value={title}
                placeholder="e.g. Journey to Mars"
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Lesson Text</label>
                <div className="flex gap-2">
                   <button type="button" onClick={() => setRawText("")} className="text-xs font-black text-rose-400 hover:text-rose-600 uppercase tracking-widest">Clear</button>
                </div>
              </div>
              <div className="relative group">
                <textarea
                  rows={10}
                  className="w-full rounded-3xl border-4 border-slate-50 bg-slate-50 px-8 py-6 text-lg text-slate-900 font-bold outline-none transition-all focus:border-sky-300 focus:bg-white focus:ring-8 focus:ring-sky-50 resize-none leading-relaxed"
                  value={rawText}
                  placeholder="Paste text here or use OCR to extract from a photo..."
                  onChange={(event) => setRawText(event.target.value)}
                />
                {isScanning && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center gap-4 border-4 border-sky-200 z-10">
                    <Loader2 className="w-12 h-12 text-sky-500 animate-spin" />
                    <div className="text-center">
                      <p className="text-xl font-black text-sky-600">AI Character Extraction…</p>
                      <p className="text-sm font-bold text-sky-400">Transforming your photo into digital text</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                Upload Photo or Document
              </label>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="relative group">
                  <div className="absolute inset-0 bg-sky-500 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none" />
                  <input
                    type="file"
                    onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                    className="block w-full text-sm font-black text-slate-400 file:mr-6 file:rounded-2xl file:border-none file:bg-sky-500 file:px-8 file:py-4 file:text-base file:font-black file:text-white hover:file:bg-sky-400 cursor-pointer border-4 border-dashed border-slate-200 rounded-3xl p-4 hover:border-sky-300 transition-all"
                    accept=".txt,.pdf,image/*"
                  />
                </div>

                <AnimatePresence>
                  {previewUrl && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="relative h-20 bg-slate-100 rounded-3xl overflow-hidden border-2 border-slate-200 flex items-center px-4 gap-4"
                    >
                      <img src={previewUrl} className="w-12 h-12 rounded-lg object-cover border-2 border-white shadow-sm" alt="Preview" />
                      <div>
                        <p className="text-xs font-black text-slate-400 uppercase">Image Ready</p>
                        <p className="text-sm font-bold text-slate-600 truncate max-w-[120px]">{file?.name}</p>
                      </div>
                      <button onClick={() => setFile(null)} className="ml-auto text-slate-400 hover:text-rose-500">
                        <User className="w-5 h-5 rotate-45" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {uploadMutation.isError && (
            <div className="mt-8">
              <ErrorBanner message={getErrorMessage(uploadMutation.error)} />
            </div>
          )}

          <button
            type="submit"
            disabled={uploadMutation.isPending}
            className="group relative w-full rounded-3xl bg-sky-500 border-b-8 border-sky-700 px-8 py-6 text-2xl font-black text-white hover:bg-sky-400 hover:-translate-y-1 active:translate-y-1 active:border-b-0 transition-all disabled:opacity-50 mt-12 flex items-center justify-center gap-4"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <Wand2 className="w-8 h-8 group-hover:rotate-12 transition-transform" />
                {previewUrl ? "Extract & Save Lesson" : "Save Lesson →"}
              </>
            )}
          </button>
        </motion.form>

        {/* Right Column: Personalization */}
        <div className="space-y-10">
          <motion.section
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-indigo-600 rounded-[40px] p-12 text-white border-b-8 border-indigo-800 shadow-xl flex flex-col h-full"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black tracking-tight">AI Personalization</h2>
            </div>
            
            <p className="text-xl font-bold text-indigo-100 leading-relaxed mb-12 opacity-90">
              Customize your new lesson for any student based on their unique reading profile.
            </p>

            <div className="space-y-8 flex-1">
              <div className="rounded-[30px] bg-white/10 backdrop-blur-xl border-4 border-white/10 p-10 shadow-inner group transition-all hover:bg-white/15">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-indigo-200 mb-3">Lesson Reference</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-6xl font-black text-white tracking-tighter">
                    {uploadMutation.data?.lesson_id ?? "--"}
                  </p>
                  <span className="text-indigo-300 font-bold">ID</span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-black text-indigo-200 uppercase tracking-[0.2em] ml-1">Target Student ID</label>
                <div className="relative">
                  <User className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-indigo-300" />
                  <input
                    className="w-full rounded-2xl border-4 border-indigo-500/30 bg-indigo-700/50 px-16 py-5 text-2xl text-white font-black outline-none transition-all focus:border-white focus:bg-indigo-800 ring-offset-indigo-600 focus:ring-4 focus:ring-white/20"
                    value={studentId}
                    placeholder="all"
                    onChange={(event) => setStudentId(event.target.value)}
                  />
                </div>
                <p className="text-sm font-bold text-indigo-300 ml-2">Type "all" to personalize for everyone.</p>
              </div>
            </div>

            {personalizeMutation.isError && (
              <div className="mt-8">
                <ErrorBanner message={getErrorMessage(personalizeMutation.error)} />
              </div>
            )}

            <button
              type="button"
              disabled={!uploadMutation.data || personalizeMutation.isPending}
              onClick={() => {
                if (!uploadMutation.data) return;
                personalizeMutation.mutate({
                  lessonId: uploadMutation.data.lesson_id,
                  studentIdValue: studentId.toLowerCase() === 'all' ? 'all' : Number(studentId),
                });
              }}
              className="w-full rounded-3xl bg-white border-b-8 border-indigo-200 px-8 py-6 text-2xl font-black text-indigo-600 hover:bg-slate-50 hover:-translate-y-1 active:translate-y-1 active:border-b-0 transition-all disabled:opacity-50 mt-12 flex items-center justify-center gap-4"
            >
              {personalizeMutation.isPending ? (
                <>
                  <Loader2 className="w-8 h-8 animate-spin" />
                  Adapting…
                </>
              ) : (
                <>
                  <Sparkles className="w-8 h-8 text-indigo-400" />
                  Generate Adaptations
                </>
              )}
            </button>

            <AnimatePresence>
              {personalizeMutation.data && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-10 rounded-[30px] border-4 border-dashed border-white/20 p-8 bg-white/5"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 bg-green-400 rounded-full flex items-center justify-center text-white border-b-4 border-green-600 flex-shrink-0 mt-1">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-lg font-black text-white leading-tight">
                        Magical adaptation ready!
                      </p>
                      <p className="text-indigo-200 font-bold text-sm mt-1">
                        Formatted for {studentId.toLowerCase() === 'all' ? 'everyone' : `Student #${personalizeMutation.data.student_id}`}
                      </p>
                      <Link
                        className="mt-6 inline-flex items-center gap-3 font-black text-white bg-indigo-500 hover:bg-indigo-400 px-6 py-3 rounded-2xl border-b-4 border-indigo-700 active:border-b-0 transition-all"
                        to={`/lesson/${personalizeMutation.data.lesson_id}?contentId=${personalizeMutation.data.id}`}
                      >
                        Preview as Student <ChevronRight className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        </div>
      </div>
    </div>
  );
};
