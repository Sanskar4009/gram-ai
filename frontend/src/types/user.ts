export type UserRole =
  | 'ADMIN'
  | 'SECRETARY'
  | 'SARPANCH'
  | 'GRS'
  | 'PANCH'
  | 'CITIZEN';

export interface ManagedUser {
  id: number;
  fullName: string;
  email: string;
  mobile: string;
  role: UserRole;
  panchayatId?: number | null;
  panchayatName?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  fullName: string;
  email: string;
  mobile: string;
  password: string;
  role: UserRole;
  panchayatId?: number | null;
}

export interface UpdateUserInput {
  fullName: string;
  email: string;
  mobile: string;
  role?: UserRole;
  panchayatId?: number | null;
}

export interface UpdateUserStatusInput {
  active: boolean;
}
