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

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="grid w-full max-w-5xl gap-12 lg:grid-cols-2 items-center">
        
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-center lg:text-left"
        >
          <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-sky-500 text-5xl font-black text-white border-b-8 border-sky-600 mb-10 mx-auto lg:mx-0">
            R
          </div>
          <h1 className="text-7xl font-black text-slate-900 leading-[1.1] tracking-tight">
            Ready to <span className="text-sky-500">Read?</span>
          </h1>
          <p className="mt-8 text-2xl font-bold text-slate-400 leading-relaxed max-w-lg">
            Join thousands of explorers on a journey to master the art of reading!
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-clean p-12 bg-white"
        >
          <h2 className="text-3xl font-black text-slate-800 text-center mb-2">Welcome Back!</h2>
          <p className="text-center text-slate-400 font-bold uppercase tracking-widest text-xs mb-10">Sign in to your account</p>
          
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate({ email, password });
            }}
          >
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
              <input
                className="w-full rounded-2xl border-4 border-slate-100 bg-slate-50 px-6 py-4 text-slate-900 font-bold outline-none transition focus:border-sky-200 focus:bg-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
              <input
                type="password"
                className="w-full rounded-2xl border-4 border-slate-100 bg-slate-50 px-6 py-4 text-slate-900 font-bold outline-none transition focus:border-sky-200 focus:bg-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {mutation.isError && (
              <ErrorBanner message={getErrorMessage(mutation.error)} />
            )}

            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn-3d w-full rounded-2xl bg-sky-500 border-sky-600 py-5 text-xl font-black text-white hover:bg-sky-400 active:bg-sky-600 disabled:opacity-50"
            >
              {mutation.isPending ? "Connecting..." : "Let's Go! →"}
            </button>
          </form>

          <p className="mt-8 text-center text-slate-500 font-bold">
            New here?{" "}
            <Link className="text-sky-500 hover:underline" to="/register">
              Create an account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};
