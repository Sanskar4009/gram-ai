import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ComplaintsPage } from '@/pages/ComplaintsPage';

const mockComplaintsResponse = {
  content: [
    {
      id: 1,
      complaintNumber: 'CMP-2026-000001',
      panchayatId: 1,
      panchayatName: 'Rampur Gram Panchayat',
      citizenId: 1,
      citizenName: 'Rameshwar Dayal',
      citizenMobile: '9876500001',
      citizenVillage: 'Rampur',
      citizenWardNumber: 1,
      category: 'WATER',
      categoryHindi: 'पेयजल',
      categoryEnglish: 'Water Supply',
      title: 'Water supply pipeline leakage',
      description: 'Main pipeline leaking near the water tank',
      priority: 'HIGH',
      priorityHindi: 'उच्च',
      priorityEnglish: 'High',
      status: 'IN_PROGRESS',
      statusHindi: 'कार्य प्रगति पर',
      statusEnglish: 'In Progress',
      assignedTo: 4,
      assignedToName: 'Sunil Verma (GRS)',
      assignedToRole: 'GRS',
      resolution: null,
      createdAt: '2026-09-24T00:00:00Z',
      updatedAt: '2026-09-24T00:00:00Z',
      resolvedAt: null,
    },
    {
      id: 2,
      complaintNumber: 'CMP-2026-000002',
      panchayatId: 1,
      panchayatName: 'Rampur Gram Panchayat',
      citizenId: 2,
      citizenName: 'Sita Devi',
      citizenMobile: '9876500002',
      citizenVillage: 'Harrabhat',
      citizenWardNumber: 2,
      category: 'STREET_LIGHT',
      categoryHindi: 'स्ट्रीट लाइट',
      categoryEnglish: 'Street Lighting',
      title: 'Streetlight not working in Ward 2',
      description: 'Pole light broken',
      priority: 'MEDIUM',
      priorityHindi: 'मध्यम',
      priorityEnglish: 'Medium',
      status: 'OPEN',
      statusHindi: 'खुली',
      statusEnglish: 'Open',
      assignedTo: null,
      assignedToName: null,
      assignedToRole: null,
      resolution: null,
      createdAt: '2026-09-24T00:00:00Z',
      updatedAt: '2026-09-24T00:00:00Z',
      resolvedAt: null,
    },
  ],
  page: 0,
  size: 15,
  totalElements: 2,
  totalPages: 1,
  last: true,
};

const mockSummaryResponse = {
  total: 2,
  open: 1,
  inProgress: 1,
  waiting: 0,
  resolved: 0,
  closed: 0,
  rejected: 0,
  byCategory: { WATER: 1, STREET_LIGHT: 1 },
  byPriority: { HIGH: 1, MEDIUM: 1 },
};

function renderComplaintsPage(userRole = 'SECRETARY') {
  localStorage.setItem('gramai_token', 'test-token');
  localStorage.setItem(
    'gramai_user',
    JSON.stringify({
      id: 2,
      fullName: 'Rameshwar Sharma (Sachiv)',
      email: 'secretary@gramai.in',
      role: userRole,
      panchayatId: 1,
    })
  );

  return render(
    <MemoryRouter>
      <AuthProvider>
        <ComplaintsPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('ComplaintsPage Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/auth/me')) {
        const saved = localStorage.getItem('gramai_user');
        return Promise.resolve({
          ok: true,
          json: async () => (saved ? JSON.parse(saved) : {}),
        } as Response);
      }
      if (url.includes('/complaints/summary')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockSummaryResponse,
        } as Response);
      }
      if (url.includes('/complaints')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockComplaintsResponse,
        } as Response);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders complaints header, count badge, and table with complaints', async () => {
    renderComplaintsPage('SECRETARY');

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /शिकायतें/i })).toBeInTheDocument();
      expect(screen.getByText('CMP-2026-000001')).toBeInTheDocument();
      expect(screen.getByText('CMP-2026-000002')).toBeInTheDocument();
      expect(screen.getByText('Water supply pipeline leakage')).toBeInTheDocument();
      expect(screen.getByText('Rameshwar Dayal')).toBeInTheDocument();
      expect(screen.getByText('Sunil Verma (GRS)')).toBeInTheDocument();
    });
  });

  it('renders summary statistics cards with open, in progress counts', async () => {
    renderComplaintsPage('SECRETARY');

    await waitFor(() => {
      expect(screen.getAllByText(/कुल शिकायतें/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/खुली \(Open\)/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/प्रगति पर/i).length).toBeGreaterThan(0);
    });
  });

  it('supports search and filter inputs', async () => {
    renderComplaintsPage('SECRETARY');

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/खोजें: शिकायत क्रमांक/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/खोजें: शिकायत क्रमांक/i);
    fireEvent.change(searchInput, { target: { value: 'Water' } });

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=Water'),
        expect.anything()
      );
    });
  });

  it('shows "नई शिकायत दर्ज करें" button for authorized staff roles', async () => {
    renderComplaintsPage('SECRETARY');

    await waitFor(() => {
      expect(screen.getByText(/नई शिकायत दर्ज करें/i)).toBeInTheDocument();
    });
  });
});
