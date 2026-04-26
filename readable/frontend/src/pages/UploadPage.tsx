import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

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
    <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
      <form
        className="rounded-[2.5rem] border border-white/80 bg-white/80 p-8 shadow-soft backdrop-blur"
        onSubmit={(event) => {
          event.preventDefault();
          uploadMutation.mutate({ title, rawText: rawText || undefined, file });
        }}
      >
        <p className="text-sm font-bold uppercase tracking-widest text-sky-500">Teacher Tools</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Upload a lesson</h1>
        <div className="mt-8 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Title</span>
            <input
              className="w-full rounded-2xl border border-sky-100 bg-white px-5 py-4 text-ink shadow-sm outline-none transition focus:border-sea focus:ring-2 focus:ring-sea/20"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Paste text</span>
            <textarea
              rows={8}
              className="w-full rounded-2xl border border-sky-100 bg-white px-5 py-4 text-ink shadow-sm outline-none transition focus:border-sea focus:ring-2 focus:ring-sea/20"
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Or upload file</span>
            <input
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="block w-full text-sm font-medium text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-[#eef6ff] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-sea hover:file:bg-[#e3f0ff]"
              accept=".txt,.pdf,image/*"
            />
          </label>
        </div>
        {uploadMutation.isError ? <div className="mt-5"><ErrorBanner message={getErrorMessage(uploadMutation.error)} /></div> : null}
        <button
          type="submit"
          disabled={uploadMutation.isPending}
          className="mt-8 w-full rounded-full bg-[linear-gradient(135deg,#2f80ed_0%,#4fa6ff_100%)] px-6 py-4 text-base font-semibold tracking-wide text-white shadow-[0_4px_14px_rgba(47,128,237,0.35)] transition hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
        >
          {uploadMutation.isPending ? "Uploading..." : "Upload Lesson"}
        </button>
      </form>

      <section className="rounded-[2.5rem] border border-white/80 bg-white/80 p-8 shadow-soft backdrop-blur">
        <h2 className="text-2xl font-semibold text-ink">Personalize for a student</h2>
        <p className="mt-3 text-slate-600">
          After uploading, generate a personalized copy and open it in the student reading flow.
        </p>
        <div className="mt-8 space-y-5">
          <div className="rounded-[1.5rem] bg-[#eef6ff] p-5 ring-1 ring-sea/10">
            <p className="text-sm font-medium text-slate-500">Uploaded lesson id</p>
            <p className="mt-2 text-3xl font-semibold text-ink">
              {uploadMutation.data?.lesson_id ?? "--"}
            </p>
          </div>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Student ID</span>
            <input
              className="w-full rounded-2xl border border-sky-100 bg-white px-5 py-4 text-ink shadow-sm outline-none transition focus:border-sea focus:ring-2 focus:ring-sea/20"
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
            />
          </label>
        </div>
        {personalizeMutation.isError ? <div className="mt-5"><ErrorBanner message={getErrorMessage(personalizeMutation.error)} /></div> : null}
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
          className="mt-8 w-full rounded-full bg-[linear-gradient(135deg,#2f80ed_0%,#4fa6ff_100%)] px-6 py-4 text-base font-semibold tracking-wide text-white shadow-[0_4px_14px_rgba(47,128,237,0.35)] transition hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
        >
          {personalizeMutation.isPending ? "Personalizing..." : "Create Personalized Copy"}
        </button>
        {personalizeMutation.data ? (
          <div className="mt-8 rounded-[1.5rem] border border-sea/20 bg-[#f7fbff] p-5 text-sm font-medium leading-relaxed text-slate-700">
            Personalized content id <strong>{personalizeMutation.data.id}</strong> created for
            student {personalizeMutation.data.student_id}.{" "}
            <Link
              className="font-semibold text-sea hover:underline"
              to={`/lesson/${personalizeMutation.data.lesson_id}?contentId=${personalizeMutation.data.id}`}
            >
              Open lesson preview
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  );
};
