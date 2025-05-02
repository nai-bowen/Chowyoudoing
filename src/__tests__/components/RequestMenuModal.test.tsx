/*eslint-disable*/

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RequestMenuModal from '@/app/_components/RequestMenuModal';

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ message: 'Email sent' })
  })
) as any;

describe('RequestMenuModal', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when closed', () => {
    const { container } = render(<RequestMenuModal isOpen={false} onClose={onClose} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders form when open', () => {
    render(<RequestMenuModal isOpen={true} onClose={onClose} />);
    expect(screen.getByText(/Request a Menu/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Restaurant Name/i)).toBeInTheDocument();
  });

  it('submits form and shows success message', async () => {
    render(<RequestMenuModal isOpen={true} onClose={onClose} />);

    fireEvent.change(screen.getByLabelText(/Restaurant Name/i), {
      target: { value: 'Test Restaurant' },
    });
    fireEvent.change(screen.getByLabelText(/Location/i), {
      target: { value: 'NYC' },
    });
    fireEvent.change(screen.getByLabelText(/Restaurant Website or Social Media/i), {
      target: { value: 'https://example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Additional Details/i), {
      target: { value: 'Nice place' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Submit Request/i }));

    await waitFor(() => {
      expect(screen.getByText(/Your request has been submitted successfully!/i)).toBeInTheDocument();
    });
  });

  it('shows error message on failed request', async () => {
    (fetch as any).mockImplementationOnce(() =>
      Promise.resolve({ ok: false })
    );

    render(<RequestMenuModal isOpen={true} onClose={onClose} />);

    fireEvent.change(screen.getByLabelText(/Restaurant Name/i), {
      target: { value: 'Test Restaurant' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Submit Request/i }));

    await waitFor(() => {
      expect(screen.getByText(/Failed to submit request/i)).toBeInTheDocument();
    });
  });
});
