export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T | null;
  errors: string[];
}

export function success<T>(data: T, message = "Success"): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
    errors: [],
  };
}

export function fail(message: string, errors: string[] = []): ApiResponse {
  return {
    success: false,
    message,
    data: null,
    errors,
  };
}
