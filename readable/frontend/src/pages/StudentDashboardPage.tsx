import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Rocket, BookOpen, Target, Zap, Sparkles, Award, PlayCircle, BarChart3, Brain, Globe } from "lucide-react";
import { motion } from "framer-motion";

import { authStore } from "../stores/authStore";
import { profileStore } from "../stores/profileStore";
import {
  useStudentLessonsQuery,
  useStudentProfileQuery,
  useStudentProgressQuery,
} from "../hooks/useProfileQueries";

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
  const lessons = lessonsQuery.data ?? [];

  return (
    <div className="space-y-8 py-4">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b-4 border-slate-200">
        <div>
          <h1 className="text-5xl font-black text-slate-900 leading-tight">
            Hi, {user?.name?.split(' ')[0] || 'Explorer'}! 👋
          </h1>
          <p className="mt-2 text-xl font-bold text-slate-500">Ready for today's reading mission?</p>
        </div>
        <Link
          to="/diagnostic"
          className="btn-3d flex items-center gap-3 rounded-2xl bg-sky-500 border-sky-600 px-8 py-4 text-lg font-black text-white hover:bg-sky-400 active:bg-sky-600"
        >
          <Rocket className="w-6 h-6" />
          Start Quest
        </Link>
      </header>

      <section className="grid gap-6 md:grid-cols-12">
        {/* Practice Streak - Clean Bento */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-clean md:col-span-8 p-8 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  import("react-hot-toast").then((module) => {
                    module.default.success("Streak protected! Keep reading every day.", { icon: "🔥", style: { borderRadius: '1rem', border: '2px solid #fdba74' } });
                  });
                }}
                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-3xl border-2 border-orange-200 shadow-sm cursor-pointer"
              >
                🔥
              </motion.button>
              <div>
                <h3 className="text-2xl font-black text-slate-900">7 Day Streak!</h3>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Keep it up!</p>
              </div>
            </div>
            <div className="hidden sm:flex gap-2">
              {['M','T','W','T','F','S','S'].map((day, i) => (
                <div 
                  key={i} 
                  className={`h-10 w-10 rounded-xl flex items-center justify-center font-black border-2 transition-colors ${
                    i < 4 ? 'bg-orange-500 border-orange-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-300'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-8">
            <div className="flex items-center justify-between text-sm font-black text-slate-500 mb-3 uppercase tracking-widest">
              <span>Daily Goal Progress</span>
              <span className="text-sky-600">65% Complete</span>
            </div>
            <div className="h-6 w-full rounded-2xl bg-slate-100 border-2 border-slate-200 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '65%' }}
                className="h-full bg-sky-500 border-r-4 border-sky-600"
              />
            </div>
          </div>
        </motion.div>

        {/* Stats Summary - Clean Bento */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-clean md:col-span-4 p-8 bg-sky-50 border-sky-200 shadow-[0_8px_0_0_#bae6fd]"
        >
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500 text-white border-b-4 border-sky-600 mb-4">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-sky-900">Level 5</h3>
              <p className="text-sky-700 font-bold mt-1 uppercase tracking-widest text-xs">Star Reader</p>
            </div>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between font-black text-sky-900">
                <span>Accuracy</span>
                <span>{profile?.avg_accuracy_pct.toFixed(0) || 0}%</span>
              </div>
              <div className="flex items-center justify-between font-black text-sky-900">
                <span>Speed</span>
                <span>{profile?.avg_speed_wpm.toFixed(0) || 0} WPM</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Lesson Library */}
      <section className="mt-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-indigo-500" />
            Reading Library
          </h2>
          <span className="font-black text-slate-400 uppercase tracking-widest text-sm">
            {lessons.length + 1} Missions Available
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Static Solar System Lesson */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Link
              to="/planets"
              className="card-clean block p-8 group bg-indigo-50 border-indigo-200 shadow-[0_8px_0_0_#c7d2fe]"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <span className="px-4 py-1.5 rounded-full bg-indigo-500 border-b-4 border-indigo-600 text-[10px] font-black uppercase tracking-widest text-white">
                    Special Mission
                  </span>
                  <Globe className="w-5 h-5 text-indigo-500 animate-spin-slow" />
                </div>
                <h3 className="text-2xl font-black text-indigo-900 group-hover:text-indigo-600 transition-colors leading-tight">
                  Solar System Journey
                </h3>
                <p className="mt-4 text-indigo-700 font-bold line-clamp-2">
                  Explore the Sun, planets, and moons in our celestial neighborhood!
                </p>
                <div className="mt-8 pt-6 border-t-2 border-indigo-200 flex items-center justify-between">
                  <div className="flex gap-2">
                     <div className="h-2 w-8 rounded-full bg-indigo-300" />
                     <div className="h-2 w-8 rounded-full bg-indigo-300" />
                  </div>
                  <span className="font-black text-indigo-600 uppercase tracking-widest text-xs group-hover:translate-x-1 transition-transform">
                    Explore Now →
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Static Demo Lesson */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
          >
            <Link
              to="/lesson/2?contentId=1"
              className="card-clean block p-8 group bg-sky-50 border-sky-200 shadow-[0_8px_0_0_#bae6fd]"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <span className="px-4 py-1.5 rounded-full bg-sky-500 border-b-4 border-sky-600 text-[10px] font-black uppercase tracking-widest text-white">
                    Demo Mission
                  </span>
                  <Sparkles className="w-5 h-5 text-sky-500" />
                </div>
                <h3 className="text-2xl font-black text-sky-900 group-hover:text-sky-600 transition-colors leading-tight">
                  Sample Reading Text
                </h3>
                <p className="mt-4 text-sky-700 font-bold line-clamp-2">
                  Test out the reading interface and reading tools with this sample text!
                </p>
                <div className="mt-8 pt-6 border-t-2 border-sky-200 flex items-center justify-between">
                  <div className="flex gap-2">
                     <div className="h-2 w-8 rounded-full bg-sky-300" />
                     <div className="h-2 w-8 rounded-full bg-sky-300" />
                  </div>
                  <span className="font-black text-sky-600 uppercase tracking-widest text-xs group-hover:translate-x-1 transition-transform">
                    Explore Now →
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>

          {lessons.map((lesson, i) => (
            <motion.div
              key={lesson.personalized_content_id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: (i + 1) * 0.05 }}
            >
              <Link
                to={`/lesson/${lesson.lesson_id}?contentId=${lesson.personalized_content_id}`}
                className="card-clean block p-8 group"
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-6">
                    <span className="px-4 py-1.5 rounded-full bg-slate-100 border-2 border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Mission {i + 1}
                    </span>
                    <Sparkles className="w-5 h-5 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 group-hover:text-sky-600 transition-colors leading-tight">
                    {lesson.title}
                  </h3>
                  <p className="mt-4 text-slate-500 font-medium line-clamp-2">
                    {lesson.preview_text}
                  </p>
                  <div className="mt-8 pt-6 border-t-2 border-slate-100 flex items-center justify-between">
                    <div className="flex gap-2">
                      {lesson.support_focus.slice(0, 2).map(f => (
                        <div key={f} className="h-2 w-8 rounded-full bg-sky-200" />
                      ))}
                    </div>
                    <span className="font-black text-sky-500 uppercase tracking-widest text-xs group-hover:translate-x-1 transition-transform">
                      Play Now →
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* History Grid */}
      <section className="mt-12 bg-slate-50 rounded-[3rem] p-10 border-2 border-slate-200 border-dashed">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-10 w-10 rounded-xl bg-slate-200 flex items-center justify-center text-slate-500">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-700">Recent Quests</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(profile?.recent_sessions || []).slice(0, 4).map((session, i) => (
            <div key={session.session_id} className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <p className="font-black text-slate-400 text-[10px] uppercase tracking-widest">
                  {new Date(session.started_at).toLocaleDateString()}
                </p>
                <div className={`h-2 w-2 rounded-full ${session.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </div>
              <p className="text-lg font-black text-slate-800 capitalize">{session.session_type}</p>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accuracy</span>
                  <span className="text-lg font-black text-emerald-600">{session.accuracy_pct}%</span>
                </div>
                <div className="h-8 w-[2px] bg-slate-100" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Speed</span>
                  <span className="text-lg font-black text-sky-600">{session.speed_wpm}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
