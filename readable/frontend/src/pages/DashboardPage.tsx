import { TeacherDashboardPage } from "./TeacherDashboardPage";
import { StudentDashboardPage } from "./StudentDashboardPage";
import { ParentDashboardPage } from "./ParentDashboardPage";
import { authStore } from "../stores/authStore";

export const DashboardPage = () => {
  const role = authStore((state) => state.role);
  if (role === "teacher") return <TeacherDashboardPage />;
  if (role === "parent") return <ParentDashboardPage />;
  return <StudentDashboardPage />;
};
