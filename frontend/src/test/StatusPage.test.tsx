import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusPage } from '@/pages/StatusPage';

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('StatusPage Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Backend Online" when backend health returns UP', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'UP', service: 'gramai-backend' }),
    } as Response);

    renderWithClient(<StatusPage />);

    expect(screen.getByText(/Backend Status/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Backend Online')).toBeInTheDocument();
    });

    expect(screen.getByText(/gramai-backend/i)).toBeInTheDocument();
  });

  it('renders "Backend Offline" when backend health request fails', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

    renderWithClient(<StatusPage />);

    expect(screen.getByText(/Backend Status/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Backend Offline')).toBeInTheDocument();
    });
  });
});
