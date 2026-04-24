import { create } from "zustand";

import type { PersonalizedContent } from "../types/lesson";
import type { SessionResult } from "../types/session";

interface CurrentSession {
  sessionId: number;
  sessionType: "diagnostic" | "reading";
  expectedText?: string;
  content?: PersonalizedContent;
}

interface SessionState {
  currentSession: CurrentSession | null;
  sessionResults: SessionResult | null;
  isSubmitting: boolean;
  setCurrentSession: (session: CurrentSession | null) => void;
  setSessionResults: (result: SessionResult | null) => void;
  setSubmitting: (value: boolean) => void;
  reset: () => void;
}

export const sessionStore = create<SessionState>((set) => ({
  currentSession: null,
  sessionResults: null,
  isSubmitting: false,
  setCurrentSession: (session) => set({ currentSession: session }),
  setSessionResults: (result) => set({ sessionResults: result }),
  setSubmitting: (value) => set({ isSubmitting: value }),
  reset: () => set({ currentSession: null, sessionResults: null, isSubmitting: false }),
}));
