        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-ink">🏆 Achievements</h2>
            <p className="mt-1 text-sm text-slate-600">
              {unlockedCount} of {achievements.length} unlocked
            </p>
          </div>
          <div className="text-center">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-yellow-300 to-amber-400 flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-amber-900">
                {Math.round((unlockedCount / achievements.length) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-3 w-full rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
            style={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Achievement Categories */}
      {Object.entries(categoryGroups).map(([category, items]) => (
        <section key={category} className="space-y-3">
          <h3 className="text-lg font-semibold text-ink capitalize">
            {category === "accuracy"
              ? "🎯 Accuracy"
              : category === "speed"
                ? "⚡ Speed"
                : category === "consistency"
                  ? "🔥 Consistency"
                  : "🎁 Milestones"}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
        </section>
      ))}

      {/* Tips */}
      <section className="rounded-2xl bg-blue-50 border border-blue-200/50 p-4">
        <p className="text-sm font-medium text-blue-900">
          💡 Keep practicing to unlock more achievements and track your progress!
        </p>
      </section>
    </div>
  );
};

interface AchievementCardProps {
  achievement: Achievement;
}

const AchievementCard = ({ achievement }: AchievementCardProps) => {
  const isUnlocked = Boolean(achievement.unlockedAt);

  return (
    <div
      className={`rounded-xl p-4 border transition-all ${
        isUnlocked
          ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300 shadow-md"
          : "bg-slate-50 border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div
            className={`text-3xl ${!isUnlocked && "opacity-40 grayscale"}`}
          >
            {achievement.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-semibold ${!isUnlocked && "text-slate-500"}`}>
              {achievement.name}
            </p>
            <p className={`text-xs ${isUnlocked ? "text-slate-600" : "text-slate-400"}`}>
              {achievement.description}
            </p>
          </div>
        </div>
        {isUnlocked && (
          <span className="flex-shrink-0 inline-block px-2 py-1 rounded text-xs font-bold bg-green-200 text-green-900">
            ✓
          </span>
        )}
      </div>

      {/* Progress bar */}
      {achievement.progress !== undefined && achievement.progress < 100 && (
        <div className="mt-3 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isUnlocked
                ? "bg-gradient-to-r from-green-400 to-emerald-500"
                : "bg-gradient-to-r from-blue-400 to-cyan-500"
            }`}
            style={{ width: `${achievement.progress}%` }}
          />
        </div>
      )}

      {achievement.progress !== undefined && achievement.progress < 100 && (
        <p className="mt-1 text-xs text-slate-600">
          {Math.round(achievement.progress)}% progress
        </p>
      )}
    </div>
  );
};
import { useMemo } from "react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "accuracy" | "speed" | "consistency" | "milestone";
  unlockedAt?: string;
  progress?: number; // 0-100
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
  const achievements = useMemo(() => {
    const all: Achievement[] = [
      // Accuracy Badges
      {
        id: "accuracy-75",
        name: "Getting There",
        description: "Reach 75% accuracy",
        icon: "🎯",
        category: "accuracy",
        unlockedAt: avgAccuracy >= 75 ? new Date().toISOString() : undefined,
        progress: Math.min((avgAccuracy / 75) * 100, 100),
      },
      {
        id: "accuracy-90",
        name: "Accurate Reader",
        description: "Achieve 90% accuracy",
        icon: "✅",
        category: "accuracy",
        unlockedAt: avgAccuracy >= 90 ? new Date().toISOString() : undefined,
        progress: Math.min((avgAccuracy / 90) * 100, 100),
      },
      {
        id: "accuracy-95",
        name: "Precision Master",
        description: "Reach 95% accuracy",
        icon: "🏅",
        category: "accuracy",
        unlockedAt: avgAccuracy >= 95 ? new Date().toISOString() : undefined,
        progress: Math.min((avgAccuracy / 95) * 100, 100),
      },
      {
        id: "accuracy-perfect",
        name: "Flawless",
        description: "Achieve 100% accuracy in a session",
        icon: "💎",
        category: "accuracy",
        progress: personalBestAccuracy >= 100 ? 100 : Math.min((personalBestAccuracy / 100) * 100, 100),
      },

      // Speed Badges
      {
        id: "speed-80",
        name: "Picking Up Pace",
        description: "Read at 80 WPM",
        icon: "⚡",
        category: "speed",
        unlockedAt: avgSpeed >= 80 ? new Date().toISOString() : undefined,
        progress: Math.min((avgSpeed / 80) * 100, 100),
      },
      {
        id: "speed-100",
        name: "Speed Reader",
        description: "Reach 100 WPM",
        icon: "🚀",
        category: "speed",
        unlockedAt: avgSpeed >= 100 ? new Date().toISOString() : undefined,
        progress: Math.min((avgSpeed / 100) * 100, 100),
      },
      {
        id: "speed-150",
        name: "Lightning Fast",
        description: "Achieve 150 WPM",
        icon: "⚡⚡",
        category: "speed",
        unlockedAt: avgSpeed >= 150 ? new Date().toISOString() : undefined,
        progress: Math.min((avgSpeed / 150) * 100, 100),
      },
      {
        id: "speed-pb",
        name: "Personal Best",
        description: "Set a new personal WPM record",
        icon: "🏃",
        category: "speed",
        unlockedAt: personalBestWPM > 0 ? new Date().toISOString() : undefined,
        progress: Math.min((personalBestWPM / 150) * 100, 100),
      },

      // Consistency Badges
      {
        id: "streak-7",
        name: "On Fire",
        description: "Maintain 7-day streak",
        icon: "🔥",
        category: "consistency",
        unlockedAt: currentStreak >= 7 ? new Date().toISOString() : undefined,
        progress: Math.min((currentStreak / 7) * 100, 100),
      },
      {
        id: "streak-30",
        name: "Dedicated",
        description: "30-day reading streak",
        icon: "🏆",
        category: "consistency",
        unlockedAt: currentStreak >= 30 ? new Date().toISOString() : undefined,
        progress: Math.min((currentStreak / 30) * 100, 100),
      },
      {
        id: "sessions-10",
        name: "Getting Started",
        description: "Complete 10 sessions",
        icon: "📚",
        category: "consistency",
        unlockedAt: totalSessions >= 10 ? new Date().toISOString() : undefined,
        progress: Math.min((totalSessions / 10) * 100, 100),
      },
      {
        id: "sessions-50",
        name: "Dedicated Reader",
        description: "Complete 50 sessions",
        icon: "📖",
        category: "consistency",
        unlockedAt: totalSessions >= 50 ? new Date().toISOString() : undefined,
        progress: Math.min((totalSessions / 50) * 100, 100),
      },

      // Milestone Badges
      {
        id: "first-session",
        name: "First Step",
        description: "Complete your first session",
        icon: "🎯",
        category: "milestone",
        unlockedAt: totalSessions >= 1 ? new Date().toISOString() : undefined,
        progress: totalSessions >= 1 ? 100 : 0,
      },
      {
        id: "improvement",
        name: "Keep Growing",
        description: "Show improvement week-over-week",
        icon: "📈",
        category: "milestone",
        unlockedAt: avgAccuracy > 0 ? new Date().toISOString() : undefined,
        progress: Math.min((avgAccuracy / 80) * 100, 100),
      },
    ];

    return all;
  }, [avgAccuracy, avgSpeed, totalSessions, currentStreak, personalBestWPM, personalBestAccuracy]);

  const unlockedCount = useMemo(
    () => achievements.filter((a) => a.unlockedAt).length,
    [achievements]
  );

  const categoryGroups = useMemo(() => {
    return {
      accuracy: achievements.filter((a) => a.category === "accuracy"),
      speed: achievements.filter((a) => a.category === "speed"),
      consistency: achievements.filter((a) => a.category === "consistency"),
      milestone: achievements.filter((a) => a.category === "milestone"),
    };
  }, [achievements]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200/50 p-6">

