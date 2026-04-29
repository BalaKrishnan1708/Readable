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

export type ConceptNode = {
  id: string;
  label: string;
  type: string;
};

export type ConceptEdge = {
  source: string;
  target: string;
  label: string;
};

export type VisualizeResponse = {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
};

export const visualizeParagraph = async (text: string): Promise<VisualizeResponse> => {
  const { data } = await apiClient.post<VisualizeResponse>("/sessions/reading/visualize", { text });
  return data;
};

export const transcribePhonics = async (audioFile: Blob, expectedWord?: string): Promise<{ text: string, is_match?: boolean, clean_text?: string }> => {
  const formData = new FormData();
  const extension = audioFile.type.includes("webm")
    ? "webm"
    : audioFile.type.includes("ogg")
      ? "ogg"
      : audioFile.type.includes("mpeg")
        ? "mp3"
        : audioFile.type.includes("wav")
          ? "wav"
          : "webm";
  formData.append("audio_file", audioFile, `phonics.${extension}`);
  if (expectedWord) {
    formData.append("expected_word", expectedWord);
  }
  const { data } = await apiClient.post<{ text: string, is_match?: boolean, clean_text?: string }>("/sessions/diagnostic/phonics/transcribe", formData);
  return data;
};
