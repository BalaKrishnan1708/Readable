import type {
  LessonUploadResponse,
  PersonalizedContent,
  TeacherPersonalizedLesson,
} from "../types/lesson";
import { apiClient } from "./client";

export const uploadLesson = async (payload: {
  title: string;
  rawText?: string;
  file?: File | null;
}): Promise<LessonUploadResponse> => {
  const formData = new FormData();
  formData.append("title", payload.title);
  if (payload.rawText) {
    formData.append("raw_text", payload.rawText);
  }
  if (payload.file) {
    formData.append("file", payload.file);
  }
  const { data } = await apiClient.post<LessonUploadResponse>("/lessons/upload", formData);
  return data;
};

export const personalizeLesson = async (
  lessonId: number,
  studentId: string | number,
): Promise<PersonalizedContent> => {
  const { data } = await apiClient.post<PersonalizedContent>(
    `/lessons/${lessonId}/personalize/${studentId}`,
  );
  return data;
};

export const personalizeLessonForAll = async (
  lessonId: number,
): Promise<TeacherPersonalizedLesson[]> => {
  const { data } = await apiClient.post<TeacherPersonalizedLesson[]>(
    `/lessons/${lessonId}/personalize-all`,
  );
  return data;
};
