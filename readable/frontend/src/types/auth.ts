export type UserRole = "student" | "teacher" | "parent";

export interface User {
  id: number;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
