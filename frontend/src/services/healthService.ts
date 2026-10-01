import { fetchJson } from '@/lib/apiClient';
import { HealthResponse } from '@/types/api';

export async function checkBackendHealth(): Promise<HealthResponse> {
  return fetchJson<HealthResponse>('/health');
}
