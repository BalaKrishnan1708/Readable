import { useNavigate } from "react-router-dom";

import { useTeacherStudentsQuery } from "../hooks/useProfileQueries";

export const TeacherDashboardPage = () => {
  const navigate = useNavigate();
  const studentsQuery = useTeacherStudentsQuery();

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-hero-radial p-8 shadow-soft">
        <p className="text-sm uppercase tracking-[0.25em] text-sea">Teacher Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Student overview at intervention pace</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Compare accuracy, identify challenge vocabulary, and open a student detail view for
          history and support planning.
        </p>
      </section>

      <section className="rounded-[2rem] bg-white p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">Students</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="pb-3">Name</th>
                <th className="pb-3">Avg accuracy</th>
                <th className="pb-3">Last session</th>
                <th className="pb-3">Reading level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(studentsQuery.data ?? []).map((student) => (
                <tr
                  key={student.student_id}
                  className="cursor-pointer transition hover:bg-slate-50"
                  onClick={() => navigate(`/students/${student.student_id}`)}
                >
                  <td className="py-4">
                    <div className="font-medium text-ink">{student.name}</div>
                    <div className="text-slate-500">{student.email}</div>
                  </td>
                  <td className="py-4 text-slate-600">{student.avg_accuracy_pct.toFixed(1)}%</td>
                  <td className="py-4 text-slate-600">
                    {student.last_session_date
                      ? new Date(student.last_session_date).toLocaleDateString()
                      : "No sessions yet"}
                  </td>
                  <td className="py-4">
                    <span className="rounded-full bg-mist px-3 py-2 text-xs font-semibold text-sea">
                      {student.reading_level ?? "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
