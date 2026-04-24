import type { AuthResponse, LoginPayload, RegisterPayload } from "../types/auth";
import { apiClient } from "./client";

export const login = async (payload: LoginPayload): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", payload);
  return data;
};

export const register = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>("/auth/register", payload);
  return data;
};
