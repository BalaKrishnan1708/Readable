import { useQuery } from "@tanstack/react-query";

import {
  getStudentLessons,
  getStudentProfile,
  getStudentProgress,
  getTeacherStudents,
} from "../api/profile";

export const useStudentProfileQuery = (studentId?: number) =>
  useQuery({
    queryKey: ["student-profile", studentId],
    queryFn: () => getStudentProfile(studentId as number),
    enabled: typeof studentId === "number",
  });

export const useStudentProgressQuery = (studentId?: number) =>
  useQuery({
    queryKey: ["student-progress", studentId],
    queryFn: () => getStudentProgress(studentId as number),
    enabled: typeof studentId === "number",
  });

export const useTeacherStudentsQuery = () =>
  useQuery({
    queryKey: ["teacher-students"],
    queryFn: getTeacherStudents,
  });

export const useStudentLessonsQuery = (studentId?: number) =>
  useQuery({
    queryKey: ["student-lessons", studentId],
    queryFn: () => getStudentLessons(studentId as number),
    enabled: typeof studentId === "number",
  });
