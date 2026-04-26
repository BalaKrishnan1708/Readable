import type {
  DiagnosticStartResponse,
  DiagnosticSubmitResponse,
  ReadingStartPayload,
  ReadingStartResponse,
  ReadingSubmitResponse,
} from "../types/session";
import { apiClient } from "./client";

export const startDiagnostic = async (): Promise<DiagnosticStartResponse> => {
  const { data } = await apiClient.post<DiagnosticStartResponse>("/sessions/diagnostic/start");
  return data;
};

export const submitDiagnostic = async (
  sessionId: number,
  audioFile: File,
  eyeTrackingPayload: Record<string, unknown>,
): Promise<DiagnosticSubmitResponse> => {
  const formData = new FormData();
  formData.append("session_id", String(sessionId));
  formData.append("audio_file", audioFile);
  formData.append("eye_tracking_payload", JSON.stringify(eyeTrackingPayload));
  const { data } = await apiClient.post<DiagnosticSubmitResponse>(
    "/sessions/diagnostic/submit",
    formData,
  );
  return data;
};

export const startReading = async (
  payload: ReadingStartPayload,
): Promise<ReadingStartResponse> => {
  const { data } = await apiClient.post<ReadingStartResponse>("/sessions/reading/start", payload);
  return data;
};

export const submitReading = async (
  sessionId: number,
  audioFile: File,
  eyeTrackingPayload: Record<string, unknown>,
  recovery?: {
    expectedText?: string;
    personalizedContentId?: number;
  },
): Promise<ReadingSubmitResponse> => {
  const formData = new FormData();
  formData.append("session_id", String(sessionId));
  formData.append("audio_file", audioFile);
  formData.append("eye_tracking_payload", JSON.stringify(eyeTrackingPayload));
  if (recovery?.expectedText) {
    formData.append("expected_text", recovery.expectedText);
  }
  if (typeof recovery?.personalizedContentId === "number") {
    formData.append("personalized_content_id", String(recovery.personalizedContentId));
  }
  const { data } = await apiClient.post<ReadingSubmitResponse>(
    "/sessions/reading/submit",
    formData,
  );
  return data;
};
