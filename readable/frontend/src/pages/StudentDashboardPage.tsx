import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";

import { authStore } from "../stores/authStore";
import { profileStore } from "../stores/profileStore";
import { ProgressChart } from "../components/ProgressChart";
import {
  useStudentLessonsQuery,
  useStudentProfileQuery,
  useStudentProgressQuery,
} from "../hooks/useProfileQueries";

const formatLessonDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const formatSessionDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : "Not yet";

const contentTone = {
  text: "from-[#f9fcff] via-[#eef6ff] to-[#e5f5ff]",
  pdf: "from-[#f9fcff] via-[#eff4ff] to-[#e9efff]",
  image: "from-[#f8fbff] via-[#eef8ff] to-[#edf6ff]",
} as const;

const buildFocusTone = (accuracy: number, attention: number) => {
  if (accuracy >= 92 && attention >= 0.8) {
    return {
      title: "Strong reading flow",
      body: "Readable can lean into lighter supports and more fluent pacing today.",
    };
  }

  if (attention < 0.72) {
    return {
      title: "Steady focus mode",
      body: "Shorter chunks, calmer pacing, and stronger line support will help today.",
    };
  }

  return {
    title: "Growth-focused support",
    body: "A balanced lesson with phonics help and guided pacing is a good fit today.",
  };
};

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

  const diagnosticHistory = useMemo(
    () =>
      (profile?.recent_sessions ?? [])
        .filter((session) => session.session_type === "diagnostic")
        .slice(0, 4),
    [profile?.recent_sessions],
  );

  const focusTone = buildFocusTone(profile?.avg_accuracy_pct ?? 0, profile?.attention_score ?? 0);
  const challengeWords = progress?.difficult_words ?? profile?.difficult_words ?? [];

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-[2.5rem] border border-white/80 bg-white/80 p-8 shadow-soft backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-sky-500">Student Dashboard</p>
              <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight text-ink">
                Ready for a calmer reading session that still feels motivating.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
                Launch a fresh diagnostic, revisit a personalized lesson, and watch support adjust
                to pace, attention, and challenge words.
              </p>
            </div>
            <div className="rounded-[1.6rem] bg-[#eef6ff] px-6 py-5 ring-1 ring-sea/10">
              <p className="text-xs font-bold uppercase tracking-widest text-sea">Today’s focus</p>
              <p className="mt-2 text-xl font-semibold text-ink">{focusTone.title}</p>
              <p className="mt-2 max-w-xs text-sm leading-7 text-slate-600">{focusTone.body}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-sky-100 bg-white/60 p-5 backdrop-blur">
              <p className="text-sm font-medium text-slate-500">Reading level</p>
              <p className="mt-3 text-3xl font-semibold text-ink">{profile?.reading_level ?? "Pending"}</p>
              <p className="mt-2 text-sm text-slate-500">Updated after each finished session.</p>
            </div>
            <div className="rounded-[1.5rem] border border-sky-100 bg-white/60 p-5 backdrop-blur">
              <p className="text-sm font-medium text-slate-500">Average accuracy</p>
              <p className="mt-3 text-3xl font-semibold text-ink">
                {profile ? `${profile.avg_accuracy_pct.toFixed(1)}%` : "--"}
              </p>
              <p className="mt-2 text-sm text-slate-500">Useful for choosing lesson support.</p>
            </div>
            <div className="rounded-[1.5rem] border border-sky-100 bg-white/60 p-5 backdrop-blur">
              <p className="text-sm font-medium text-slate-500">Average pace</p>
              <p className="mt-3 text-3xl font-semibold text-ink">
                {profile ? `${profile.avg_speed_wpm.toFixed(0)} WPM` : "--"}
              </p>
              <p className="mt-2 text-sm text-slate-500">Feeds the adaptive pacer target.</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/diagnostic"
              className="rounded-full bg-[linear-gradient(135deg,#2f80ed_0%,#4fa6ff_100%)] px-6 py-3.5 text-sm font-semibold tracking-wide text-white shadow-[0_4px_12px_rgba(47,128,237,0.3)] transition hover:brightness-105 active:scale-[0.98]"
            >
              Open Diagnostic
            </Link>
            {lessons[0] ? (
              <Link
                to={`/lesson/${lessons[0].lesson_id}?contentId=${lessons[0].personalized_content_id}`}
                className="rounded-full border border-sky-100 bg-white px-6 py-3.5 text-sm font-semibold tracking-wide text-slate-600 shadow-sm transition hover:text-sea active:scale-[0.98]"
              >
                Continue Reading Lesson
              </Link>
            ) : null}
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-white/80 bg-white/80 p-8 shadow-soft backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-sky-500">Session pulse</p>
              <h2 className="mt-2 text-2xl font-semibold text-ink">Live snapshot</h2>
            </div>
            <div className="rounded-full border border-sky-100 bg-white px-4 py-2 text-sm font-medium text-slate-500 shadow-sm">
              {profileQuery.isLoading || progressQuery.isLoading ? "Refreshing..." : "Ready"}
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            <div className="rounded-[1.5rem] bg-[#f7fbff] p-5">
              <p className="text-sm text-slate-500">Attention score</p>
              <p className="mt-2 text-3xl font-semibold text-ink">
                {profile ? `${Math.round(profile.attention_score * 100)}%` : "--"}
              </p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-sky-100">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#2f80ed_0%,#79c7ff_100%)]"
                  style={{ width: `${Math.max((profile?.attention_score ?? 0) * 100, 8)}%` }}
                />
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-[#f7fbff] p-5">
              <p className="text-sm text-slate-500">Most recent session</p>
              <p className="mt-2 text-lg font-semibold text-ink">
                {profile?.recent_sessions[0]
                  ? `${profile.recent_sessions[0].session_type} • ${profile.recent_sessions[0].status}`
                  : "No recent sessions"}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {profile?.recent_sessions[0]
                  ? formatSessionDate(profile.recent_sessions[0].started_at)
                  : "Complete a diagnostic to populate this area."}
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-[#f7fbff] p-5">
              <p className="text-sm text-slate-500">Challenge words</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {challengeWords.length > 0 ? (
                  challengeWords.slice(0, 6).map((word) => (
                    <span
                      key={word}
                      className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-sea ring-1 ring-sky-100"
                    >
                      {word}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">Challenge words will appear here.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2.5rem] border border-white/80 bg-white/80 p-8 shadow-soft backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-sky-500">Lesson Library</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">Personalized reading cards</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
              Each lesson opens in its own calm reading space with supports chosen for this
              student’s current profile.
            </p>
          </div>
          <div className="rounded-full border border-sky-100 bg-white px-4 py-2 text-sm font-medium text-slate-500 shadow-sm">
            {lessons.length} lesson{lessons.length === 1 ? "" : "s"} ready
          </div>
        </div>

        {lessonsQuery.isLoading ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`lesson-skeleton-${index}`}
                className="h-64 animate-pulse rounded-[1.8rem] bg-sky-50"
              />
            ))}
          </div>
        ) : lessons.length > 0 ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {lessons.map((lesson, index) => (
              <Link
                key={lesson.personalized_content_id}
                to={`/lesson/${lesson.lesson_id}?contentId=${lesson.personalized_content_id}`}
                className={`group relative overflow-hidden rounded-[1.9rem] bg-gradient-to-br ${contentTone[lesson.content_type]} p-[1px] transition duration-200 hover:-translate-y-1 hover:shadow-soft`}
              >
                <div className="h-full rounded-[1.85rem] border border-white/85 bg-white/88 p-6 backdrop-blur">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-500">
                        Lesson {String(index + 1).padStart(2, "0")}
                      </p>
                      <h3 className="mt-3 text-xl font-semibold leading-tight text-ink transition group-hover:text-sea">
                        {lesson.title}
                      </h3>
                    </div>
                    <div className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-500 ring-1 ring-sky-100">
                      {lesson.segment_count} chunks
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-slate-500">
                    Curated on {formatLessonDate(lesson.created_at)}
                  </p>

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

                  <div className="mt-6 flex items-center justify-between border-t border-sky-50 pt-4">
                    <p className="text-sm text-slate-500">Open this lesson in a full reading view.</p>
                    <span className="rounded-full bg-[linear-gradient(135deg,#2f80ed_0%,#4fa6ff_100%)] px-4 py-2 text-sm font-semibold text-white">
                      Open card
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-[1.9rem] bg-hero-radial p-8">
            <h3 className="text-xl font-semibold text-ink">No personalized lessons yet</h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Once a teacher personalizes a lesson for this student, it will appear here as a
              clean lesson card ready to open.
            </p>
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <div className="rounded-[2.5rem] border border-white/80 bg-white/80 p-8 shadow-soft backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-sky-500">Diagnostic History</p>
              <h2 className="mt-2 text-2xl font-semibold text-ink">Past check-ins</h2>
            </div>
            <Link
              to="/diagnostic"
              className="rounded-full border border-sky-100 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm hover:text-sea"
            >
              Run again
            </Link>
          </div>

          <div className="mt-5 grid gap-3">
            {diagnosticHistory.length > 0 ? (
              diagnosticHistory.map((session) => (
                <div
                  key={session.session_id}
                  className="rounded-[1.4rem] bg-[#f7fbff] p-4 ring-1 ring-sky-50"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-ink">Diagnostic #{session.session_id}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatSessionDate(session.started_at)} • {session.status}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-sea">
                        {session.accuracy_pct !== null ? `${session.accuracy_pct}%` : "--"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {session.speed_wpm !== null ? `${session.speed_wpm} WPM` : "No pace"}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[1.4rem] bg-[#f7fbff] p-5 text-sm leading-7 text-slate-500">
                No diagnostic history yet. The first completed test will appear here as a clean
                summary card.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-white/80 bg-white/80 p-8 shadow-soft backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-sky-500">Progress Story</p>
              <h2 className="mt-2 text-2xl font-semibold text-ink">How reading is moving</h2>
            </div>
            <div className="rounded-full border border-sky-100 bg-white px-4 py-2 text-sm font-medium text-slate-500 shadow-sm">
              Last {progress?.entries.length ?? 0} sessions
            </div>
          </div>
          <div className="mt-6">
            {progress?.entries ? (
              <ProgressChart data={progress.entries} />
            ) : (
              <div className="h-56 animate-pulse rounded-[1.6rem] bg-sky-50" />
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.8fr,1.2fr]">
        <div className="rounded-[2.5rem] border border-white/80 bg-white/80 p-8 shadow-soft backdrop-blur">
          <h2 className="text-lg font-semibold text-ink">Difficult words</h2>
          <p className="mt-2 text-sm text-slate-500">
            These words help Readable decide when phonics, pacing, or whisper support should show up.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {challengeWords.length > 0 ? (
              challengeWords.map((word) => (
                <span
                  key={word}
                  className="rounded-full bg-[#eef6ff] px-3 py-2 text-sm font-semibold text-sea"
                >
                  {word}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-500">No difficult words recorded yet.</span>
            )}
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-white/80 bg-white/80 p-8 shadow-soft backdrop-blur">
          <h2 className="text-lg font-semibold text-ink">Recent sessions</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Started</th>
                  <th className="pb-3">Accuracy</th>
                  <th className="pb-3">Speed</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-50">
                {(profile?.recent_sessions ?? []).map((session) => (
                  <tr key={session.session_id}>
                    <td className="py-3 capitalize text-ink">{session.session_type}</td>
                    <td className="py-3 text-slate-600">{formatSessionDate(session.started_at)}</td>
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
