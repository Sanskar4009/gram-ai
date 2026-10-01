export type CitizenStatus = 'ACTIVE' | 'INACTIVE';

export interface Citizen {
  id: number;
  panchayatId: number;
  panchayatName?: string;
  fullName: string;
  mobile?: string | null;
  village: string;
  wardNumber: number;
  address?: string | null;
  status: CitizenStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCitizenInput {
  fullName: string;
  mobile?: string | null;
  village: string;
  wardNumber: number;
  address?: string | null;
  panchayatId?: number;
}

export interface UpdateCitizenInput {
  fullName: string;
  mobile?: string | null;
  village: string;
  wardNumber: number;
  address?: string | null;
  panchayatId?: number;
}
