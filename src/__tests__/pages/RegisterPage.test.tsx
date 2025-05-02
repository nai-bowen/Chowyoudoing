/*eslint-disable*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import RegisterPage from '@/app/register/page';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Session } from 'next-auth';

vi.mock('next/navigation', async () => {
  const actual = await vi.importActual<any>('next/navigation');
  return {
    ...actual,
    useRouter: vi.fn(),
    useSearchParams: vi.fn(),
  };
});

vi.mock('next-auth/react', async () => {
  const actual = await vi.importActual<any>('next-auth/react');
  return {
    ...actual,
    useSession: vi.fn(),
    signIn: vi.fn(),
  };
});

describe('RegisterPage', () => {
  const push = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push } as any);
    vi.mocked(useSearchParams).mockReturnValue({ get: () => null } as any);
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: function (data?: any): Promise<Session | null> {
        throw new Error('Function not implemented.');
      }
    });
  });

  it('renders initial form inputs', () => {
    render(<RegisterPage />);

    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByText(/Continue with Google/i)).toBeInTheDocument();
  });

  it('shows referral code hint', () => {
    vi.mocked(useSearchParams).mockReturnValue({
      get: (key: string) => (key === 'ref' ? 'XYZ123' : null),
    } as any);

    render(<RegisterPage />);

    expect(screen.getByText(/Referral code applied/i)).toBeInTheDocument();
  });

  it('displays Google completion mode UI', async () => {
    vi.mocked(useSearchParams).mockReturnValue({
      get: (key: string) =>
        key === 'mode' ? 'complete-google-profile' : key === 'ref' ? 'REFCODE' : null,
    } as any);

    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          id: 'mock-user-id',
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          interests: ['Pizza'],
        },
        expires: '9999-12-31T23:59:59.999Z',
      },
      status: 'authenticated',
      update: vi.fn(),
    });

    render(<RegisterPage />);

    expect(await screen.findByText(/COMPLETE YOUR PROFILE/i)).toBeInTheDocument();
    expect(await screen.findByText(/Welcome, Jane!/i)).toBeInTheDocument();
    expect(screen.getByText(/Referral Code:/i)).toBeInTheDocument();
  });
});
