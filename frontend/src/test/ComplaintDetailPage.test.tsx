import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ComplaintDetailPage } from '@/pages/ComplaintDetailPage';

const mockComplaint = {
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
};

const mockHistory = [
  {
    id: 1,
    complaintId: 1,
    action: 'CREATED',
    fromStatus: null,
    toStatus: 'OPEN',
    performedBy: 2,
    performedByName: 'Rameshwar Sharma (Sachiv)',
    performedByRole: 'SECRETARY',
    details: 'Complaint filed: Water supply pipeline leakage',
    createdAt: '2026-09-24T00:00:00Z',
  },
];

const mockStaffUsers = {
  content: [
    {
      id: 4,
      fullName: 'Sunil Verma',
      email: 'grs@gramai.in',
      mobile: '9876543213',
      role: 'GRS',
      active: true,
      panchayatId: 1,
    },
  ],
};

function renderComplaintDetailPage(userRole = 'SECRETARY') {
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
    <MemoryRouter initialEntries={['/complaints/1']}>
      <AuthProvider>
        <Routes>
          <Route path="/complaints/:id" element={<ComplaintDetailPage />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('ComplaintDetailPage Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();

    globalThis.fetch = vi.fn().mockImplementation((url: string, options: any) => {
      if (url.includes('/auth/me')) {
        const saved = localStorage.getItem('gramai_user');
        return Promise.resolve({
          ok: true,
          json: async () => (saved ? JSON.parse(saved) : {}),
        } as Response);
      }
      if (url.includes('/users')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockStaffUsers,
        } as Response);
      }
      if (url.includes('/complaints/1/history')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockHistory,
        } as Response);
      }
      if (url.includes('/complaints/1/status') && options?.method === 'PATCH') {
        const body = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: async () => ({ ...mockComplaint, status: body.status }),
        } as Response);
      }
      if (url.includes('/complaints/1/assign') && options?.method === 'PATCH') {
        const body = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: async () => ({ ...mockComplaint, assignedTo: body.assignedTo, assignedToName: 'Sunil Verma' }),
        } as Response);
      }
      if (url.includes('/complaints/1/resolve') && options?.method === 'PATCH') {
        const body = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ...mockComplaint,
            status: 'RESOLVED',
            resolution: body.resolution,
            resolvedAt: new Date().toISOString(),
          }),
        } as Response);
      }
      if (url.includes('/complaints/1')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockComplaint,
        } as Response);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders complaint profile, complaint number, citizen info, and activity history', async () => {
    renderComplaintDetailPage('SECRETARY');

    await waitFor(() => {
      expect(screen.getByText('CMP-2026-000001')).toBeInTheDocument();
    });
    expect(screen.getAllByText(/Water supply pipeline leakage/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Rameshwar Dayal/i)).toBeInTheDocument();
    expect(screen.getAllByText(/खुली/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/created/i).length).toBeGreaterThan(0);
  });

  it('allows starting work on OPEN complaint to transition to IN_PROGRESS', async () => {
    renderComplaintDetailPage('SECRETARY');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /कार्य प्रारंभ करें/i })).toBeInTheDocument();
    });

    const startWorkBtn = screen.getByRole('button', { name: /कार्य प्रारंभ करें/i });
    fireEvent.click(startWorkBtn);

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/complaints/1/status'),
        expect.objectContaining({ method: 'PATCH' })
      );
    });
  });

  it('allows opening assign modal and assigning to a staff member', async () => {
    renderComplaintDetailPage('SECRETARY');

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /स्टाफ असाइन करें/i }).length).toBeGreaterThan(0);
    });

    const assignModalBtn = screen.getAllByRole('button', { name: /स्टाफ असाइन करें/i })[0];
    fireEvent.click(assignModalBtn);

    await waitFor(() => {
      expect(screen.getByText(/शिकायत असाइन करें \(Assign Complaint\)/i)).toBeInTheDocument();
    });

    const assigneeSelect = screen.getByRole('combobox');
    fireEvent.change(assigneeSelect, { target: { value: '4' } });

    const confirmAssignBtn = screen.getByRole('button', { name: /^असाइन करें$/i });
    fireEvent.click(confirmAssignBtn);

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/complaints/1/assign'),
        expect.objectContaining({ method: 'PATCH' })
      );
    });
  });
});
