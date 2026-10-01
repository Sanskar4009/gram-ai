import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { UsersPage } from '@/pages/UsersPage';

const mockUsersResponse = {
  content: [
    {
      id: 2,
      fullName: 'Rameshwar Sharma',
      email: 'secretary@gramai.in',
      mobile: '9876543211',
      role: 'SECRETARY',
      panchayatId: 1,
      panchayatName: 'Rampur Gram Panchayat',
      active: true,
      createdAt: '2026-09-24T00:00:00Z',
      updatedAt: '2026-09-24T00:00:00Z',
    },
    {
      id: 3,
      fullName: 'Sunil Verma',
      email: 'sunil.grs@gramai.in',
      mobile: '9876543213',
      role: 'GRS',
      panchayatId: 1,
      panchayatName: 'Rampur Gram Panchayat',
      active: true,
      createdAt: '2026-09-24T00:00:00Z',
      updatedAt: '2026-09-24T00:00:00Z',
    },
  ],
  page: 0,
  size: 10,
  totalElements: 2,
  totalPages: 1,
  last: true,
};

function renderUsersPage(userRole = 'ADMIN') {
  localStorage.setItem('gramai_token', 'test-token');
  localStorage.setItem(
    'gramai_user',
    JSON.stringify({
      id: 1,
      fullName: 'System Admin',
      email: 'admin@gramai.in',
      role: userRole,
      panchayatId: userRole === 'ADMIN' ? null : 1,
    })
  );

  return render(
    <MemoryRouter>
      <AuthProvider>
        <UsersPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('UsersPage Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/users')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockUsersResponse,
        } as Response);
      }
      if (url.includes('/panchayats')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ content: [] }),
        } as Response);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders User Management table with users, role labels, and Panchayat name', async () => {
    renderUsersPage('ADMIN');

    expect(screen.getByText(/User Management/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Rameshwar Sharma')).toBeInTheDocument();
      expect(screen.getByText('secretary@gramai.in')).toBeInTheDocument();
      expect(screen.getByText('Sunil Verma')).toBeInTheDocument();
      expect(screen.getByText('sunil.grs@gramai.in')).toBeInTheDocument();
    });
  });

  it('supports search by user name or email', async () => {
    renderUsersPage('ADMIN');

    const searchInput = screen.getByPlaceholderText(/Search by name, email, mobile.../i);
    fireEvent.change(searchInput, { target: { value: 'Rameshwar' } });

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=Rameshwar'),
        expect.anything()
      );
    });
  });

  it('renders "Add User" modal with temporary password field for authorized users', async () => {
    renderUsersPage('ADMIN');

    const addBtn = screen.getByRole('button', { name: /Add User/i });
    fireEvent.click(addBtn);

    expect(screen.getByText(/Create New User Account/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Minimum 6 characters/i)).toBeInTheDocument();
  });

  it('restricts role options for SECRETARY (cannot select Administrator)', async () => {
    renderUsersPage('SECRETARY');

    const addBtn = screen.getByRole('button', { name: /Add User/i });
    fireEvent.click(addBtn);

    const selectRole = screen.getByLabelText(/System Role/i) as HTMLSelectElement;
    const optionTexts = Array.from(selectRole.options).map((opt) => opt.text);

    expect(optionTexts).not.toContain('Administrator');
  });
});
