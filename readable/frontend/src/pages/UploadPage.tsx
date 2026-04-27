import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Upload, Sparkles, User, FileText, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

import { personalizeLesson, uploadLesson } from "../api/lessons";
import { ErrorBanner } from "../components/ErrorBanner";
import { getErrorMessage } from "../lib/errors";

export const UploadPage = () => {
  const [title, setTitle] = useState("");
  const [rawText, setRawText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [studentId, setStudentId] = useState("2");

  const uploadMutation = useMutation({
    mutationFn: uploadLesson,
    onSuccess: () => toast.success("Lesson uploaded."),
  });

  const personalizeMutation = useMutation({
    mutationFn: ({ lessonId, studentIdValue }: { lessonId: number; studentIdValue: number }) =>
      personalizeLesson(lessonId, studentIdValue),
    onSuccess: () => toast.success("Personalized lesson created."),
  });

  return (
    <div className="space-y-8 py-4">
      <header className="pb-8 border-b-4 border-slate-200">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-500 flex items-center justify-center text-white border-b-4 border-indigo-600">
            <Upload className="w-6 h-6" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Lesson Workshop</h1>
        </div>
        <p className="text-xl font-bold text-slate-500">Create and personalize reading materials for your students.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
        <motion.form
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card-clean p-10 bg-white"
          onSubmit={(event) => {
            event.preventDefault();
            uploadMutation.mutate({ title, rawText: rawText || undefined, file });
          }}
        >
          <div className="flex items-center gap-3 mb-8">
            <FileText className="w-6 h-6 text-sky-500" />
            <h2 className="text-2xl font-black text-slate-800">New Mission</h2>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Mission Title</label>
              <input
                className="w-full rounded-2xl border-4 border-slate-50 bg-slate-50 px-6 py-4 text-slate-900 font-bold outline-none transition focus:border-sky-200 focus:bg-white"
                value={title}
                placeholder="e.g. The Brave Little Robot"
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Mission Text</label>
              <textarea
                rows={8}
                className="w-full rounded-2xl border-4 border-slate-50 bg-slate-50 px-6 py-4 text-slate-900 font-bold outline-none transition focus:border-sky-200 focus:bg-white resize-none"
                value={rawText}
                placeholder="Paste the story here..."
                onChange={(event) => setRawText(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Or Upload Document</label>
              <div className="relative group">
                <input
                  type="file"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  className="block w-full text-sm font-black text-slate-400 file:mr-6 file:rounded-xl file:border-b-4 file:border-sky-600 file:bg-sky-500 file:px-6 file:py-3 file:text-sm file:font-black file:text-white hover:file:bg-sky-400 cursor-pointer"
                  accept=".txt,.pdf,image/*"
                />
              </div>
            </div>
          </div>

          {uploadMutation.isError && (
            <div className="mt-6">
              <ErrorBanner message={getErrorMessage(uploadMutation.error)} />
            </div>
          )}

          <button
            type="submit"
            disabled={uploadMutation.isPending}
            className="btn-3d w-full rounded-2xl bg-sky-500 border-sky-600 px-6 py-5 text-xl font-black text-white hover:bg-sky-400 active:bg-sky-600 disabled:opacity-50 mt-10"
          >
            {uploadMutation.isPending ? "Uploading..." : "Save Mission →"}
          </button>
        </motion.form>

        <motion.section
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card-clean p-10 bg-indigo-50 border-indigo-200 shadow-[0_8px_0_0_#c7d2fe] flex flex-col"
        >
          <div className="flex items-center gap-3 mb-8">
            <Sparkles className="w-6 h-6 text-indigo-500" />
            <h2 className="text-2xl font-black text-indigo-900">AI Personalization</h2>
          </div>
          
          <p className="text-lg font-bold text-indigo-700 leading-relaxed mb-10">
            Customize a mission for a specific explorer based on their reading needs.
          </p>

          <div className="space-y-8 flex-1">
            <div className="rounded-3xl bg-white border-2 border-indigo-200 p-8 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Target Mission ID</p>
              <p className="text-4xl font-black text-indigo-900">
                {uploadMutation.data?.lesson_id ?? "--"}
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black text-indigo-500 uppercase tracking-widest ml-1">Target Explorer ID</label>
              <div className="relative">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300" />
                <input
                  className="w-full rounded-2xl border-4 border-white bg-white px-14 py-4 text-indigo-900 font-black outline-none transition focus:border-indigo-200"
                  value={studentId}
                  onChange={(event) => setStudentId(event.target.value)}
                />
              </div>
            </div>
          </div>

          {personalizeMutation.isError && (
            <div className="mt-6">
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
                studentIdValue: Number(studentId),
              });
            }}
            className="btn-3d w-full rounded-2xl bg-indigo-500 border-indigo-600 px-6 py-5 text-xl font-black text-white hover:bg-indigo-400 active:bg-indigo-600 disabled:opacity-50 mt-10"
          >
            {personalizeMutation.isPending ? "Generating..." : "Create Personalized Copy ✨"}
          </button>

          {personalizeMutation.data && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 rounded-3xl border-4 border-dashed border-indigo-200 p-6 bg-white/50"
            >
              <p className="text-sm font-bold text-indigo-900 leading-relaxed">
                Mission ready for student <span className="font-black">#{personalizeMutation.data.student_id}</span>!
              </p>
              <Link
                className="mt-4 inline-flex items-center gap-2 font-black text-indigo-600 hover:text-indigo-800 transition-colors"
                to={`/lesson/${personalizeMutation.data.lesson_id}?contentId=${personalizeMutation.data.id}`}
              >
                Open Mission Preview <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>
          )}
        </motion.section>
      </div>
    </div>
  );
};
