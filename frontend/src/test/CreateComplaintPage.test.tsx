import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { CreateComplaintPage } from '@/pages/CreateComplaintPage';

const mockCitizens = {
  content: [
    {
      id: 1,
      fullName: 'Rameshwar Dayal',
      mobile: '9876500001',
      village: 'Rampur',
      wardNumber: 1,
      status: 'ACTIVE',
      panchayatId: 1,
    },
  ],
  totalElements: 1,
  totalPages: 1,
};

const mockUsers = {
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
  totalElements: 1,
  totalPages: 1,
};

function renderCreateComplaintPage(userRole = 'SECRETARY') {
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
        <CreateComplaintPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('CreateComplaintPage Component', () => {
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
      if (url.includes('/citizens')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockCitizens,
        } as Response);
      }
      if (url.includes('/users')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockUsers,
        } as Response);
      }
      if (url.includes('/complaints') && options?.method === 'POST') {
        const body = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 10,
            complaintNumber: 'CMP-2026-000010',
            title: body.title,
            description: body.description,
            category: body.category,
            priority: body.priority || 'MEDIUM',
            status: 'OPEN',
            panchayatId: 1,
            citizenId: body.citizenId,
          }),
        } as Response);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders form inputs for citizen, category, priority, title, description', async () => {
    renderCreateComplaintPage('SECRETARY');

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /नई शिकायत दर्ज करें/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/नागरिक/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/श्रेणी/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/प्राथमिकता/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/शीर्षक/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/विवरण/i)).toBeInTheDocument();
    });
  });

  it('validates mandatory fields and blocks submission when empty', async () => {
    renderCreateComplaintPage('SECRETARY');

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /नई शिकायत दर्ज करें/i })).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /शिकायत दर्ज करें/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/कृपया शिकायतकर्ता नागरिक का चयन करें/i)).toBeInTheDocument();
    });
  });

  it('submits valid complaint and displays generated complaint number', async () => {
    renderCreateComplaintPage('SECRETARY');

    await waitFor(() => {
      expect(screen.getByText(/Rameshwar Dayal/i)).toBeInTheDocument();
    });

    const citizenSelect = screen.getByLabelText(/नागरिक/i);
    fireEvent.change(citizenSelect, { target: { value: '1' } });

    const titleInput = screen.getByLabelText(/शीर्षक/i);
    fireEvent.change(titleInput, { target: { value: 'Pipeline burst near tank' } });

    const descInput = screen.getByLabelText(/विवरण/i);
    fireEvent.change(descInput, { target: { value: 'Water flooding the road' } });

    const submitBtn = screen.getByRole('button', { name: /शिकायत दर्ज करें/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/CMP-2026-000010/i)).toBeInTheDocument();
    });
  });
});
