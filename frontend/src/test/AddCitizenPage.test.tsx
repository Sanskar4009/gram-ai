import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { AddCitizenPage } from '@/pages/AddCitizenPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderAddCitizenPage() {
  localStorage.setItem('gramai_token', 'test-token');
  localStorage.setItem(
    'gramai_user',
    JSON.stringify({
      id: 2,
      fullName: 'Rameshwar Sharma (Sachiv)',
      email: 'secretary@gramai.in',
      role: 'SECRETARY',
      panchayatId: 1,
    })
  );

  return render(
    <MemoryRouter>
      <AuthProvider>
        <AddCitizenPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('AddCitizenPage Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();

    globalThis.fetch = vi.fn().mockImplementation((url: string, options: any) => {
      if (url.includes('/citizens') && options?.method === 'POST') {
        const body = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 10,
            fullName: body.fullName,
            mobile: body.mobile,
            village: body.village,
            wardNumber: body.wardNumber,
            address: body.address,
            status: 'ACTIVE',
            panchayatId: 1,
            panchayatName: 'Rampur Gram Panchayat',
            createdAt: '2026-09-25T00:00:00Z',
            updatedAt: '2026-09-25T00:00:00Z',
          }),
        } as Response);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders form inputs for Full Name, Mobile, Village, Ward, and Address', () => {
    renderAddCitizenPage();

    expect(screen.getByLabelText(/नागरिक का पूरा नाम/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/मोबाइल नंबर/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/गांव का नाम/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/वार्ड संख्या/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/स्थानीय पता/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /नागरिक पंजीकृत करें/i })).toBeInTheDocument();
  });

  it('displays validation errors when required fields are missing', async () => {
    renderAddCitizenPage();

    // Clear default wardNumber to trigger error
    const wardInput = screen.getByLabelText(/वार्ड संख्या/i);
    fireEvent.change(wardInput, { target: { value: '' } });

    const submitBtn = screen.getByRole('button', { name: /नागरिक पंजीकृत करें/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/नागरिक का पूरा नाम आवश्यक है/i)).toBeInTheDocument();
      expect(screen.getByText(/गांव का नाम आवश्यक है/i)).toBeInTheDocument();
      expect(screen.getByText(/मान्य वार्ड संख्या दर्ज करें/i)).toBeInTheDocument();
    });
  });

  it('submits valid citizen data and navigates to citizen details', async () => {
    renderAddCitizenPage();

    fireEvent.change(screen.getByLabelText(/नागरिक का पूरा नाम/i), {
      target: { value: 'राजेश पटेल' },
    });
    fireEvent.change(screen.getByLabelText(/मोबाइल नंबर/i), {
      target: { value: '9876543210' },
    });
    fireEvent.change(screen.getByLabelText(/गांव का नाम/i), {
      target: { value: 'हर्राभाट' },
    });
    fireEvent.change(screen.getByLabelText(/वार्ड संख्या/i), {
      target: { value: '3' },
    });
    fireEvent.change(screen.getByLabelText(/स्थानीय पता/i), {
      target: { value: 'मुख्य मार्ग, वार्ड 3' },
    });

    const submitBtn = screen.getByRole('button', { name: /नागरिक पंजीकृत करें/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/citizens'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('राजेश पटेल'),
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith(
        '/citizens/10',
        expect.objectContaining({
          state: expect.objectContaining({
            message: expect.stringContaining('राजेश पटेल'),
          }),
        })
      );
    });
  });
});
