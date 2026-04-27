import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, User, BarChart3, Brain, Calendar, Target } from "lucide-react";
import { ProgressChart } from "../components/ProgressChart";
import { useStudentProfileQuery, useStudentProgressQuery } from "../hooks/useProfileQueries";

export const StudentDetailPage = () => {
  const { id } = useParams();
  const parsedStudentId = Number(id);
  const profileQuery = useStudentProfileQuery(parsedStudentId);
  const progressQuery = useStudentProgressQuery(parsedStudentId);
  const profile = profileQuery.data;
  const progress = progressQuery.data;

  const stats = {
    accuracy_history: progress?.entries.map(e => ({
      date: new Date(e.date).toLocaleDateString(),
      accuracy: e.accuracy_pct
    })) ?? [],
  };

  return (
    <div className="space-y-8 py-4 relative z-10">
      <Link 
        to="/teacher-dashboard" 
        className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black uppercase tracking-widest text-xs transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Mission Control
      </Link>

      <header className="pb-8 border-b-4 border-slate-200">
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 rounded-[2rem] bg-indigo-500 border-b-8 border-indigo-600 flex items-center justify-center text-white text-3xl font-black">
            {profile?.email?.[0].toUpperCase() ?? "S"}
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">{profile?.email ?? "Explorer"}</h1>
            <div className="flex items-center gap-4 mt-2">
               <span className="px-4 py-1.5 rounded-full bg-indigo-50 border-2 border-indigo-100 text-[10px] font-black uppercase tracking-widest text-indigo-500">
                  Explorer ID: #{id}
               </span>
               <span className="px-4 py-1.5 rounded-full bg-emerald-50 border-2 border-emerald-100 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                  Status: Active
               </span>
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Accuracy", value: `${profile?.avg_accuracy_pct.toFixed(0)}%`, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", icon: <Target className="w-8 h-8" /> },
          { label: "Level", value: profile?.reading_level ?? "B1", color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-200", icon: <BarChart3 className="w-8 h-8" /> },
          { label: "Pace", value: `${profile?.avg_speed_wpm.toFixed(0)} WPM`, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", icon: <Calendar className="w-8 h-8" /> },
          { label: "Focus", value: `${Math.round((profile?.attention_score ?? 0) * 100)}%`, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", icon: <Brain className="w-8 h-8" /> }
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`card-clean p-8 ${stat.bg} ${stat.border} border-2 shadow-[0_8px_0_0_rgba(0,0,0,0.05)]`}
          >
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white border-2 ${stat.border} ${stat.color}`}>
              {stat.icon}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-clean p-10"
        >
          <h2 className="text-2xl font-black text-slate-800 mb-8">Reading Progress</h2>
          <div className="h-72 bg-slate-50 rounded-2xl border-2 border-slate-100 p-6">
             {stats.accuracy_history.length > 0 ? (
               <ProgressChart data={stats.accuracy_history} />
             ) : (
               <div className="h-full flex items-center justify-center text-slate-300 font-bold italic">No data available for this explorer.</div>
             )}
          </div>
        </motion.section>

        <div className="space-y-8">
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-clean p-10 bg-amber-50 border-amber-200 shadow-[0_8px_0_0_#fef3c7]"
          >
            <h2 className="text-2xl font-black text-amber-900 mb-6">Difficult Words</h2>
            <div className="flex flex-wrap gap-3">
              {(progress?.difficult_words ?? []).length > 0 ? (
                (progress?.difficult_words ?? []).map((word, i) => (
                  <span
                    key={word}
                    className="rounded-xl bg-white border-2 border-amber-200 px-5 py-3 text-sm font-black text-amber-700 shadow-sm"
                  >
                    {word}
                  </span>
                ))
              ) : (
                <p className="text-amber-400 font-bold italic">No words flagged yet.</p>
              )}
            </div>
          </motion.section>

          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-clean p-10"
          >
            <h2 className="text-2xl font-black text-slate-800 mb-6">Session Logs</h2>
            <div className="space-y-4">
              {(profile?.recent_sessions ?? []).slice(0, 5).map((session) => (
                <div key={session.session_id} className="flex items-center justify-between p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl group hover:bg-white hover:border-sky-200 transition-all">
                  <div>
                    <p className="text-sm font-black text-slate-900 capitalize">{session.session_type}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                      {new Date(session.started_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-sky-500">{session.accuracy_pct}%</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{session.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};
