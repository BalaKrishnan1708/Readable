import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { ProgressChart } from "../components/ProgressChart";
import { useStudentProfileQuery, useStudentProgressQuery } from "../hooks/useProfileQueries";
import { profileStore } from "../stores/profileStore";
import { authStore } from "../stores/authStore";

export const StudentDashboardPage = () => {
  const user = authStore((state) => state.user);
  const studentId = user?.id;
  const [contentId, setContentId] = useState("1");
  const profileQuery = useStudentProfileQuery(studentId);
  const progressQuery = useStudentProgressQuery(studentId);
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
            <div className="flex flex-wrap items-center gap-2 rounded-full border border-white/70 bg-white px-3 py-2">
              <input
                value={contentId}
                onChange={(event) => setContentId(event.target.value)}
                className="w-20 border-none bg-transparent text-sm outline-none"
                placeholder="Content ID"
              />
              <Link
                to={`/lesson/1?contentId=${contentId}`}
                className="rounded-full bg-sea px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
              >
                Open Lesson
              </Link>
            </div>
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
