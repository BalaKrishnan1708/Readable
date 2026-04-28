import { apiClient } from "./client";

export interface ChildAnalytics {
  student_id: number;
  name: string;
  reading_level: string | null;
  avg_speed_wpm: number;
  avg_accuracy_pct: number;
  attention_score: number;
  recent_sessions_count: number;
}

export const getChildrenAnalytics = async (): Promise<ChildAnalytics[]> => {
  const { data } = await apiClient.get<ChildAnalytics[]>("/parent/children");
  return data;
};
