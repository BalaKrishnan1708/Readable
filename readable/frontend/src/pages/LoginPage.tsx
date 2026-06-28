import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { ArrowRight, BookOpenCheck, Sparkles } from "lucide-react";

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

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="surface-panel overflow-hidden rounded-[2rem] bg-slate-950 p-8 text-center text-white lg:text-left"
        >
          <div className="mx-auto mb-10 flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-sky-500 via-teal-400 to-orange-400 text-white shadow-xl shadow-sky-500/20 lg:mx-0">
            <BookOpenCheck className="h-10 w-10" />
          </div>
          <h1 className="text-balance text-6xl font-black leading-[1.05] tracking-tight text-white md:text-7xl">
            Ready to read with superpowers?
          </h1>
          <p className="mt-7 max-w-xl text-xl font-semibold leading-8 text-slate-300">
            Personalized pacing, phonics, story maps, and focus tools in one calm reading space.
          </p>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {["Pacer", "Phonics", "Gaze"].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black uppercase tracking-widest text-sky-100"
              >
                {item}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-clean bg-white p-8 md:p-10"
        >
          <div className="mb-9 text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-black text-slate-900">Welcome Back</h2>
            <p className="mt-2 text-xs font-black uppercase tracking-widest text-slate-400">
              Sign in to your account
            </p>
          </div>

          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate({ email, password });
            }}
          >
            <div className="space-y-2">
              <label className="ml-1 block text-xs font-black uppercase tracking-widest text-slate-500">
                Email Address
              </label>
              <input
                className="w-full rounded-2xl border-4 border-slate-100 bg-slate-50 px-6 py-4 font-bold text-slate-900 outline-none transition focus:border-sky-200 focus:bg-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="ml-1 block text-xs font-black uppercase tracking-widest text-slate-500">
                Password
              </label>
              <input
                type="password"
                className="w-full rounded-2xl border-4 border-slate-100 bg-slate-50 px-6 py-4 font-bold text-slate-900 outline-none transition focus:border-sky-200 focus:bg-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {mutation.isError && <ErrorBanner message={getErrorMessage(mutation.error)} />}

            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn-3d flex w-full items-center justify-center gap-3 rounded-2xl border-sky-600 bg-sky-500 py-5 text-xl font-black text-white hover:bg-sky-400 active:bg-sky-600 disabled:opacity-50"
            >
              {mutation.isPending ? "Connecting..." : "Let's Go"}
              {!mutation.isPending && <ArrowRight className="h-5 w-5" />}
            </button>
          </form>

          <p className="mt-8 text-center font-bold text-slate-500">
            New here?{" "}
            <Link className="text-sky-600 hover:underline" to="/register">
              Create an account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};
