export interface LessonUploadResponse {
  lesson_id: number;
  title: string;
  content_type: "text" | "pdf" | "image";
  processed_content: string;
}

export interface PhoneticSupportWord {
  word: string;
  ipa: string;
  syllables: string[];
  onset: string;
  rime: string;
  whisper_text: string;
}

export interface PersonalizedContent {
  id: number;
  lesson_id: number;
  student_id: number;
  segments: string[];
  syllable_breaks: Record<string, string>;
  phonetic_support: Record<string, PhoneticSupportWord>;
  font_size: number;
  line_spacing: number;
  chunk_size: number;
  created_at: string;
}

export interface StudentLessonCard {
  personalized_content_id: number;
  lesson_id: number;
  title: string;
  content_type: "text" | "pdf" | "image";
  preview_text: string;
  segment_count: number;
  support_focus: string[];
  created_at: string;
}
