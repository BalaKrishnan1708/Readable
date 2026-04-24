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
        className="rounded-[2rem] bg-white p-8 shadow-soft"
        onSubmit={(event) => {
          event.preventDefault();
          uploadMutation.mutate({ title, rawText: rawText || undefined, file });
        }}
      >
        <p className="text-sm uppercase tracking-[0.25em] text-sea">Teacher Tools</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Upload a lesson</h1>
        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Title</span>
            <input
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sea"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Paste text</span>
            <textarea
              rows={8}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sea"
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Or upload file</span>
            <input
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600"
              accept=".txt,.pdf,image/*"
            />
          </label>
        </div>
        {uploadMutation.isError ? <div className="mt-4"><ErrorBanner message={getErrorMessage(uploadMutation.error)} /></div> : null}
        <button
          type="submit"
          disabled={uploadMutation.isPending}
          className="mt-6 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {uploadMutation.isPending ? "Uploading..." : "Upload Lesson"}
        </button>
      </form>

      <section className="rounded-[2rem] bg-white p-8 shadow-soft">
        <h2 className="text-2xl font-semibold text-ink">Personalize for a student</h2>
        <p className="mt-3 text-slate-600">
          After uploading, generate a personalized copy and open it in the student reading flow.
        </p>
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl bg-mist p-4">
            <p className="text-sm text-slate-500">Uploaded lesson id</p>
            <p className="mt-2 text-3xl font-semibold text-ink">
              {uploadMutation.data?.lesson_id ?? "--"}
            </p>
          </div>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Student ID</span>
            <input
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sea"
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
            />
          </label>
        </div>
        {personalizeMutation.isError ? <div className="mt-4"><ErrorBanner message={getErrorMessage(personalizeMutation.error)} /></div> : null}
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
          className="mt-6 rounded-full bg-sea px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
        >
          {personalizeMutation.isPending ? "Personalizing..." : "Create Personalized Copy"}
        </button>
        {personalizeMutation.data ? (
          <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm text-slate-700">
            Personalized content id <strong>{personalizeMutation.data.id}</strong> created for
            student {personalizeMutation.data.student_id}.{" "}
            <Link
              className="font-semibold text-sea"
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
