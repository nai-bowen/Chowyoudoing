/*eslint-disable*/

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { signIn } from 'next-auth/react';
import LoginPage from '@/app/login/page';

// Mock the next/navigation import
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

// Mock next-auth signIn function
vi.mock('next-auth/react', async () => {
  const actual = await vi.importActual('next-auth/react');
  return {
    ...actual,
    signIn: vi.fn(),
  };
});

describe('Login Page', () => {
  test('renders login form', () => {
    render(<LoginPage />);
    
    expect(screen.getByText(/SIGN IN TO YOUR FOODIE ACCOUNT/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /SIGN IN/i })).toBeInTheDocument();
  });

  test('shows error message on failed login', async () => {
    // Mock signIn to return an error
    vi.mocked(signIn).mockResolvedValueOnce({ 
      error: 'Invalid credentials', 
      ok: false,
      status: 401,
    } as any);

    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitButton = screen.getByRole('button', { name: /SIGN IN/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
    });
  });

  test('submits the form with user credentials', async () => {
    // Mock successful signIn
    vi.mocked(signIn).mockResolvedValueOnce({ 
      ok: true, 
      error: null,
    } as any);

    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitButton = screen.getByRole('button', { name: /SIGN IN/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: 'Password123',
        redirect: false,
      });
    });
  });
});