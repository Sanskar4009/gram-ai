import { fetchJson } from '@/lib/apiClient';
import { PageResponse } from '@/types/pagination';
import { Panchayat, CreatePanchayatInput, UpdatePanchayatInput } from '@/types/panchayat';

export async function getPanchayats(params?: {
  search?: string;
  page?: number;
  size?: number;
}): Promise<PageResponse<Panchayat>> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.page !== undefined) query.set('page', params.page.toString());
  if (params?.size !== undefined) query.set('size', params.size.toString());

  const queryString = query.toString();
  const endpoint = queryString ? `/panchayats?${queryString}` : '/panchayats';
  return fetchJson<PageResponse<Panchayat>>(endpoint);
}

export async function getPanchayatById(id: number): Promise<Panchayat> {
  return fetchJson<Panchayat>(`/panchayats/${id}`);
}

export async function createPanchayat(input: CreatePanchayatInput): Promise<Panchayat> {
  return fetchJson<Panchayat>('/panchayats', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updatePanchayat(
  id: number,
  input: UpdatePanchayatInput
): Promise<Panchayat> {
  return fetchJson<Panchayat>(`/panchayats/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deactivatePanchayat(id: number): Promise<void> {
  return fetchJson<void>(`/panchayats/${id}`, {
    method: 'DELETE',
  });
}
