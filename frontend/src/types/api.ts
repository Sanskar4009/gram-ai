export interface HealthResponse {
  status: string;
  service: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  success: boolean;
  errorCode: string;
  message: string;
  errors?: ApiErrorDetail[];
  timestamp: string;
}

export type HealthStatusState = 'checking' | 'online' | 'offline';
