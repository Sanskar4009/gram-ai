export interface Panchayat {
  id: number;
  name: string;
  code: string;
  district: string;
  block: string;
  state: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePanchayatInput {
  name: string;
  code: string;
  district: string;
  block: string;
  state: string;
}

export interface UpdatePanchayatInput {
  name: string;
  code: string;
  district: string;
  block: string;
  state: string;
  active?: boolean;
}
