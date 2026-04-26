import { useMemo } from "react";

import type { SessionSummary } from "../types/profile";

interface ProgressDashboardProps {
  sessions: SessionSummary[];
  avgAccuracy: number;
  avgSpeed: number;
}

export const ProgressDashboard = ({
  sessions,
  avgAccuracy,
  avgSpeed,
}: ProgressDashboardProps) => {
  const trends = useMemo(() => {
    if (sessions.length < 2) {
      return null;
    }

    const sorted = [...sessions].sort(
      (left, right) => new Date(left.started_at).getTime() - new Date(right.started_at).getTime(),
    );
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    return {
      accuracyChange: (last.accuracy_pct ?? 0) - (first.accuracy_pct ?? 0),
      speedChange: (last.speed_wpm ?? 0) - (first.speed_wpm ?? 0),
      spanDays: Math.max(
        1,
        Math.ceil(
          (new Date(last.started_at).getTime() - new Date(first.started_at).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      ),
    };
  }, [sessions]);

  const milestones = useMemo(
    () => [
      { label: "90%+ Accuracy", achieved: avgAccuracy >= 90 },
      { label: "100+ WPM", achieved: avgSpeed >= 100 },
      { label: "10 Sessions", achieved: sessions.length >= 10 },
      { label: "95%+ Accuracy", achieved: avgAccuracy >= 95 },
    ],
    [avgAccuracy, avgSpeed, sessions.length],
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Avg. Accuracy" value={`${avgAccuracy.toFixed(1)}%`} />
        <StatCard label="Avg. Speed" value={`${Math.round(avgSpeed)} WPM`} />
        <StatCard label="Sessions" value={String(sessions.length)} subtitle="logged so far" />
        {trends ? (
          <StatCard
            label="Trend"
            value={`${trends.accuracyChange >= 0 ? "+" : ""}${trends.accuracyChange.toFixed(1)} pts`}
            subtitle={`across ${trends.spanDays} days`}
          />
        ) : null}
      </div>

      <section className="rounded-[2.5rem] border border-white/80 bg-white/80 p-8 shadow-soft backdrop-blur">
        <h3 className="text-lg font-semibold text-ink">Milestones</h3>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {milestones.map((milestone) => (
            <div
              key={milestone.label}
              className={`rounded-[1.5rem] border p-5 transition ${
                milestone.achieved ? "border-sea/20 bg-[#eef6ff] shadow-sm" : "border-sky-50 bg-white"
              }`}
            >
              <p className={`text-sm font-semibold ${milestone.achieved ? "text-sea" : "text-slate-500"}`}>
                {milestone.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {sessions.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-ink">Recent Sessions</h3>
          <div className="space-y-2">
            {[...sessions].slice(0, 5).map((session) => (
              <SessionTimelineItem key={session.session_id} session={session} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
};

const StatCard = ({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string;
  subtitle?: string;
}) => (
  <div className="rounded-[1.5rem] border border-sky-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
    <p className="text-xs font-bold uppercase tracking-widest text-sky-400">{label}</p>
    <p className="mt-3 text-3xl font-bold tracking-tight text-ink">{value}</p>
    {subtitle ? <p className="mt-2 text-sm font-medium text-slate-500">{subtitle}</p> : null}
  </div>
);

const SessionTimelineItem = ({ session }: { session: SessionSummary }) => {
  const date = new Date(session.started_at);
  const accuracyColor =
    (session.accuracy_pct ?? 0) >= 90
      ? "text-emerald-600"
      : (session.accuracy_pct ?? 0) >= 75
        ? "text-amber-600"
        : "text-rose-600";

  return (
    <div className="flex items-center gap-4 rounded-[1.5rem] border border-sky-100 bg-white p-5 shadow-sm transition hover:shadow-soft">
      <div className="h-3 w-3 rounded-full bg-[linear-gradient(135deg,#2f80ed_0%,#4fa6ff_100%)] shadow-sm" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink capitalize">{session.session_type}</p>
        <p className="mt-1 text-xs font-medium text-slate-500">
          {date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
      <div className="text-right">
        <p className={`text-sm font-bold ${accuracyColor}`}>
          {session.accuracy_pct !== null ? `${session.accuracy_pct.toFixed(1)}%` : "--"}
        </p>
        <p className="mt-1 text-xs font-medium text-slate-500">
          {session.speed_wpm !== null ? `${Math.round(session.speed_wpm)} WPM` : "--"}
        </p>
      </div>
    </div>
  );
};
