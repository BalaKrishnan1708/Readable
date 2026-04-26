import { useMemo } from "react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "accuracy" | "speed" | "consistency" | "milestone";
  unlockedAt?: string;
  progress?: number;
}

interface AchievementsSystemProps {
  avgAccuracy: number;
  avgSpeed: number;
  totalSessions: number;
  currentStreak: number;
  personalBestWPM: number;
  personalBestAccuracy: number;
}

export const AchievementsSystem = ({
  avgAccuracy,
  avgSpeed,
  totalSessions,
  currentStreak,
  personalBestWPM,
  personalBestAccuracy,
}: AchievementsSystemProps) => {
  const achievements = useMemo<Achievement[]>(() => {
    return [
      {
        id: "accuracy-75",
        name: "Getting There",
        description: "Reach 75% accuracy",
        icon: "Target",
        category: "accuracy",
        unlockedAt: avgAccuracy >= 75 ? new Date().toISOString() : undefined,
        progress: Math.min((avgAccuracy / 75) * 100, 100),
      },
      {
        id: "accuracy-90",
        name: "Accurate Reader",
        description: "Achieve 90% accuracy",
        icon: "Check",
        category: "accuracy",
        unlockedAt: avgAccuracy >= 90 ? new Date().toISOString() : undefined,
        progress: Math.min((avgAccuracy / 90) * 100, 100),
      },
      {
        id: "speed-100",
        name: "Speed Reader",
        description: "Reach 100 WPM",
        icon: "Bolt",
        category: "speed",
        unlockedAt: avgSpeed >= 100 ? new Date().toISOString() : undefined,
        progress: Math.min((avgSpeed / 100) * 100, 100),
      },
      {
        id: "streak-7",
        name: "On Fire",
        description: "Maintain a 7-day streak",
        icon: "Flame",
        category: "consistency",
        unlockedAt: currentStreak >= 7 ? new Date().toISOString() : undefined,
        progress: Math.min((currentStreak / 7) * 100, 100),
      },
      {
        id: "sessions-10",
        name: "Getting Started",
        description: "Complete 10 sessions",
        icon: "Book",
        category: "milestone",
        unlockedAt: totalSessions >= 10 ? new Date().toISOString() : undefined,
        progress: Math.min((totalSessions / 10) * 100, 100),
      },
      {
        id: "pb-accuracy",
        name: "Precision Master",
        description: "Hit a personal-best accuracy score",
        icon: "Trophy",
        category: "milestone",
        unlockedAt: personalBestAccuracy >= 95 ? new Date().toISOString() : undefined,
        progress: Math.min((personalBestAccuracy / 95) * 100, 100),
      },
      {
        id: "pb-speed",
        name: "Pace Breaker",
        description: "Set a strong personal speed record",
        icon: "Rocket",
        category: "speed",
        unlockedAt: personalBestWPM >= 120 ? new Date().toISOString() : undefined,
        progress: Math.min((personalBestWPM / 120) * 100, 100),
      },
    ];
  }, [avgAccuracy, avgSpeed, currentStreak, personalBestAccuracy, personalBestWPM, totalSessions]);

  const unlockedCount = achievements.filter((achievement) => achievement.unlockedAt).length;
  const grouped = useMemo(
    () => ({
      accuracy: achievements.filter((achievement) => achievement.category === "accuracy"),
      speed: achievements.filter((achievement) => achievement.category === "speed"),
      consistency: achievements.filter((achievement) => achievement.category === "consistency"),
      milestone: achievements.filter((achievement) => achievement.category === "milestone"),
    }),
    [achievements],
  );

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] bg-gradient-to-r from-amber-50 to-rose-50 p-6 shadow-soft">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-ink">Achievements</h2>
            <p className="mt-1 text-sm text-slate-600">
              {unlockedCount} of {achievements.length} unlocked
            </p>
          </div>
          <div className="rounded-full bg-white px-5 py-4 text-center shadow-soft">
            <p className="text-2xl font-semibold text-ink">
              {Math.round((unlockedCount / achievements.length) * 100)}%
            </p>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">complete</p>
          </div>
        </div>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/70">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-400"
            style={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
          />
        </div>
      </div>

      {Object.entries(grouped).map(([category, items]) => (
        <section key={category} className="space-y-3">
          <h3 className="text-lg font-semibold capitalize text-ink">{category}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

const AchievementCard = ({ achievement }: { achievement: Achievement }) => {
  const unlocked = Boolean(achievement.unlockedAt);

  return (
    <div
      className={`rounded-[1.25rem] border p-4 transition ${
        unlocked ? "border-amber-300 bg-amber-50 shadow-soft" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">{achievement.name}</p>
          <p className="mt-1 text-sm text-slate-500">{achievement.description}</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
          {achievement.icon}
        </span>
      </div>
      {typeof achievement.progress === "number" ? (
        <>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${unlocked ? "bg-amber-400" : "bg-sea"}`}
              style={{ width: `${achievement.progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">{Math.round(achievement.progress)}% progress</p>
        </>
      ) : null}
    </div>
  );
};
