import type { PersonalizedContent } from "./lesson";
import type { StudentProfile } from "./profile";

export interface ErrorItem {
  word: string;
  position: number;
  type: string;
}

export interface SessionResult {
  session_id: number;
  spoken_text: string;
  expected_text: string;
  errors: ErrorItem[];
  speed_wpm: number;
  hesitation_points: number[];
  attention_score: number;
  skip_events: number[];
  re_read_events: number[];
  avg_fixation_ms: number;
  accuracy_pct: number;
}

export interface DiagnosticStartResponse {
  session_id: number;
  expected_text: string;
}

export interface DiagnosticSubmitResponse {
  result: SessionResult;
  profile: StudentProfile;
}

export interface ReadingStartPayload {
  personalized_content_id: number;
}

export interface ReadingStartResponse {
  session_id: number;
  content: PersonalizedContent;
}

export interface ReadingSubmitResponse {
  result: SessionResult;
  profile: StudentProfile;
  progress_entry_id: number;
}
