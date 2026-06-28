import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { register } from "../api/auth";
import { ErrorBanner } from "../components/ErrorBanner";
import { getErrorMessage } from "../lib/errors";
import { authStore } from "../stores/authStore";
import type { UserRole } from "../types/auth";

export const RegisterPage = () => {
  const navigate = useNavigate();
  const storeLogin = authStore((state) => state.login);
  const [role, setRole] = useState<UserRole>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: register,
    onSuccess: (response) => {
      storeLogin(response.access_token, response.user);
      toast.success("Account created.");
      navigate("/dashboard");
    },
  });

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12">
      <div className="w-full max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-clean p-12 bg-white"
        >
          <div className="flex justify-center mb-8">
            <div className="h-16 w-16 rounded-2xl bg-sky-500 border-b-4 border-sky-600 flex items-center justify-center text-3xl font-black text-white">
              R
            </div>
          </div>
          
          <h1 className="text-4xl font-black text-slate-900 text-center tracking-tight">Join the Mission</h1>
          <p className="mt-2 text-center text-slate-400 font-bold uppercase tracking-widest text-xs mb-10">Create your explorer account</p>
          
          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              mutation.mutate({ email, password, role });
            }}
          >
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
              <input
                className="w-full rounded-2xl border-4 border-slate-100 bg-slate-50 px-6 py-4 text-slate-900 font-bold outline-none transition focus:border-sky-200 focus:bg-white"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
              <input
                type="password"
                className="w-full rounded-2xl border-4 border-slate-100 bg-slate-50 px-6 py-4 text-slate-900 font-bold outline-none transition focus:border-sky-200 focus:bg-white"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <span className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1 mb-3">Choose Your Role</span>
              <div className="grid gap-4 sm:grid-cols-2">
                {(["student", "teacher"] as UserRole[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setRole(option)}
                    className={`btn-3d rounded-2xl border-2 px-6 py-4 text-center font-black transition-all ${
                      role === option
                        ? "bg-sky-500 border-sky-600 text-white"
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-white"
                    }`}
                  >
                    {option === "student" ? "I'm a Student" : "I'm a Teacher"}
                  </button>
                ))}
              </div>
            </div>

            {mutation.isError && (
              <div className="mt-6">
                <ErrorBanner message={getErrorMessage(mutation.error)} />
              </div>
            )}

            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn-3d mt-4 flex w-full items-center justify-center gap-3 rounded-2xl border-emerald-600 bg-emerald-500 py-5 text-xl font-black text-white hover:bg-emerald-400 active:bg-emerald-600 disabled:opacity-50"
            >
              {mutation.isPending ? "Creating account..." : "Start Adventure"}
              {!mutation.isPending && <ArrowRight className="h-5 w-5" />}
            </button>
          </form>

          <p className="mt-10 text-center text-slate-500 font-bold">
            Already registered?{" "}
            <Link className="text-sky-500 hover:underline" to="/login">
              Log in here
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};
