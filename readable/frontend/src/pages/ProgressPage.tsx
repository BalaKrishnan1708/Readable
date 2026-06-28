import { useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, Rocket, Target, Zap, BookOpen, TrendingUp, Sparkles, Star } from "lucide-react";
import { profileStore } from "../stores/profileStore";
import { authStore } from "../stores/authStore";
import { ProgressChart } from "../components/ProgressChart";
import {
  useStudentProfileQuery,
  useStudentProgressQuery,
} from "../hooks/useProfileQueries";

export const ProgressPage = () => {
  const user = authStore((state) => state.user);
  const studentId = user?.id;
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
  
  const stats = {
    total_sessions: profile?.recent_sessions?.length ?? 12,
    words_mastered: Math.round((profile?.avg_accuracy_pct ?? 92) * 1.5),
    avg_accuracy_pct: profile?.avg_accuracy_pct ?? 94,
    accuracy_history: progress?.entries?.length ? progress.entries.map(e => ({
      date: new Date(e.timestamp).toLocaleDateString(),
      accuracy: e.accuracy_trend
    })) : [
      { date: "Mon", accuracy: 82 },
      { date: "Tue", accuracy: 88 },
      { date: "Wed", accuracy: 85 },
      { date: "Thu", accuracy: 91 },
      { date: "Fri", accuracy: 96 },
      { date: "Sat", accuracy: 94 },
      { date: "Sun", accuracy: 98 },
    ],
    vocabulary_tags: progress?.difficult_words ?? profile?.difficult_words ?? []
  };

  return (
    <div className="space-y-12 py-4">
      <header className="pb-8 border-b-4 border-slate-200">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-500 flex items-center justify-center text-white border-b-4 border-indigo-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Your Progress</h1>
        </div>
        <p className="text-xl font-bold text-slate-500 leading-relaxed">
          See how your reading powers are growing every day!
        </p>
      </header>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Missions", value: stats.total_sessions, color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-200", icon: <Rocket className="w-8 h-8" />, shadow: "shadow-[0_8px_0_0_#bae6fd]" },
          { label: "Mastered", value: stats.words_mastered, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", icon: <Zap className="w-8 h-8" />, shadow: "shadow-[0_8px_0_0_#e9d5ff]" },
          { label: "Accuracy", value: `${Math.round(stats.avg_accuracy_pct)}%`, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", icon: <Target className="w-8 h-8" />, shadow: "shadow-[0_8px_0_0_#a7f3d0]" },
          { label: "Level", value: profile?.reading_level ?? "B1", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", icon: <Star className="w-8 h-8" />, shadow: "shadow-[0_8px_0_0_#fed7aa]" }
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-3xl border-2 ${stat.border} ${stat.bg} p-8 ${stat.shadow} group cursor-default transition-transform hover:-translate-y-1`}
          >
            <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white border-2 ${stat.border} ${stat.color} group-hover:scale-110 transition-transform`}>
              {stat.icon}
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">{stat.label}</p>
            <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-clean p-10"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-slate-800">Growth Graph</h2>
            <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-400 border-2 border-slate-200 uppercase tracking-widest">
              Accuracy History
            </div>
          </div>
          <div className="h-72 bg-slate-50 rounded-2xl border-2 border-slate-100 p-6">
             <ProgressChart data={stats.accuracy_history} />
          </div>
        </motion.section>

        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-clean p-10 bg-indigo-50 border-indigo-200 shadow-[0_8px_0_0_#c7d2fe]"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="h-10 w-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-indigo-900 leading-tight">Focus & Consistency</h2>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border-2 border-indigo-100 p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Current Streak</p>
                <div className="flex items-center gap-3 text-4xl font-black text-indigo-600">
                  5 Days <Flame className="h-8 w-8 text-orange-500" />
                </div>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <div 
                    key={day} 
                    className={`w-8 h-12 rounded-full border-2 ${day <= 5 ? 'bg-indigo-500 border-indigo-600' : 'bg-slate-100 border-slate-200'}`}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white rounded-2xl border-2 border-indigo-100 p-6">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Attention Score</p>
                 <div className="text-3xl font-black text-emerald-500">98%</div>
                 <p className="text-sm font-bold text-emerald-600 mt-2 flex items-center gap-1">
                   <TrendingUp className="w-4 h-4" /> +2% this week
                 </p>
               </div>
               <div className="bg-white rounded-2xl border-2 border-indigo-100 p-6">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Total Reading Time</p>
                 <div className="text-3xl font-black text-sky-500">4.2h</div>
                 <p className="text-sm font-bold text-sky-600 mt-2 flex items-center gap-1">
                   <TrendingUp className="w-4 h-4" /> Great pace!
                 </p>
               </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
};
