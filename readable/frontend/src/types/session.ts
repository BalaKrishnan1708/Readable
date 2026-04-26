import type { PersonalizedContent } from "./lesson";
import type { StudentProfile } from "./profile";

export interface ErrorItem {
  word: string;
  position: number;
  type: string;
}

export interface FocusedWordHit {
  word: string;
  count: number;
}

export interface EyeMetrics {
  fixation_duration_ms: number;
  saccade_length: number;
  regression_count: number;
  skipped_words: number;
  reading_speed_wpm: number;
  sample_count: number;
  skip_events: number[];
  re_read_events: number[];
  attention_score: number;
  focused_word_hits: FocusedWordHit[];
}

export interface VoiceMetrics {
  speech_rate_wps: number;
  pause_duration_ms: number;
  pause_frequency: number;
  mispronunciation_rate: number;
  repetition_rate: number;
  audio_duration_seconds: number;
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
  model_profile_scores: Record<string, number>;
  review_text?: string | null;
  eye_metrics: EyeMetrics;
  voice_metrics: VoiceMetrics;
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
