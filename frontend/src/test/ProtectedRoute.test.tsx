import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/routes/ProtectedRoute';

const MockProtectedPage = () => {
  const { user, logout } = useAuth();
  return (
    <div>
      <h1>Protected Dashboard</h1>
      <p data-testid="user-name">{user?.fullName}</p>
      <button onClick={logout}>Sign Out</button>
    </div>
  );
};

function renderWithAuth(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>Login Screen</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<MockProtectedPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('ProtectedRoute and Session Behavior', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('redirects unauthenticated user to /login when visiting protected route', async () => {
    renderWithAuth('/');

    await waitFor(() => {
      expect(screen.getByText('Login Screen')).toBeInTheDocument();
    });
  });

  it('allows authenticated user to view protected page', async () => {
    localStorage.setItem('gramai_token', 'valid-test-token');
    localStorage.setItem(
      'gramai_user',
      JSON.stringify({
        id: 1,
        fullName: 'Rameshwar Sharma',
        email: 'secretary@gramai.in',
        role: 'SECRETARY',
        panchayatId: 1,
      })
    );

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 1,
        fullName: 'Rameshwar Sharma',
        email: 'secretary@gramai.in',
        role: 'SECRETARY',
        panchayatId: 1,
      }),
    } as Response);

    renderWithAuth('/');

    await waitFor(() => {
      expect(screen.getByText('Protected Dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('user-name')).toHaveTextContent('Rameshwar Sharma');
    });
  });

  it('logout clears authentication state and redirects to /login', async () => {
    localStorage.setItem('gramai_token', 'valid-test-token');
    localStorage.setItem(
      'gramai_user',
      JSON.stringify({
        id: 1,
        fullName: 'Rameshwar Sharma',
        email: 'secretary@gramai.in',
        role: 'SECRETARY',
        panchayatId: 1,
      })
    );

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 1,
        fullName: 'Rameshwar Sharma',
        email: 'secretary@gramai.in',
        role: 'SECRETARY',
        panchayatId: 1,
      }),
    } as Response);

    renderWithAuth('/');

    await waitFor(() => {
      expect(screen.getByText('Protected Dashboard')).toBeInTheDocument();
    });

    const signOutBtn = screen.getByRole('button', { name: /Sign Out/i });
    fireEvent.click(signOutBtn);

    await waitFor(() => {
      expect(screen.getByText('Login Screen')).toBeInTheDocument();
    });

    expect(localStorage.getItem('gramai_token')).toBeNull();
    expect(localStorage.getItem('gramai_user')).toBeNull();
  });
});
