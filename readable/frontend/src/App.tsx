import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

import { Navbar } from "./components/Navbar";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { StudentDashboardPage } from "./pages/StudentDashboardPage";
import { TeacherDashboardPage } from "./pages/TeacherDashboardPage";
import { DiagnosticPage } from "./pages/DiagnosticPage";
import { ProgressPage } from "./pages/ProgressPage";
import { PlanetLessonPage } from "./pages/PlanetLessonPage";
import { LessonPage } from "./pages/LessonPage";
import { UploadPage } from "./pages/UploadPage";
import { StudentDetailPage } from "./pages/StudentDetailPage";

const AppShell = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register" || location.pathname === "/";

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-sky-100 selection:text-sky-900 transition-colors duration-500 bg-grid-pattern">
      {!isAuthPage && <Navbar />}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

function App() {
  return (
    <AuthWrapper>
      <AppShell>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/teacher-dashboard" element={<TeacherDashboardPage />} />
          <Route path="/diagnostic" element={<DiagnosticPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/planets" element={<PlanetLessonPage />} />
          <Route path="/lesson/:id" element={<LessonPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/students/:id" element={<StudentDetailPage />} />
        </Routes>
      </AppShell>
      <Toaster 
        position="bottom-right"
        toastOptions={{
          className: 'card-clean font-bold',
          duration: 3000,
        }}
      />
    </AuthWrapper>
  );
}

export default App;
