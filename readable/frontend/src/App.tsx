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
import { ReaderPage } from "./pages/ReaderPage";

const AppShell = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register" || location.pathname === "/";
  const isFullscreen = location.pathname === "/reader";

  // Fullscreen pages bypass the shell entirely
  if (isFullscreen) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    );
  }

  const isLessonPage = location.pathname.startsWith("/lesson/");

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-sky-100 selection:text-sky-900 transition-colors duration-500 bg-grid-pattern">
      {!isAuthPage && <Navbar />}
      <main className={`mx-auto py-8 ${isLessonPage ? 'w-full px-2 sm:px-4' : 'max-w-7xl px-4 sm:px-6 lg:px-8'}`}>
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
          <Route path="/reader" element={<ReaderPage />} />
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
