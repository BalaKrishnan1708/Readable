import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, GraduationCap, Calendar, BarChart3, ChevronRight } from "lucide-react";
import { useTeacherStudentsQuery } from "../hooks/useProfileQueries";

export const TeacherDashboardPage = () => {
  const navigate = useNavigate();
  const studentsQuery = useTeacherStudentsQuery();

  return (
    <div className="space-y-12 py-4">
      <header className="pb-8 border-b-4 border-slate-200 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-xl bg-sky-500 flex items-center justify-center text-white border-b-4 border-sky-600">
              <Users className="w-6 h-6" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Mission Control</h1>
          </div>
          <p className="text-xl font-bold text-slate-500 leading-relaxed max-w-2xl">
            Monitor your student explorers as they travel through the reading universe!
          </p>
        </div>
        <button className="btn-3d rounded-2xl bg-indigo-500 border-indigo-600 px-8 py-4 font-black text-white hover:bg-indigo-400">
          Sync All Data
        </button>
      </header>

      <section className="card-clean p-10 bg-white">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-4">
            <GraduationCap className="w-8 h-8 text-indigo-500" />
            Active Explorers
          </h2>
          <span className="rounded-full bg-slate-100 border-2 border-slate-200 px-6 py-2 text-xs font-black text-slate-500 uppercase tracking-widest">
            {studentsQuery.data?.length ?? 0} Students Online
          </span>
        </div>

        <div className="overflow-x-auto rounded-3xl border-2 border-slate-100 bg-slate-50">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b-2 border-slate-200 text-slate-400 uppercase tracking-widest text-[10px] font-black">
                <th className="px-10 py-8">Explorer Name</th>
                <th className="px-10 py-8">Accuracy</th>
                <th className="px-10 py-8">Last Mission</th>
                <th className="px-10 py-8">Level</th>
                <th className="px-10 py-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-100">
              {(studentsQuery.data ?? []).map((student, i) => (
                <motion.tr
                  key={student.student_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="cursor-pointer group hover:bg-white transition-colors"
                  onClick={() => navigate(`/students/${student.student_id}`)}
                >
                  <td className="px-10 py-8">
                    <div className="font-black text-slate-900 text-lg group-hover:text-sky-500 transition-colors">{student.name}</div>
                    <div className="text-slate-400 font-bold text-sm mt-1">{student.email}</div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-4">
                       <span className="font-black text-emerald-600 text-2xl">
                        {student.avg_accuracy_pct.toFixed(0)}%
                       </span>
                       <div className="w-24 h-3 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
                          <div 
                            className="h-full bg-emerald-500"
                            style={{ width: `${student.avg_accuracy_pct}%` }}
                          />
                       </div>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-slate-500 font-bold">
                    {student.last_session_date
                      ? new Date(student.last_session_date).toLocaleDateString()
                      : "Awaiting Data"}
                  </td>
                  <td className="px-10 py-8">
                    <span className="rounded-xl border-2 border-slate-200 bg-white px-5 py-2.5 text-xs font-black text-slate-700 uppercase tracking-widest shadow-sm">
                      {student.reading_level ?? "B1"}
                    </span>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-sky-500 transition-all group-hover:translate-x-1" />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
