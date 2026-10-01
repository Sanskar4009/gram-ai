export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8081/api/v1';

export class ApiError extends Error {
  public status: number;
  public data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function fetchJson<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  // Inject Bearer token if available
  const token = typeof window !== 'undefined' ? localStorage.getItem('gramai_token') : null;
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...((options.headers as Record<string, string>) || {}),
    },
  });

  if (!response.ok) {
    let errorData: any = null;
    try {
      errorData = await response.json();
    } catch {
      errorData = null;
    }

    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('gramai_token');
        localStorage.removeItem('gramai_user');
        window.dispatchEvent(new Event('gramai_auth_change'));
      }
    }

    const message =
      (errorData && errorData.message) ||
      `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status, errorData);
  }

  return response.json() as Promise<T>;
}
