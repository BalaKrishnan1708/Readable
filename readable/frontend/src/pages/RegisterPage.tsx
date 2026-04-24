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
    <div className="flex min-h-screen items-center justify-center bg-hero-radial px-4 py-12">
      <form
        className="w-full max-w-xl rounded-[2rem] bg-white p-8 shadow-soft"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate({ email, password, role });
        }}
      >
        <h1 className="text-3xl font-semibold text-ink">Create an account</h1>
        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
            <input
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sea"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
            <input
              type="password"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sea"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <div>
            <span className="mb-2 block text-sm font-medium text-slate-700">Role</span>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["student", "teacher"] as UserRole[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRole(option)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    role === option
                      ? "border-sea bg-mist text-sea"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {option === "student" ? "Student" : "Teacher"}
                </button>
              ))}
            </div>
          </div>
        </div>
        {mutation.isError ? <div className="mt-4"><ErrorBanner message={getErrorMessage(mutation.error)} /></div> : null}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="mt-6 w-full rounded-2xl bg-ink px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {mutation.isPending ? "Creating account..." : "Create account"}
        </button>
        <p className="mt-4 text-sm text-slate-500">
          Already have an account?{" "}
          <Link className="font-medium text-sea" to="/login">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
};
