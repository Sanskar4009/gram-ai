import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { LoginPage } from '@/pages/LoginPage';

function renderLoginPage(initialRoute = '/login') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<div data-testid="dashboard">Dashboard View</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('LoginPage Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form with email, password, and sign in button', () => {
    renderLoginPage();

    expect(screen.getByText(/GramAI Staff Portal/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Official Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Security Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('displays client-side validation errors when submitting invalid inputs', async () => {
    renderLoginPage();

    const submitBtn = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/Password is required/i)).toBeInTheDocument();
  });

  it('handles successful login by saving token and redirecting', async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/auth/login')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            token: 'mock-jwt-token-123',
            user: {
              id: 1,
              fullName: 'Rameshwar Sharma',
              email: 'secretary@gramai.in',
              role: 'SECRETARY',
              panchayatId: 1,
            },
          }),
        } as Response);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
    });

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/Official Email Address/i), {
      target: { value: 'secretary@gramai.in' },
    });
    fireEvent.change(screen.getByLabelText(/Security Password/i), {
      target: { value: 'Secretary@123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });

    expect(localStorage.getItem('gramai_token')).toBe('mock-jwt-token-123');
  });

  it('displays generic error message on invalid credentials without exposing user enumeration', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        status: 401,
        message: 'Invalid email or password',
      }),
    } as Response);

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/Official Email Address/i), {
      target: { value: 'unknown@gramai.in' },
    });
    fireEvent.change(screen.getByLabelText(/Security Password/i), {
      target: { value: 'WrongPass@123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Invalid email or password/i)).toBeInTheDocument();
    });
  });
});
