import { fetchJson } from '@/lib/apiClient';
import { PageResponse } from '@/types/pagination';
import {
  Complaint,
  ComplaintHistory,
  ComplaintSummary,
  CreateComplaintPayload,
  UpdateComplaintPayload,
  UpdateComplaintStatusPayload,
  AssignComplaintPayload,
  ResolveComplaintPayload,
  CloseComplaintPayload,
  ComplaintFilterParams,
} from '@/types/complaint';

export async function getComplaints(
  params?: ComplaintFilterParams
): Promise<PageResponse<Complaint>> {
  const query = new URLSearchParams();

  if (params?.panchayatId !== undefined && params?.panchayatId !== null) {
    query.set('panchayatId', params.panchayatId.toString());
  }
  if (params?.search) query.set('search', params.search);
  if (params?.status) query.set('status', params.status);
  if (params?.category) query.set('category', params.category);
  if (params?.priority) query.set('priority', params.priority);
  if (params?.assignedTo !== undefined && params?.assignedTo !== null) {
    query.set('assignedTo', params.assignedTo.toString());
  }
  if (params?.citizenId !== undefined && params?.citizenId !== null) {
    query.set('citizenId', params.citizenId.toString());
  }
  if (params?.fromDate) query.set('fromDate', params.fromDate);
  if (params?.toDate) query.set('toDate', params.toDate);
  if (params?.page !== undefined) query.set('page', params.page.toString());
  if (params?.size !== undefined) query.set('size', params.size.toString());
  if (params?.sort) query.set('sort', params.sort);

  const queryString = query.toString();
  const endpoint = queryString ? `/complaints?${queryString}` : '/complaints';
  return fetchJson<PageResponse<Complaint>>(endpoint);
}

export async function getComplaintById(id: number): Promise<Complaint> {
  return fetchJson<Complaint>(`/complaints/${id}`);
}

export async function getComplaintHistory(id: number): Promise<ComplaintHistory[]> {
  return fetchJson<ComplaintHistory[]>(`/complaints/${id}/history`);
}

export async function getComplaintSummary(
  panchayatId?: number
): Promise<ComplaintSummary> {
  const query = panchayatId ? `?panchayatId=${panchayatId}` : '';
  return fetchJson<ComplaintSummary>(`/complaints/summary${query}`);
}

export async function createComplaint(
  payload: CreateComplaintPayload
): Promise<Complaint> {
  return fetchJson<Complaint>('/complaints', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateComplaint(
  id: number,
  payload: UpdateComplaintPayload
): Promise<Complaint> {
  return fetchJson<Complaint>(`/complaints/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function updateComplaintStatus(
  id: number,
  payload: UpdateComplaintStatusPayload
): Promise<Complaint> {
  return fetchJson<Complaint>(`/complaints/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function assignComplaint(
  id: number,
  payload: AssignComplaintPayload
): Promise<Complaint> {
  return fetchJson<Complaint>(`/complaints/${id}/assign`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function resolveComplaint(
  id: number,
  payload: ResolveComplaintPayload
): Promise<Complaint> {
  return fetchJson<Complaint>(`/complaints/${id}/resolve`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function closeComplaint(
  id: number,
  payload?: CloseComplaintPayload
): Promise<Complaint> {
  return fetchJson<Complaint>(`/complaints/${id}/close`, {
    method: 'PATCH',
    body: JSON.stringify(payload || {}),
  });
}
