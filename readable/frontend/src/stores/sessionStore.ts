import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { PersonalizedContent } from "../types/lesson";
import type { SessionResult } from "../types/session";

interface CurrentSession {
  sessionId: number;
  sessionType: "diagnostic" | "reading";
  expectedText?: string;
  content?: PersonalizedContent;
}

export interface EyeTrackingFocusEvent {
  wordIndex: number;
  timestamp: number;
}

interface SessionState {
  currentSession: CurrentSession | null;
  sessionResults: SessionResult | null;
  isSubmitting: boolean;
  eyeTrackingFocusEvents: EyeTrackingFocusEvent[];
  setCurrentSession: (session: CurrentSession | null) => void;
  setSessionResults: (result: SessionResult | null) => void;
  setSubmitting: (value: boolean) => void;
  addEyeTrackingFocusEvent: (event: EyeTrackingFocusEvent) => void;
  clearEyeTrackingFocusEvents: () => void;
  reset: () => void;
}

export const sessionStore = create<SessionState>()(
  persist(
    (set) => ({
      currentSession: null,
      sessionResults: null,
      isSubmitting: false,
      eyeTrackingFocusEvents: [],
      setCurrentSession: (session) => set({ currentSession: session }),
      setSessionResults: (result) => set({ sessionResults: result }),
      setSubmitting: (value) => set({ isSubmitting: value }),
      addEyeTrackingFocusEvent: (event) =>
        set((state) => ({
          eyeTrackingFocusEvents: [...state.eyeTrackingFocusEvents, event].slice(-5000),
        })),
      clearEyeTrackingFocusEvents: () => set({ eyeTrackingFocusEvents: [] }),
      reset: () =>
        set({
          currentSession: null,
          sessionResults: null,
          isSubmitting: false,
          eyeTrackingFocusEvents: [],
        }),
    }),
    { name: "readable-session" },
  ),
);
