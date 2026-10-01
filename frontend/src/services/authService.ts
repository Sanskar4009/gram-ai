import { fetchJson } from '@/lib/apiClient';
import { AuthResponse, LoginCredentials, User } from '@/types/auth';

export async function loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
  return fetchJson<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function getCurrentUserProfile(): Promise<User> {
  return fetchJson<User>('/auth/me');
}
