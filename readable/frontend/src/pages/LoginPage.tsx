import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

import { login } from "../api/auth";
import { ErrorBanner } from "../components/ErrorBanner";
import { getErrorMessage } from "../lib/errors";
import { authStore } from "../stores/authStore";

export const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("teacher@readable.app");
  const [password, setPassword] = useState("password123");
  const storeLogin = authStore((state) => state.login);

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (response) => {
      storeLogin(response.access_token, response.user);
      toast.success("Welcome back!");
      navigate("/dashboard");
    },
  });
  const mutationMessage = mutation.isError ? getErrorMessage(mutation.error) : "";
  const looksLikeVoiceFeatureValidation =
    mutationMessage.includes("speech_rate_wps") ||
    mutationMessage.includes("pause_duration_ms") ||
    mutationMessage.includes("pause_frequency") ||
    mutationMessage.includes("mispronunciation_rate") ||
    mutationMessage.includes("repetition_rate");

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f7fbff_0%,#edf5ff_100%)] px-4 py-12">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.2fr,0.8fr] items-center">
        
        <motion.div 
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center justify-center text-center p-8"
        >
          <motion.div 
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
            className="mb-8 flex h-32 w-32 items-center justify-center rounded-[2rem] bg-[linear-gradient(135deg,#2f80ed_0%,#a855f7_100%)] text-6xl font-bold text-white shadow-[0_12px_24px_rgba(168,85,247,0.4)]"
          >
            R
          </motion.div>
          
          <h1 className="text-5xl font-extrabold tracking-tight text-ink">
            Welcome to <span className="text-transparent bg-clip-text bg-[linear-gradient(135deg,#2f80ed_0%,#a855f7_100%)]">Readable!</span>
          </h1>
          <p className="mt-4 max-w-md text-lg font-medium text-slate-600">
            Get ready for a fun reading adventure. Let's practice and grow your reading powers together!
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.4, delay: 0.1 }}
          className="flex flex-col justify-center rounded-[2.5rem] border border-white/80 bg-white/80 p-10 shadow-soft backdrop-blur"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate({ email, password });
          }}
        >
          <div className="flex justify-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-[linear-gradient(135deg,#2f80ed_0%,#4fa6ff_100%)] text-2xl font-bold text-white shadow-soft">
              R
            </div>
          </div>
          <h2 className="text-center text-3xl font-bold text-ink">Let's Go!</h2>
          <p className="mt-2 text-center text-sm font-medium text-slate-500">
            Sign in to see your reading dashboard.
          </p>
          
          <div className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Email Address</span>
              <input
                className="w-full rounded-2xl border border-sky-100 bg-white px-5 py-4 text-ink shadow-sm outline-none transition focus:border-sea focus:ring-4 focus:ring-sea/20"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Secret Password</span>
              <input
                type="password"
                className="w-full rounded-2xl border border-sky-100 bg-white px-5 py-4 text-ink shadow-sm outline-none transition focus:border-sea focus:ring-4 focus:ring-sea/20"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
          </div>
          
          {mutation.isError ? (
            <div className="mt-5 space-y-2">
              <ErrorBanner
                message={
                  looksLikeVoiceFeatureValidation
                    ? "Login request reached a non-auth endpoint. Check API base URL/server route configuration."
                    : mutationMessage
                }
              />
            </div>
          ) : null}
          
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={mutation.isPending}
            className="mt-8 w-full rounded-full bg-[linear-gradient(135deg,#2f80ed_0%,#a855f7_100%)] px-4 py-4 text-lg font-bold tracking-wide text-white shadow-[0_6px_20px_rgba(168,85,247,0.35)] transition disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
          >
            {mutation.isPending ? "Logging in..." : "Start Playing"}
          </motion.button>
          
          <p className="mt-6 text-center text-sm font-bold text-slate-500">
            Need an account?{" "}
            <Link className="text-sea hover:text-purple-500 hover:underline transition" to="/register">
              Ask your teacher!
            </Link>
          </p>
        </motion.form>
      </div>
    </div>
  );
};
