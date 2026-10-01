import { fetchJson } from '@/lib/apiClient';
import { PageResponse } from '@/types/pagination';
import { ManagedUser, CreateUserInput, UpdateUserInput } from '@/types/user';

export async function getUsers(params?: {
  panchayatId?: number;
  search?: string;
  page?: number;
  size?: number;
}): Promise<PageResponse<ManagedUser>> {
  const query = new URLSearchParams();
  if (params?.panchayatId !== undefined && params?.panchayatId !== null) {
    query.set('panchayatId', params.panchayatId.toString());
  }
  if (params?.search) query.set('search', params.search);
  if (params?.page !== undefined) query.set('page', params.page.toString());
  if (params?.size !== undefined) query.set('size', params.size.toString());

  const queryString = query.toString();
  const endpoint = queryString ? `/users?${queryString}` : '/users';
  return fetchJson<PageResponse<ManagedUser>>(endpoint);
}

export async function getUserById(id: number): Promise<ManagedUser> {
  return fetchJson<ManagedUser>(`/users/${id}`);
}

export async function createUser(input: CreateUserInput): Promise<ManagedUser> {
  return fetchJson<ManagedUser>('/users', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateUser(
  id: number,
  input: UpdateUserInput
): Promise<ManagedUser> {
  return fetchJson<ManagedUser>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function updateUserStatus(
  id: number,
  active: boolean
): Promise<ManagedUser> {
  return fetchJson<ManagedUser>(`/users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  });
}
