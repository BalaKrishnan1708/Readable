import type { StudentLessonCard } from "../types/lesson";
import type { StudentProfile, StudentProgress, TeacherStudentSummary } from "../types/profile";
import { apiClient } from "./client";

export const getStudentProfile = async (studentId: number): Promise<StudentProfile> => {
  const { data } = await apiClient.get<StudentProfile>(`/students/${studentId}/profile`);
  return data;
};

export const getStudentProgress = async (studentId: number): Promise<StudentProgress> => {
  const { data } = await apiClient.get<StudentProgress>(`/students/${studentId}/progress`);
  return data;
};

export const getTeacherStudents = async (): Promise<TeacherStudentSummary[]> => {
  const { data } = await apiClient.get<TeacherStudentSummary[]>("/teacher/students");
  return data;
};

export const getStudentLessons = async (studentId: number): Promise<StudentLessonCard[]> => {
  const { data } = await apiClient.get<StudentLessonCard[]>(`/students/${studentId}/lessons`);
  return data;
};
