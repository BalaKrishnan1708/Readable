import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardPage } from "./pages/DashboardPage";
import { DiagnosticPage } from "./pages/DiagnosticPage";
import { LessonPage } from "./pages/LessonPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { StudentDetailPage } from "./pages/StudentDetailPage";
import { UploadPage } from "./pages/UploadPage";

const AppShell = () => {
  const location = useLocation();
  const isLessonRoute = location.pathname.startsWith("/lesson/");

  return (
    <div className={isLessonRoute ? "min-h-screen bg-[#f6f7f2]" : "min-h-screen bg-slate-50"}>
      {!isLessonRoute ? <Navbar /> : null}
      <main
        className={
          isLessonRoute
            ? "min-h-screen px-4 py-6 sm:px-6 lg:px-8"
            : "mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
        }
      >
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/diagnostic" element={<DiagnosticPage />} />
        <Route path="/lesson/:lessonId" element={<LessonPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/students/:studentId" element={<StudentDetailPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/*" element={<AppShell />} />
      </Route>
    </Routes>
  );
}
