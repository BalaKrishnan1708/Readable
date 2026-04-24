import axios from "axios";

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError<{ detail?: string }>(error)) {
    return error.response?.data?.detail ?? error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong.";
};
