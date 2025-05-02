/*eslint-disable*/

import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { useSession } from 'next-auth/react';
import Navbar from '@/app/_components/Home-Navbar';

// Mock useSession
vi.mocked(useSession).mockReturnValue({
  data: null,
  status: 'unauthenticated',
  update: vi.fn(),
});

describe('Navbar Component', () => {
  test('renders the logo', () => {
    render(<Navbar />);
    const logoElement = screen.getByText(/CHOW YOU DOING/i);
    expect(logoElement).toBeInTheDocument();
  });


  test('shows dashboard link when authenticated', () => {
    // Mock authenticated session
    vi.mocked(useSession).mockReturnValueOnce({
      data: { user: { id: '1', name: 'Test User', email: 'test@example.com' } } as any,
      status: 'authenticated',
      update: vi.fn(),
    });

    render(<Navbar />);
    const dashboardLink = screen.getByText(/Dashboard/i);
    expect(dashboardLink).toBeInTheDocument();
  });
});