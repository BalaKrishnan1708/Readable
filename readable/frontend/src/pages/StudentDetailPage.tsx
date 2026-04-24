import { useParams } from "react-router-dom";

import { ProgressChart } from "../components/ProgressChart";
import { useStudentProfileQuery, useStudentProgressQuery } from "../hooks/useProfileQueries";

export const StudentDetailPage = () => {
  const { studentId } = useParams();
  const parsedStudentId = Number(studentId);
  const profileQuery = useStudentProfileQuery(parsedStudentId);
  const progressQuery = useStudentProgressQuery(parsedStudentId);
  const profile = profileQuery.data;
  const progress = progressQuery.data;

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-hero-radial p-8 shadow-soft">
        <p className="text-sm uppercase tracking-[0.25em] text-sea">Student Detail</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">{profile?.email ?? "Student"}</h1>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <div className="rounded-[2rem] bg-white p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Profile stats</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl bg-blush px-4 py-3">Reading level: {profile?.reading_level ?? "Pending"}</div>
            <div className="rounded-2xl bg-mist px-4 py-3">
              Average accuracy: {profile ? `${profile.avg_accuracy_pct.toFixed(1)}%` : "--"}
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-100">
              Average speed: {profile ? `${profile.avg_speed_wpm.toFixed(0)} WPM` : "--"}
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-100">
              Attention: {profile ? `${Math.round(profile.attention_score * 100)}%` : "--"}
            </div>
          </div>
        </div>
        {progress?.entries ? <ProgressChart data={progress.entries} /> : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <div className="rounded-[2rem] bg-white p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Difficult words cloud</h2>
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
          <h2 className="text-lg font-semibold text-ink">Session history</h2>
          <div className="mt-4 space-y-3">
            {(profile?.recent_sessions ?? []).map((session) => (
              <div key={session.session_id} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                <p className="font-semibold capitalize text-ink">{session.session_type}</p>
                <p className="mt-1 text-slate-600">
                  Accuracy {session.accuracy_pct ?? "--"} | Speed {session.speed_wpm ?? "--"} | Status{" "}
                  {session.status}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
