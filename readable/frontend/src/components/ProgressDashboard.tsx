    <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-white/60 hover:shadow-md transition">
      <div className="flex-shrink-0">
        <div className="w-2 h-2 rounded-full bg-sea" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink">
          {session.session_type === "diagnostic" ? "📊 Diagnostic" : "📖 Reading"}
        </p>
        <p className="text-xs text-slate-500">{dateStr}</p>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className={`text-sm font-semibold ${accuracyColor}`}>
          {session.accuracy_pct ? `${session.accuracy_pct.toFixed(1)}%` : "--"}
        </p>
        <p className="text-xs text-slate-600">
          {session.speed_wpm ? `${Math.round(session.speed_wpm)} WPM` : "--"}
        </p>
      </div>
    </div>
  );
};
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
  // Calculate trends
  const trends = useMemo(() => {
    if (sessions.length < 2) return null;

    const sorted = [...sessions].sort(
      (a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime()
    );

    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    const accuracyImprovement =
      ((last.accuracy_pct ?? 0) - (first.accuracy_pct ?? 0)) /
      Math.max(first.accuracy_pct ?? 1, 1);
    const speedImprovement =
      ((last.speed_wpm ?? 0) - (first.speed_wpm ?? 0)) /
      Math.max(first.speed_wpm ?? 1, 1);

    return {
      accuracyChange: accuracyImprovement * 100,
      speedChange: speedImprovement * 100,
      sessionsCompleted: sorted.length,
      daySpan: Math.max(
        Math.ceil(
          (new Date(last.started_at).getTime() -
            new Date(first.started_at).getTime()) /
            (1000 * 60 * 60 * 24)
        ),
        1
      ),
    };
  }, [sessions]);

  // Calculate milestones
  const milestones = useMemo(() => {
    const acc = avgAccuracy;
    const speed = avgSpeed;

    return [
      { icon: "✅", label: "90%+ Accuracy", achieved: acc >= 90 },
      { icon: "⚡", label: "100+ WPM", achieved: speed >= 100 },
      { icon: "🎯", label: "150+ WPM", achieved: speed >= 150 },
      { icon: "🏆", label: "95%+ Accuracy", achieved: acc >= 95 },
    ];
  }, [avgAccuracy, avgSpeed]);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Avg. Accuracy" value={`${avgAccuracy.toFixed(1)}%`} />
        <StatCard label="Avg. Speed" value={`${Math.round(avgSpeed)} WPM`} />
        <StatCard
          label="Sessions"
          value={`${sessions.length}`}
          subtitle="total completed"
        />
        {trends && (
          <StatCard
            label="Accuracy Trend"
            value={`${trends.accuracyChange > 0 ? "+" : ""}${trends.accuracyChange.toFixed(1)}%`}
            subtitle={`over ${trends.daySpan} days`}
            tint={trends.accuracyChange > 0 ? "text-green-600" : "text-slate-600"}
          />
        )}
      </div>

      {/* Milestones */}
      <section className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50 p-6">
        <h3 className="text-lg font-semibold text-ink flex items-center gap-2">
          🏅 Milestones
        </h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {milestones.map((milestone) => (
            <div
              key={milestone.label}
              className={`flex items-center gap-3 p-3 rounded-lg transition ${
                milestone.achieved
                  ? "bg-white border-2 border-green-300 shadow-sm"
                  : "bg-white/50 border border-amber-200/30"
              }`}
            >
              <span className="text-2xl">{milestone.icon}</span>
              <span
                className={`font-medium text-sm ${
                  milestone.achieved ? "text-green-700" : "text-slate-600"
                }`}
              >
                {milestone.label}
              </span>
              {milestone.achieved && (
                <span className="ml-auto text-xs font-bold text-green-600">
                  UNLOCKED
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Session Timeline */}
      {sessions.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-ink">📅 Recent Sessions</h3>
          <div className="space-y-2">
            {[...sessions]
              .reverse()
              .slice(0, 5)
              .map((session, idx) => (
                <SessionTimelineItem key={session.session_id} session={session} />
              ))}
          </div>
        </section>
      )}

      {/* Tips */}
      <section className="rounded-2xl bg-gradient-to-r from-sea/5 to-teal-50/30 border border-sea/20 p-6">
        <h3 className="text-lg font-semibold text-ink flex items-center gap-2">
          💡 Tips for Improvement
        </h3>
        <ul className="mt-4 space-y-2 text-sm text-slate-700">
          <li className="flex gap-2">
            <span className="flex-shrink-0">📌</span>
            <span>
              Practice daily for 15-20 minutes. Consistency beats long sessions.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="flex-shrink-0">🎯</span>
            <span>Focus on the words tagged as difficult. They're your growth areas.</span>
          </li>
          <li className="flex gap-2">
            <span className="flex-shrink-0">🎧</span>
            <span>
              Take breaks between sessions to avoid fatigue affecting your scores.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="flex-shrink-0">📈</span>
            <span>
              Your improvements compound over time. Small gains lead to big wins!
            </span>
          </li>
        </ul>
      </section>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  tint?: string;
}

const StatCard = ({ label, value, subtitle, tint = "text-slate-600" }: StatCardProps) => (
  <div className="rounded-2xl bg-white border border-white/60 p-4 shadow-soft">
    <p className="text-xs uppercase tracking-[0.15em] text-slate-500 font-semibold">
      {label}
    </p>
    <p className={`mt-2 text-2xl sm:text-3xl font-bold ${tint}`}>{value}</p>
    {subtitle && <p className="mt-1 text-xs text-slate-600">{subtitle}</p>}
  </div>
);

interface SessionTimelineItemProps {
  session: SessionSummary;
}

const SessionTimelineItem = ({ session }: SessionTimelineItemProps) => {
  const date = new Date(session.started_at);
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const accuracyColor =
    (session.accuracy_pct ?? 0) >= 90
      ? "text-green-600"
      : (session.accuracy_pct ?? 0) >= 75
        ? "text-amber-600"
        : "text-red-600";

  return (

