import { useEffect } from "react";
import { Link } from "react-router-dom";

import { ProgressChart } from "../components/ProgressChart";
import {
  useStudentLessonsQuery,
  useStudentProfileQuery,
  useStudentProgressQuery,
} from "../hooks/useProfileQueries";
import { profileStore } from "../stores/profileStore";
import { authStore } from "../stores/authStore";

const formatLessonDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const contentTone = {
  text: "from-white via-[#f6f9ff] to-[#eefbf8]",
  pdf: "from-white via-[#fff9ef] to-[#fff1e7]",
  image: "from-white via-[#f8f5ff] to-[#eef6ff]",
} as const;

export const StudentDashboardPage = () => {
  const user = authStore((state) => state.user);
  const studentId = user?.id;
  const profileQuery = useStudentProfileQuery(studentId);
  const progressQuery = useStudentProgressQuery(studentId);
  const lessonsQuery = useStudentLessonsQuery(studentId);
  const setStudentProfile = profileStore((state) => state.setStudentProfile);
  const setProgressEntries = profileStore((state) => state.setProgressEntries);

  useEffect(() => {
    if (profileQuery.data) {
      setStudentProfile(profileQuery.data);
    }
  }, [profileQuery.data, setStudentProfile]);

  useEffect(() => {
    if (progressQuery.data) {
      setProgressEntries(progressQuery.data.entries);
    }
  }, [progressQuery.data, setProgressEntries]);

  const profile = profileQuery.data;
  const progress = progressQuery.data;
  const lessons = lessonsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <div className="rounded-[2rem] bg-hero-radial p-8 shadow-soft">
          <p className="text-sm uppercase tracking-[0.25em] text-sea">Student Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">
            Practice with clarity, then check progress at a glance.
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Review recent accuracy, see challenge words, and launch the next personalized lesson.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/diagnostic"
              className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Run Diagnostic
            </Link>
            {lessons[0] ? (
              <Link
                to={`/lesson/${lessons[0].lesson_id}?contentId=${lessons[0].personalized_content_id}`}
                className="rounded-full border border-white/80 bg-white/90 px-5 py-3 text-sm font-semibold text-ink transition hover:border-sea hover:text-sea"
              >
                Continue Latest Lesson
              </Link>
            ) : null}
          </div>
        </div>
        <div className="rounded-[2rem] bg-white p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Profile summary</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-blush p-4">
              <p className="text-sm text-slate-500">Reading level</p>
              <p className="mt-2 text-xl font-semibold text-ink">{profile?.reading_level ?? "Pending"}</p>
            </div>
            <div className="rounded-2xl bg-mist p-4">
              <p className="text-sm text-slate-500">Average accuracy</p>
              <p className="mt-2 text-xl font-semibold text-ink">
                {profile ? `${profile.avg_accuracy_pct.toFixed(1)}%` : "--"}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
              <p className="text-sm text-slate-500">Average speed</p>
              <p className="mt-2 text-xl font-semibold text-ink">
                {profile ? `${profile.avg_speed_wpm.toFixed(0)} WPM` : "--"}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
              <p className="text-sm text-slate-500">Attention score</p>
              <p className="mt-2 text-xl font-semibold text-ink">
                {profile ? `${Math.round(profile.attention_score * 100)}%` : "--"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-sea">Lesson Library</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">Your personalized reading cards</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
              Each lesson opens with a support stack tuned to your pace, attention, and challenge
              words.
            </p>
          </div>
          <div className="rounded-full bg-mist px-4 py-2 text-sm font-semibold text-sea">
            {lessons.length} lesson{lessons.length === 1 ? "" : "s"} ready
          </div>
        </div>

        {lessonsQuery.isLoading ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`lesson-skeleton-${index}`}
                className="h-56 animate-pulse rounded-[1.75rem] bg-slate-100"
              />
            ))}
          </div>
        ) : lessons.length > 0 ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {lessons.map((lesson, index) => (
              <Link
                key={lesson.personalized_content_id}
                to={`/lesson/${lesson.lesson_id}?contentId=${lesson.personalized_content_id}`}
                className={`group relative overflow-hidden rounded-[1.8rem] bg-gradient-to-br ${contentTone[lesson.content_type]} p-[1px] shadow-soft transition duration-200 hover:-translate-y-1 hover:shadow-[0_28px_80px_-36px_rgba(15,23,42,0.45)]`}
              >
                <div className="absolute inset-x-5 top-4 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  <span>Lesson {String(index + 1).padStart(2, "0")}</span>
                  <span>{lesson.content_type}</span>
                </div>
                <div className="h-full rounded-[1.75rem] bg-white/88 p-6 pt-12 backdrop-blur">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold leading-tight text-ink transition group-hover:text-sea">
                        {lesson.title}
                      </h3>
                      <p className="mt-2 text-sm text-slate-500">
                        Curated on {formatLessonDate(lesson.created_at)}
                      </p>
                    </div>
                    <div className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                      {lesson.segment_count} chunks
                    </div>
                  </div>

                  <p className="mt-5 line-clamp-4 text-sm leading-7 text-slate-600">
                    {lesson.preview_text}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {lesson.support_focus.map((focus) => (
                      <span
                        key={`${lesson.personalized_content_id}-${focus}`}
                        className="rounded-full bg-mist px-3 py-2 text-xs font-semibold text-sea"
                      >
                        {focus}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                    <p className="text-sm text-slate-500">
                      Open a calm reading view with support already prepared.
                    </p>
                    <span className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-sea">
                      Open
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-[1.75rem] bg-hero-radial p-8">
            <h3 className="text-xl font-semibold text-ink">No personalized lessons yet</h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Once a teacher personalizes a lesson for this student, it will appear here as a
              reading card with the right support focus.
            </p>
          </div>
        )}
      </section>

      {progress?.entries ? <ProgressChart data={progress.entries} /> : null}

      <section className="grid gap-6 xl:grid-cols-[0.8fr,1.2fr]">
        <div className="rounded-[2rem] bg-white p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Difficult words</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {(progress?.difficult_words ?? []).map((word) => (
              <span
                key={word}
                className="rounded-full bg-amber-100 px-3 py-2 text-sm font-medium text-amber-900"
              >
                {word}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-[2rem] bg-white p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Recent sessions</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Accuracy</th>
                  <th className="pb-3">Speed</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(profile?.recent_sessions ?? []).map((session) => (
                  <tr key={session.session_id}>
                    <td className="py-3 capitalize text-ink">{session.session_type}</td>
                    <td className="py-3 text-slate-600">
                      {session.accuracy_pct !== null ? `${session.accuracy_pct}%` : "--"}
                    </td>
                    <td className="py-3 text-slate-600">
                      {session.speed_wpm !== null ? `${session.speed_wpm} WPM` : "--"}
                    </td>
                    <td className="py-3 text-slate-600">{session.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};
