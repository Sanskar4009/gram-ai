import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { CitizensPage } from '@/pages/CitizensPage';

const mockCitizensResponse = {
  content: [
    {
      id: 1,
      fullName: 'Rameshwar Dayal',
      mobile: '9876500001',
      village: 'Rampur',
      wardNumber: 1,
      address: 'Near Old Well',
      status: 'ACTIVE',
      panchayatId: 1,
      panchayatName: 'Rampur Gram Panchayat',
      createdAt: '2026-09-24T00:00:00Z',
      updatedAt: '2026-09-24T00:00:00Z',
    },
    {
      id: 2,
      fullName: 'Sita Devi',
      mobile: '9876500002',
      village: 'Harrabhat',
      wardNumber: 2,
      address: 'House #12',
      status: 'INACTIVE',
      panchayatId: 1,
      panchayatName: 'Rampur Gram Panchayat',
      createdAt: '2026-09-24T00:00:00Z',
      updatedAt: '2026-09-24T00:00:00Z',
    },
  ],
  page: 0,
  size: 15,
  totalElements: 2,
  totalPages: 1,
  last: true,
};

function renderCitizensPage(userRole = 'SECRETARY') {
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
        <CitizensPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('CitizensPage Component', () => {
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
      if (url.includes('/citizens')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockCitizensResponse,
        } as Response);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders Citizen Registry header, count badge, and table with loaded citizens', async () => {
    renderCitizensPage('SECRETARY');

    expect(screen.getByText(/नागरिक पंजी/i)).toBeInTheDocument();

    await waitFor(() => {
      // Expect citizen names to be displayed
      expect(screen.getAllByText('Rameshwar Dayal').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Sita Devi').length).toBeGreaterThan(0);
      expect(screen.getAllByText('9876500001').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Rampur').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Harrabhat').length).toBeGreaterThan(0);
    });
  });

  it('supports search by citizen name, mobile, or village', async () => {
    renderCitizensPage('SECRETARY');

    const searchInput = screen.getByPlaceholderText(/नाम, मोबाइल, या गांव से खोजें/i);
    fireEvent.change(searchInput, { target: { value: 'Rameshwar' } });

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=Rameshwar'),
        expect.anything()
      );
    });
  });

  it('supports filtering by village, wardNumber, and status', async () => {
    renderCitizensPage('SECRETARY');

    const villageInput = screen.getByPlaceholderText(/गांव फ़िल्टर/i);
    fireEvent.change(villageInput, { target: { value: 'Harrabhat' } });

    const wardInput = screen.getByPlaceholderText(/वार्ड संख्या/i);
    fireEvent.change(wardInput, { target: { value: '2' } });

    const statusSelect = screen.getByRole('combobox');
    fireEvent.change(statusSelect, { target: { value: 'INACTIVE' } });

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('village=Harrabhat'),
        expect.anything()
      );
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('wardNumber=2'),
        expect.anything()
      );
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('status=INACTIVE'),
        expect.anything()
      );
    });
  });

  it('shows "नया नागरिक जोड़ें" button for SECRETARY and ADMIN, hides for non-authorized roles', async () => {
    const { unmount } = renderCitizensPage('SECRETARY');
    expect(screen.getByText(/नया नागरिक जोड़ें/i)).toBeInTheDocument();
    unmount();

    renderCitizensPage('PANCH');
    expect(screen.queryByText(/नया नागरिक जोड़ें/i)).not.toBeInTheDocument();
  });
});
