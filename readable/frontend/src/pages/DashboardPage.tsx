import { TeacherDashboardPage } from "./TeacherDashboardPage";
import { StudentDashboardPage } from "./StudentDashboardPage";
import { authStore } from "../stores/authStore";

export const DashboardPage = () => {
  const role = authStore((state) => state.role);
  return role === "teacher" ? <TeacherDashboardPage /> : <StudentDashboardPage />;
};
