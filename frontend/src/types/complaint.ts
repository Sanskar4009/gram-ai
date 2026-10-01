export type ComplaintCategory =
  | 'WATER'
  | 'SCHOOL'
  | 'ROAD'
  | 'SANITATION'
  | 'HEALTH'
  | 'ANGANWADI'
  | 'MGNREGA'
  | 'HOUSING'
  | 'STREET_LIGHT'
  | 'OTHER';

export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type ComplaintStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'WAITING'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REJECTED';

export interface ComplaintCategoryMeta {
  key: ComplaintCategory;
  hindi: string;
  english: string;
}

export const COMPLAINT_CATEGORIES: ComplaintCategoryMeta[] = [
  { key: 'WATER', hindi: 'पेयजल', english: 'Water Supply' },
  { key: 'ROAD', hindi: 'सड़क एवं पुलिया', english: 'Road & Culvert' },
  { key: 'SANITATION', hindi: 'स्वच्छता एवं नाली', english: 'Sanitation & Drainage' },
  { key: 'STREET_LIGHT', hindi: 'स्ट्रीट लाइट', english: 'Street Lighting' },
  { key: 'HEALTH', hindi: 'स्वास्थ्य सेवाएं', english: 'Health Services' },
  { key: 'SCHOOL', hindi: 'शाला / शिक्षा', english: 'School Infrastructure' },
  { key: 'ANGANWADI', hindi: 'आंगनवाड़ी', english: 'Anganwadi Nutrition' },
  { key: 'MGNREGA', hindi: 'मनरेगा कार्य', english: 'MGNREGA Works' },
  { key: 'HOUSING', hindi: 'पीएम आवास', english: 'PM Awas Housing' },
  { key: 'OTHER', hindi: 'अन्य शिकायतें', english: 'Other Grievances' },
];

export interface ComplaintPriorityMeta {
  key: ComplaintPriority;
  hindi: string;
  english: string;
  colorClass: string;
  badgeBg: string;
}

export const COMPLAINT_PRIORITIES: ComplaintPriorityMeta[] = [
  { key: 'LOW', hindi: 'सामान्य', english: 'Low', colorClass: 'text-slate-600', badgeBg: 'bg-slate-100 text-slate-700 border-slate-200' },
  { key: 'MEDIUM', hindi: 'मध्यम', english: 'Medium', colorClass: 'text-blue-700', badgeBg: 'bg-blue-50 text-blue-700 border-blue-200' },
  { key: 'HIGH', hindi: 'उच्च', english: 'High', colorClass: 'text-amber-700', badgeBg: 'bg-amber-50 text-amber-700 border-amber-200' },
  { key: 'URGENT', hindi: 'अति आवश्यक', english: 'Urgent', colorClass: 'text-rose-700', badgeBg: 'bg-rose-50 text-rose-700 border-rose-200 font-bold' },
];

export interface ComplaintStatusMeta {
  key: ComplaintStatus;
  hindi: string;
  english: string;
  dotColor: string;
  badgeBg: string;
}

export const COMPLAINT_STATUSES: Record<ComplaintStatus, ComplaintStatusMeta> = {
  OPEN: {
    key: 'OPEN',
    hindi: 'खुली',
    english: 'Open',
    dotColor: 'bg-blue-500',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  IN_PROGRESS: {
    key: 'IN_PROGRESS',
    hindi: 'कार्य प्रगति पर',
    english: 'In Progress',
    dotColor: 'bg-amber-500 animate-pulse',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  WAITING: {
    key: 'WAITING',
    hindi: 'प्रतीक्षारत',
    english: 'Waiting / Escalated',
    dotColor: 'bg-purple-500',
    badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  RESOLVED: {
    key: 'RESOLVED',
    hindi: 'समाधान किया गया',
    english: 'Resolved',
    dotColor: 'bg-emerald-500',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  CLOSED: {
    key: 'CLOSED',
    hindi: 'बंद',
    english: 'Closed',
    dotColor: 'bg-slate-400',
    badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  REJECTED: {
    key: 'REJECTED',
    hindi: 'अस्वीकृत',
    english: 'Rejected',
    dotColor: 'bg-rose-500',
    badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
  },
};

export interface Complaint {
  id: number;
  complaintNumber: string;
  panchayatId: number;
  panchayatName?: string;
  citizenId: number;
  citizenName?: string;
  citizenMobile?: string;
  citizenVillage?: string;
  citizenWardNumber?: number;
  category: ComplaintCategory;
  categoryHindi?: string;
  categoryEnglish?: string;
  title: string;
  description: string;
  priority: ComplaintPriority;
  priorityHindi?: string;
  priorityEnglish?: string;
  status: ComplaintStatus;
  statusHindi?: string;
  statusEnglish?: string;
  assignedTo?: number | null;
  assignedToName?: string | null;
  assignedToRole?: string | null;
  resolution?: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
}

export interface ComplaintHistory {
  id: number;
  complaintId: number;
  action: string;
  fromStatus?: ComplaintStatus | null;
  toStatus?: ComplaintStatus | null;
  performedBy?: number | null;
  performedByName?: string | null;
  performedByRole?: string | null;
  details?: string | null;
  createdAt: string;
}

export interface ComplaintSummary {
  total: number;
  open: number;
  inProgress: number;
  waiting: number;
  resolved: number;
  closed: number;
  rejected: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
}

export interface CreateComplaintPayload {
  citizenId: number;
  category: ComplaintCategory;
  title: string;
  description: string;
  priority?: ComplaintPriority;
  assignedTo?: number | null;
  panchayatId?: number;
}

export interface UpdateComplaintPayload {
  citizenId?: number;
  category?: ComplaintCategory;
  title?: string;
  description?: string;
  priority?: ComplaintPriority;
  assignedTo?: number | null;
}

export interface UpdateComplaintStatusPayload {
  status: ComplaintStatus;
  resolution?: string;
  note?: string;
}

export interface AssignComplaintPayload {
  assignedTo: number | null;
  note?: string;
}

export interface ResolveComplaintPayload {
  resolution: string;
  additionalNotes?: string;
}

export interface CloseComplaintPayload {
  closingRemarks?: string;
}

export interface ComplaintFilterParams {
  panchayatId?: number;
  search?: string;
  status?: ComplaintStatus;
  category?: ComplaintCategory;
  priority?: ComplaintPriority;
  assignedTo?: number;
  citizenId?: number;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
  sort?: string;
}
