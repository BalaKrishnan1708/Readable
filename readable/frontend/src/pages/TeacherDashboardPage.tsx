import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  Users,
  GraduationCap,
  ChevronRight,
  FileUp,
  Loader2,
  Send,
  Sparkles,
} from "lucide-react";

import { personalizeLessonForAll, uploadLesson } from "../api/lessons";
import { ErrorBanner } from "../components/ErrorBanner";
import { getErrorMessage } from "../lib/errors";
import { useTeacherStudentsQuery } from "../hooks/useProfileQueries";
import type { TeacherPersonalizedLesson } from "../types/lesson";

export const TeacherDashboardPage = () => {
  const navigate = useNavigate();
  const studentsQuery = useTeacherStudentsQuery();
  const students = studentsQuery.data ?? [];
  const [title, setTitle] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [personalizedLessons, setPersonalizedLessons] = useState<TeacherPersonalizedLesson[]>([]);

  const groupedPreview = useMemo(
    () =>
      personalizedLessons.map((entry) => ({
        ...entry,
        previewText: entry.personalized_content.segments.join(" ").trim(),
      })),
    [personalizedLessons],
  );

  const sendLessonMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim()) {
        throw new Error("Please enter a lesson title.");
      }
      if (!pdfFile) {
        throw new Error("Please choose a PDF to extract.");
      }
      if (students.length === 0) {
        throw new Error("No students are available for personalization.");
      }

      const uploadResponse = await uploadLesson({
        title: title.trim(),
        file: pdfFile,
      });
      const personalized = await personalizeLessonForAll(uploadResponse.lesson_id);

      return {
        lesson: uploadResponse,
        personalized,
      };
    },
    onSuccess: ({ lesson, personalized }) => {
      setExtractedText(lesson.processed_content);
      setPersonalizedLessons(personalized);
      toast.success("PDF extracted and personalized lessons generated for every student.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  return (
    <div className="space-y-12 py-4">
      <header className="pb-8 border-b-4 border-slate-200 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-xl bg-sky-500 flex items-center justify-center text-white border-b-4 border-sky-600">
              <Users className="w-6 h-6" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Mission Control</h1>
          </div>
          <p className="text-xl font-bold text-slate-500 leading-relaxed max-w-2xl">
            Monitor your student explorers as they travel through the reading universe!
          </p>
        </div>
        <button className="btn-3d rounded-2xl bg-indigo-500 border-indigo-600 px-8 py-4 font-black text-white hover:bg-indigo-400">
          Sync All Data
        </button>
      </header>

      <section className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-clean p-10 bg-white"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="h-14 w-14 rounded-2xl bg-sky-500 border-b-4 border-sky-600 flex items-center justify-center text-white">
              <FileUp className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">PDF Lesson Dispatch</h2>
              <p className="text-sm font-bold text-slate-400 mt-1">
                Extract lesson text from a PDF and send it straight into a student's reading lesson.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Lesson Title
              </label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Moonlight reading passage"
                className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-5 py-4 text-base font-bold text-slate-900 outline-none transition-all focus:border-sky-300 focus:bg-white"
              />
            </div>

            <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Personalization Scope
              </p>
              <p className="mt-2 text-base font-black text-slate-900">
                Generate a Groq-personalized lesson for all {students.length} students after upload.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                PDF File
              </label>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(event) => setPdfFile(event.target.files?.[0] ?? null)}
                className="block w-full rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-bold text-slate-500 file:mr-4 file:rounded-xl file:border-none file:bg-sky-500 file:px-5 file:py-3 file:font-black file:text-white hover:file:bg-sky-400"
              />
              <p className="text-sm font-bold text-slate-400">
                {pdfFile ? `Ready: ${pdfFile.name}` : "Upload a PDF worksheet, story, or scanned passage."}
              </p>
            </div>

            {sendLessonMutation.isError ? (
              <ErrorBanner message={getErrorMessage(sendLessonMutation.error)} />
            ) : null}

            <button
              type="button"
              onClick={() => sendLessonMutation.mutate()}
              disabled={sendLessonMutation.isPending || students.length === 0}
              className="btn-3d w-full rounded-2xl bg-sky-500 border-sky-600 px-8 py-5 font-black text-white hover:bg-sky-400 disabled:opacity-60 flex items-center justify-center gap-3"
            >
              {sendLessonMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Extracting PDF and Personalizing for Every Student...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Extract PDF and Personalize for All Students
                </>
              )}
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card-clean p-10 bg-slate-900 text-white"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="h-14 w-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-sky-300" />
            </div>
            <div>
              <h2 className="text-2xl font-black">Extraction Preview</h2>
              <p className="text-sm font-bold text-slate-400 mt-1">
                Review the OCR text that Groq will adapt for each student.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border-2 border-slate-200 bg-white p-6 min-h-[18rem] shadow-inner">
            {extractedText ? (
              <p className="text-base leading-8 font-black text-slate-950 whitespace-pre-wrap tracking-normal">
                {extractedText}
              </p>
            ) : (
              <div className="h-full flex items-center justify-center text-center text-slate-500 font-bold">
                Upload a PDF to see the extracted lesson text here before you open the student lesson.
              </div>
            )}
          </div>

          {sendLessonMutation.data ? (
            <div className="mt-8 space-y-4">
              <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200">
                  Groq Personalization Complete
                </p>
                <p className="mt-2 text-xl font-black text-white">
                  {sendLessonMutation.data.lesson.title}
                </p>
                <p className="mt-2 text-sm font-bold text-emerald-100">
                  Generated {groupedPreview.length} student-specific lesson outputs.
                </p>
              </div>

              <div className="space-y-4 max-h-[32rem] overflow-y-auto pr-1">
                {groupedPreview.map((entry) => (
                  <div
                    key={entry.personalized_content.id}
                    className="rounded-3xl border border-white/10 bg-white/5 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-black text-white">{entry.student_name}</p>
                        <p className="text-sm font-bold text-slate-400">{entry.student_email}</p>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-sky-300">
                          Level {entry.reading_level ?? "Unknown"}
                        </p>
                      </div>
                      <Link
                        to={`/lesson/${entry.personalized_content.lesson_id}?contentId=${entry.personalized_content.id}`}
                        className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 font-black text-slate-900 hover:bg-slate-100"
                      >
                        Open
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>

                    <div className="mt-4 rounded-2xl bg-white p-4">
                      <p className="text-sm leading-7 font-black text-slate-950 whitespace-pre-wrap">
                        {entry.previewText || "No personalized segments were returned."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </motion.div>
      </section>

      <section className="card-clean p-10 bg-white">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-4">
            <GraduationCap className="w-8 h-8 text-indigo-500" />
            Active Explorers
          </h2>
          <span className="rounded-full bg-slate-100 border-2 border-slate-200 px-6 py-2 text-xs font-black text-slate-500 uppercase tracking-widest">
            {studentsQuery.data?.length ?? 0} Students Online
          </span>
        </div>

        <div className="overflow-x-auto rounded-3xl border-2 border-slate-100 bg-slate-50">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b-2 border-slate-200 text-slate-400 uppercase tracking-widest text-[10px] font-black">
                <th className="px-10 py-8">Explorer Name</th>
                <th className="px-10 py-8">Accuracy</th>
                <th className="px-10 py-8">Last Mission</th>
                <th className="px-10 py-8">Level</th>
                <th className="px-10 py-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-100">
              {(studentsQuery.data ?? []).map((student, i) => (
                <motion.tr
                  key={student.student_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="cursor-pointer group hover:bg-white transition-colors"
                  onClick={() => navigate(`/students/${student.student_id}`)}
                >
                  <td className="px-10 py-8">
                    <div className="font-black text-slate-900 text-lg group-hover:text-sky-500 transition-colors">{student.name}</div>
                    <div className="text-slate-400 font-bold text-sm mt-1">{student.email}</div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-4">
                       <span className="font-black text-emerald-600 text-2xl">
                        {student.avg_accuracy_pct.toFixed(0)}%
                       </span>
                       <div className="w-24 h-3 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
                          <div 
                            className="h-full bg-emerald-500"
                            style={{ width: `${student.avg_accuracy_pct}%` }}
                          />
                       </div>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-slate-500 font-bold">
                    {student.last_session_date
                      ? new Date(student.last_session_date).toLocaleDateString()
                      : "Awaiting Data"}
                  </td>
                  <td className="px-10 py-8">
                    <span className="rounded-xl border-2 border-slate-200 bg-white px-5 py-2.5 text-xs font-black text-slate-700 uppercase tracking-widest shadow-sm">
                      {student.reading_level ?? "B1"}
                    </span>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-sky-500 transition-all group-hover:translate-x-1" />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
