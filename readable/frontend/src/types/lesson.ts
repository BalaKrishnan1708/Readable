export interface LessonUploadResponse {
  lesson_id: number;
  title: string;
  content_type: "text" | "pdf" | "image";
  processed_content: string;
}

export interface PersonalizedContent {
  id: number;
  lesson_id: number;
  student_id: number;
  segments: string[];
  syllable_breaks: Record<string, string>;
  font_size: number;
  line_spacing: number;
  chunk_size: number;
  created_at: string;
}
