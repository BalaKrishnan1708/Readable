import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { User, UserRole } from "../types/auth";

interface AuthState {
  token: string | null;
  user: User | null;
  role: UserRole | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const authStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      role: null,
      login: (token, user) =>
        set({
          token,
          user,
          role: user.role,
        }),
      logout: () =>
        set({
          token: null,
          user: null,
          role: null,
        }),
    }),
    { name: "readable-auth" },
  ),
);
