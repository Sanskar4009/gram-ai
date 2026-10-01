import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { CitizenDetailPage } from '@/pages/CitizenDetailPage';

const mockCitizen = {
  id: 5,
  fullName: 'Vikram Singh',
  mobile: '9876500005',
  village: 'Rampur',
  wardNumber: 3,
  address: 'Station Road, Rampur',
  status: 'ACTIVE',
  panchayatId: 1,
  panchayatName: 'Rampur Gram Panchayat',
  createdAt: '2026-09-24T00:00:00Z',
  updatedAt: '2026-09-24T00:00:00Z',
};

function renderCitizenDetailPage(userRole = 'SECRETARY') {
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
    <MemoryRouter initialEntries={['/citizens/5']}>
      <AuthProvider>
        <Routes>
          <Route path="/citizens/:id" element={<CitizenDetailPage />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('CitizenDetailPage Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.spyOn(window, 'confirm').mockImplementation(() => true);

    globalThis.fetch = vi.fn().mockImplementation((url: string, options: any) => {
      if (url.includes('/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 2,
            fullName: 'Rameshwar Sharma (Sachiv)',
            email: 'secretary@gramai.in',
            role: 'SECRETARY',
            panchayatId: 1,
          }),
        } as Response);
      }
      if (url.includes('/citizens/5/status')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ...mockCitizen, status: 'INACTIVE' }),
        } as Response);
      }
      if (url.includes('/citizens/5') && options?.method === 'PUT') {
        const body = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: async () => ({ ...mockCitizen, ...body }),
        } as Response);
      }
      if (url.includes('/citizens/5')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockCitizen,
        } as Response);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders citizen details profile, contact, village, ward, and address', async () => {
    renderCitizenDetailPage('SECRETARY');

    await waitFor(() => {
      expect(screen.getByText('Vikram Singh')).toBeInTheDocument();
      expect(screen.getByText('9876500005')).toBeInTheDocument();
      expect(screen.getByText('Station Road, Rampur')).toBeInTheDocument();
      expect(screen.getByText(/वार्ड क्रमांक 3/i)).toBeInTheDocument();
      expect(screen.getByText('Rampur Gram Panchayat')).toBeInTheDocument();
    });
  });

  it('renders future module placeholders for complaints, documents, and schemes', async () => {
    renderCitizenDetailPage('SECRETARY');

    await waitFor(() => {
      expect(screen.getByText(/शिकायतें \(Complaints\)/i)).toBeInTheDocument();
      expect(screen.getByText(/दस्तावेज़ \(Documents\)/i)).toBeInTheDocument();
      expect(screen.getByText(/योजना आवेदन \(Schemes\)/i)).toBeInTheDocument();
      expect(screen.getAllByText(/आने वाले मॉड्यूल में उपलब्ध/i).length).toBeGreaterThan(0);
    });
  });

  it('allows authorized user to open edit modal and save changes', async () => {
    renderCitizenDetailPage('SECRETARY');

    await waitFor(() => {
      expect(screen.getByText('Vikram Singh')).toBeInTheDocument();
    });

    const editBtn = screen.getByRole('button', { name: /संशोधित करें/i });
    fireEvent.click(editBtn);

    expect(screen.getByText(/नागरिक विवरण संपादित करें/i)).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/पूरा नाम/i);
    fireEvent.change(nameInput, { target: { value: 'Vikram Singh Patel' } });

    const saveBtn = screen.getByRole('button', { name: /संशोधन सहेजें/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/citizens/5'),
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('Vikram Singh Patel'),
        })
      );
    });
  });

  it('allows authorized user to toggle citizen status', async () => {
    renderCitizenDetailPage('SECRETARY');

    await waitFor(() => {
      expect(screen.getByText('Vikram Singh')).toBeInTheDocument();
    });

    const deactivateBtn = screen.getByRole('button', { name: /निष्क्रिय करें/i });
    fireEvent.click(deactivateBtn);

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/citizens/5/status'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ status: 'INACTIVE' }),
        })
      );
    });
  });
});
