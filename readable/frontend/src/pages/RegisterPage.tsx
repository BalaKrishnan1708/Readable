import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

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
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f7fbff_0%,#edf5ff_100%)] px-4 py-12">
      <form
        className="w-full max-w-xl rounded-[2.5rem] border border-white/80 bg-white/80 p-10 shadow-soft backdrop-blur"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate({ email, password, role });
        }}
      >
        <h1 className="text-3xl font-semibold text-ink">Create an account</h1>
        <div className="mt-8 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
            <input
              className="w-full rounded-2xl border border-sky-100 bg-white px-5 py-4 text-ink shadow-sm outline-none transition focus:border-sea focus:ring-2 focus:ring-sea/20"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Password</span>
            <input
              type="password"
              className="w-full rounded-2xl border border-sky-100 bg-white px-5 py-4 text-ink shadow-sm outline-none transition focus:border-sea focus:ring-2 focus:ring-sea/20"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <div>
            <span className="mb-2 block text-sm font-semibold text-slate-700">Role</span>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["student", "teacher"] as UserRole[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRole(option)}
                  className={`rounded-2xl border px-5 py-4 text-left font-semibold transition ${
                    role === option
                      ? "border-sea bg-[#eef6ff] text-sea ring-1 ring-sea/20"
                      : "border-sky-100 bg-white text-slate-500 hover:border-sky-200 hover:text-ink"
                  }`}
                >
                  {option === "student" ? "Student" : "Teacher"}
                </button>
              ))}
            </div>
          </div>
        </div>
        {mutation.isError ? <div className="mt-5"><ErrorBanner message={getErrorMessage(mutation.error)} /></div> : null}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="mt-8 w-full rounded-full bg-[linear-gradient(135deg,#2f80ed_0%,#4fa6ff_100%)] px-4 py-4 text-base font-semibold tracking-wide text-white shadow-[0_4px_14px_rgba(47,128,237,0.35)] transition hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
        >
          {mutation.isPending ? "Creating account..." : "Create account"}
        </button>
        <p className="mt-6 text-center text-sm font-medium text-slate-500">
          Already have an account?{" "}
          <Link className="font-semibold text-sea hover:underline" to="/login">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
};
