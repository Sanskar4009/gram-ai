import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { PanchayatsPage } from '@/pages/PanchayatsPage';

const mockPanchayatsResponse = {
  content: [
    {
      id: 1,
      name: 'Rampur Gram Panchayat',
      code: 'RAMPUR01',
      district: 'Sehore',
      block: 'Ichhawar',
      state: 'Madhya Pradesh',
      active: true,
      createdAt: '2026-09-24T00:00:00Z',
      updatedAt: '2026-09-24T00:00:00Z',
    },
  ],
  page: 0,
  size: 10,
  totalElements: 1,
  totalPages: 1,
  last: true,
};

function renderPanchayatsPage(userRole = 'ADMIN') {
  localStorage.setItem('gramai_token', 'test-token');
  localStorage.setItem(
    'gramai_user',
    JSON.stringify({
      id: 1,
      fullName: 'Test User',
      email: 'user@gramai.in',
      role: userRole,
      panchayatId: 1,
    })
  );

  return render(
    <MemoryRouter>
      <AuthProvider>
        <PanchayatsPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('PanchayatsPage Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/panchayats')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockPanchayatsResponse,
        } as Response);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders Panchayat directory with table and loaded data', async () => {
    renderPanchayatsPage('ADMIN');

    expect(screen.getByText(/Panchayat Directory/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Rampur Gram Panchayat')).toBeInTheDocument();
      expect(screen.getByText('RAMPUR01')).toBeInTheDocument();
      expect(screen.getByText('Sehore')).toBeInTheDocument();
      expect(screen.getByText('Ichhawar')).toBeInTheDocument();
    });
  });

  it('shows "Add Panchayat" button for ADMIN and opens creation modal', async () => {
    renderPanchayatsPage('ADMIN');

    const addBtn = screen.getByRole('button', { name: /Add Panchayat/i });
    expect(addBtn).toBeInTheDocument();

    fireEvent.click(addBtn);

    expect(screen.getByText(/Create New Gram Panchayat/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g. Rampur Gram Panchayat/i)).toBeInTheDocument();
  });

  it('hides "Add Panchayat" button for non-ADMIN users (role-aware UI)', async () => {
    renderPanchayatsPage('SECRETARY');

    await waitFor(() => {
      expect(screen.getByText('Rampur Gram Panchayat')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /Add Panchayat/i })).not.toBeInTheDocument();
  });

  it('supports search input filtering', async () => {
    renderPanchayatsPage('ADMIN');

    const searchInput = screen.getByPlaceholderText(/Search by name, code, district.../i);
    fireEvent.change(searchInput, { target: { value: 'Rampur' } });

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=Rampur'),
        expect.anything()
      );
    });
  });
});
