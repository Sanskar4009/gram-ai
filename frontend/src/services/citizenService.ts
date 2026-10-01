import { fetchJson } from '@/lib/apiClient';
import { PageResponse } from '@/types/pagination';
import { Citizen, CitizenStatus, CreateCitizenInput, UpdateCitizenInput } from '@/types/citizen';

export async function getCitizens(params?: {
  panchayatId?: number;
  search?: string;
  village?: string;
  wardNumber?: number;
  status?: CitizenStatus;
  page?: number;
  size?: number;
  sort?: string;
}): Promise<PageResponse<Citizen>> {
  const query = new URLSearchParams();
  if (params?.panchayatId !== undefined && params?.panchayatId !== null) {
    query.set('panchayatId', params.panchayatId.toString());
  }
  if (params?.search) query.set('search', params.search);
  if (params?.village) query.set('village', params.village);
  if (params?.wardNumber !== undefined && params?.wardNumber !== null) {
    query.set('wardNumber', params.wardNumber.toString());
  }
  if (params?.status) query.set('status', params.status);
  if (params?.page !== undefined) query.set('page', params.page.toString());
  if (params?.size !== undefined) query.set('size', params.size.toString());
  if (params?.sort) query.set('sort', params.sort);

  const queryString = query.toString();
  const endpoint = queryString ? `/citizens?${queryString}` : '/citizens';
  return fetchJson<PageResponse<Citizen>>(endpoint);
}

export async function getCitizenById(id: number): Promise<Citizen> {
  return fetchJson<Citizen>(`/citizens/${id}`);
}

export async function createCitizen(input: CreateCitizenInput): Promise<Citizen> {
  return fetchJson<Citizen>('/citizens', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateCitizen(
  id: number,
  input: UpdateCitizenInput
): Promise<Citizen> {
  return fetchJson<Citizen>(`/citizens/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function updateCitizenStatus(
  id: number,
  status: CitizenStatus
): Promise<Citizen> {
  return fetchJson<Citizen>(`/citizens/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
