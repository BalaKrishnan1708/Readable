import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  Flame,
  Globe,
  Image,
  Library,
  PlayCircle,
  Rocket,
  Sparkles,
  Target,
  Timer,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { authStore } from "../stores/authStore";
import { profileStore } from "../stores/profileStore";
import {
  useStudentLessonsQuery,
  useStudentProfileQuery,
  useStudentProgressQuery,
} from "../hooks/useProfileQueries";

const featuredLessons = [
  {
    to: "/planets",
    label: "Special Lesson",
    title: "Solar System Journey",
    description: "Explore planets, moons, and orbit clues with guided reading supports.",
    icon: Globe,
    accent: "from-indigo-500 to-sky-500",
    bg: "bg-indigo-50",
    text: "text-indigo-900",
    muted: "text-indigo-700",
  },
  {
    to: "/lesson/2?contentId=1",
    label: "Demo Lesson",
    title: "Sample Reading Text",
    description: "Try the reader, pacer, story map, phonics, and recording tools.",
    icon: Sparkles,
    accent: "from-sky-500 to-teal-400",
    bg: "bg-sky-50",
    text: "text-sky-900",
    muted: "text-sky-700",
  },
  {
    to: "/lesson/3",
    label: "Lesson 3",
    title: "Gallery",
    description: "A visual reading lesson with the existing image gallery.",
    icon: Image,
    accent: "from-orange-400 to-rose-400",
    bg: "bg-orange-50",
    text: "text-orange-950",
    muted: "text-orange-700",
  },
];

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
  const firstName = user?.email?.split("@")[0] || "Explorer";
  const accuracy = Math.round(profile?.avg_accuracy_pct ?? 0);
  const speed = Math.round(profile?.avg_speed_wpm ?? 0);
  const recentSessions = profile?.recent_sessions ?? [];

  return (
    <div className="space-y-10 py-4">
      <header className="surface-panel overflow-hidden rounded-[2rem] p-6 md:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-stretch">
          <div className="flex min-h-[330px] flex-col justify-between rounded-[1.5rem] bg-slate-950 p-7 text-white shadow-2xl shadow-slate-900/20">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-sky-100">
                <Zap className="h-4 w-4 text-orange-300" />
                Adaptive Reading Hub
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-teal-400/15 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-teal-100">
                <CheckCircle2 className="h-4 w-4" />
                {featuredLessons.length + lessons.length} lessons ready
              </span>
            </div>

            <div className="max-w-3xl">
              <h1 className="text-balance text-5xl font-black leading-[1.03] text-white md:text-7xl">
                Hi, {firstName}. Let&apos;s make reading feel effortless.
              </h1>
              <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-slate-300">
                Your tools, lessons, streaks, and progress now sit in one focused command center.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/diagnostic"
                className="btn-3d inline-flex items-center justify-center gap-3 rounded-2xl border-sky-700 bg-sky-500 px-6 py-4 text-base font-black text-white hover:bg-sky-400"
              >
                <Rocket className="h-5 w-5" />
                Start Quest
              </Link>
              <a
                href="#lessons"
                className="inline-flex items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-6 py-4 text-base font-black text-white transition hover:bg-white/15"
              >
                <Library className="h-5 w-5" />
                Browse Lessons
              </a>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <motion.button
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toast.success("Streak protected. One focused read keeps it alive.")}
              className="card-clean p-6 text-left"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                <Flame className="h-6 w-6" />
              </div>
              <p className="text-3xl font-black text-slate-950">7 days</p>
              <p className="mt-1 text-sm font-bold uppercase tracking-widest text-slate-500">Current streak</p>
            </motion.button>

            <div className="card-clean p-6">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
                <Target className="h-6 w-6" />
              </div>
              <p className="text-3xl font-black text-slate-950">{accuracy}%</p>
              <p className="mt-1 text-sm font-bold uppercase tracking-widest text-slate-500">Accuracy</p>
            </div>

            <div className="card-clean p-6">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                <Timer className="h-6 w-6" />
              </div>
              <p className="text-3xl font-black text-slate-950">{speed}</p>
              <p className="mt-1 text-sm font-bold uppercase tracking-widest text-slate-500">Words per min</p>
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-5 md:grid-cols-12">
        <div className="card-clean md:col-span-8 p-6 md:p-7">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Daily Focus</h2>
              <p className="mt-1 font-semibold text-slate-500">Complete one lesson and one voice check.</p>
            </div>
            <Award className="h-8 w-8 text-orange-400" />
          </div>

          <div className="grid gap-3 sm:grid-cols-7">
            {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
              <div
                key={`${day}-${index}`}
                className={`flex h-14 items-center justify-center rounded-2xl border text-lg font-black ${
                  index < 4
                    ? "border-orange-200 bg-orange-50 text-orange-600"
                    : "border-slate-200 bg-slate-50 text-slate-300"
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          <div className="mt-7">
            <div className="mb-3 flex items-center justify-between text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              <span>Goal Progress</span>
              <span className="text-teal-700">65%</span>
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "65%" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-sky-500 via-teal-400 to-orange-400"
              />
            </div>
          </div>
        </div>

        <div className="card-clean md:col-span-4 p-6 md:p-7">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-950">Reader Level</h2>
              <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Star Reader</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              ["Focus", "Strong"],
              ["Support", profile?.reading_level || "Adaptive"],
              ["Next", "Story map"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span className="text-sm font-black uppercase tracking-widest text-slate-400">{label}</span>
                <span className="font-black text-slate-800">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="lessons" className="mt-12 scroll-mt-28">
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-teal-700">
              <BookOpen className="h-4 w-4" />
              Lessons
            </p>
            <h2 className="text-4xl font-black text-slate-950">Reading Library</h2>
          </div>
          <span className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-black uppercase tracking-widest text-slate-500">
            {lessons.length + featuredLessons.length} available
          </span>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {featuredLessons.map((lesson, index) => {
            const Icon = lesson.icon;
            return (
              <motion.div
                key={lesson.to}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={lesson.to} className={`card-clean group block h-full p-7 ${lesson.bg}`}>
                  <div className="flex h-full flex-col">
                    <div className="mb-7 flex items-center justify-between">
                      <span className={`rounded-full bg-gradient-to-r ${lesson.accent} px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white`}>
                        {lesson.label}
                      </span>
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 shadow-sm">
                        <Icon className="h-5 w-5 text-slate-700" />
                      </div>
                    </div>
                    <h3 className={`text-2xl font-black leading-tight ${lesson.text}`}>{lesson.title}</h3>
                    <p className={`mt-4 line-clamp-3 font-semibold leading-7 ${lesson.muted}`}>{lesson.description}</p>
                    <div className="mt-auto flex items-center justify-between pt-8">
                      <div className="flex gap-2">
                        <span className={`h-2 w-9 rounded-full bg-gradient-to-r ${lesson.accent}`} />
                        <span className="h-2 w-9 rounded-full bg-white/70" />
                      </div>
                      <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-700 transition group-hover:translate-x-1">
                        Open <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}

          {lessons.map((lesson, index) => (
            <motion.div
              key={lesson.personalized_content_id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (index + featuredLessons.length) * 0.05 }}
            >
              <Link
                to={`/lesson/${lesson.lesson_id}?contentId=${lesson.personalized_content_id}`}
                className="card-clean group block h-full p-7"
              >
                <div className="flex h-full flex-col">
                  <div className="mb-7 flex items-center justify-between">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Lesson {index + 4}
                    </span>
                    <PlayCircle className="h-6 w-6 text-sky-500 transition group-hover:scale-110" />
                  </div>
                  <h3 className="text-2xl font-black leading-tight text-slate-950 transition group-hover:text-sky-700">
                    {lesson.title}
                  </h3>
                  <p className="mt-4 line-clamp-3 font-semibold leading-7 text-slate-500">{lesson.preview_text}</p>
                  <div className="mt-auto flex items-center justify-between pt-8">
                    <div className="flex gap-2">
                      {lesson.support_focus.slice(0, 2).map((focus) => (
                        <span key={focus} className="h-2 w-9 rounded-full bg-sky-200" />
                      ))}
                    </div>
                    <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-sky-700 transition group-hover:translate-x-1">
                      Play <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-[2rem] border border-slate-200/70 bg-white/55 p-6 backdrop-blur md:p-8">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">Recent Quests</h2>
            <p className="font-semibold text-slate-500">Your last reading sessions at a glance.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {recentSessions.slice(0, 4).map((session) => (
            <div key={session.session_id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {new Date(session.started_at).toLocaleDateString()}
                </p>
                <div className={`h-2.5 w-2.5 rounded-full ${session.status === "completed" ? "bg-emerald-500" : "bg-amber-500"}`} />
              </div>
              <p className="text-lg font-black capitalize text-slate-800">{session.session_type}</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-emerald-50 p-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Accuracy</span>
                  <p className="text-lg font-black text-emerald-700">{session.accuracy_pct}%</p>
                </div>
                <div className="rounded-xl bg-sky-50 p-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-sky-700">Speed</span>
                  <p className="text-lg font-black text-sky-700">{session.speed_wpm}</p>
                </div>
              </div>
            </div>
          ))}

          {recentSessions.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6 text-slate-500 md:col-span-2 xl:col-span-4">
              <p className="font-bold">No quests yet. Start a lesson and your progress will appear here.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
