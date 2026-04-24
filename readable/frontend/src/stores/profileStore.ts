import { create } from "zustand";

import type { ProgressEntry, StudentProfile } from "../types/profile";

interface ProfileState {
  studentProfile: StudentProfile | null;
  progressEntries: ProgressEntry[];
  setStudentProfile: (profile: StudentProfile | null) => void;
  setProgressEntries: (entries: ProgressEntry[]) => void;
  reset: () => void;
}

export const profileStore = create<ProfileState>((set) => ({
  studentProfile: null,
  progressEntries: [],
  setStudentProfile: (profile) => set({ studentProfile: profile }),
  setProgressEntries: (entries) => set({ progressEntries: entries }),
  reset: () => set({ studentProfile: null, progressEntries: [] }),
}));
