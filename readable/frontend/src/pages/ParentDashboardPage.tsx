import React from "react";
import { authStore } from "../stores/authStore";
import { Link } from "react-router-dom";
import { Activity, Target, Zap, Clock, User, ChevronRight } from "lucide-react";

export const ParentDashboardPage = () => {
  const user = authStore((state) => state.user);
  
  // Hardcoded static data for demonstration purposes
  const staticChildren = [
    {
      student_id: 2,
      name: "Ava",
      reading_level: "3",
      avg_speed_wpm: 85,
      avg_accuracy_pct: 92,
      attention_score: 88,
      recent_sessions_count: 14
    },
    {
      student_id: 3,
      name: "Noah",
      reading_level: "2",
      avg_speed_wpm: 65,
      avg_accuracy_pct: 85,
      attention_score: 75,
      recent_sessions_count: 8
    }
  ];

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b-2 border-slate-100">
        <div>
          <span className="px-4 py-1.5 rounded-full bg-emerald-100 border-2 border-emerald-200 text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-4 inline-block">
            Parent Portal
          </span>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Welcome back, {user?.email?.split("@")[0] || "Parent"}!
          </h1>
          <p className="mt-2 text-lg font-bold text-slate-500">
            Here's how your explorers are doing.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {staticChildren.map((child) => (
          <div key={child.student_id} className="bg-white rounded-3xl border-4 border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="p-8 border-b-4 border-slate-50 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-slate-800">{child.name}</h2>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">
                  Level {child.reading_level} Explorer
                </p>
              </div>
              <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center rotate-3">
                <User className="w-8 h-8 text-sky-600" />
              </div>
            </div>

            <div className="p-8">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Performance Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-sky-50 rounded-2xl p-5 border-2 border-sky-100">
                  <div className="flex items-center gap-2 mb-2 text-sky-600">
                    <Zap className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Reading Speed</span>
                  </div>
                  <p className="text-3xl font-black text-sky-900">
                    {child.avg_speed_wpm}
                    <span className="text-sm text-sky-600 ml-1">WPM</span>
                  </p>
                </div>

                <div className="bg-emerald-50 rounded-2xl p-5 border-2 border-emerald-100">
                  <div className="flex items-center gap-2 mb-2 text-emerald-600">
                    <Target className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Accuracy</span>
                  </div>
                  <p className="text-3xl font-black text-emerald-900">
                    {child.avg_accuracy_pct}
                    <span className="text-sm text-emerald-600 ml-1">%</span>
                  </p>
                </div>

                <div className="bg-indigo-50 rounded-2xl p-5 border-2 border-indigo-100">
                  <div className="flex items-center gap-2 mb-2 text-indigo-600">
                    <Activity className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Focus Score</span>
                  </div>
                  <p className="text-3xl font-black text-indigo-900">
                    {child.attention_score}
                    <span className="text-sm text-indigo-600 ml-1">/100</span>
                  </p>
                </div>

                <div className="bg-amber-50 rounded-2xl p-5 border-2 border-amber-100">
                  <div className="flex items-center gap-2 mb-2 text-amber-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Sessions</span>
                  </div>
                  <p className="text-3xl font-black text-amber-900">
                    {child.recent_sessions_count}
                  </p>
                </div>
              </div>

              <Link
                to={`/students/${child.student_id}`}
                className="mt-8 w-full flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-colors"
              >
                View Detailed Progress <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
