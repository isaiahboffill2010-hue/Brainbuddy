import { create } from "zustand";
import type { Student } from "@/types/app";

interface StudentState {
  activeStudent: Student | null;
  setActiveStudent: (student: Student | null) => void;
}

export const useStudentStore = create<StudentState>((set) => ({
  activeStudent: null,
  setActiveStudent: (activeStudent) => set({ activeStudent }),
}));
