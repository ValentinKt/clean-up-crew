import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Login from '../components/Login';

vi.mock('../services/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null })
    }
  }
}));

describe('Login component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('toggles to registration and shows confirm password', () => {
    render(<Login />);
    const toggleBtn = screen.getByRole('button', { name: /register/i });
    fireEvent.click(toggleBtn);
    expect(screen.getByPlaceholderText(/confirm password/i)).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    render(<Login />);
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    fireEvent.change(screen.getByPlaceholderText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/^password$/i), { target: { value: 'StrongPass1!' } });
    fireEvent.change(screen.getByPlaceholderText(/confirm password/i), { target: { value: 'Mismatch' } });
    fireEvent.submit(screen.getByRole('button', { name: /create account/i }).closest('form')!);
    expect(await screen.findByRole('alert')).toHaveTextContent(/passwords do not match/i);
  });

  it('sets rememberMe in localStorage on login', async () => {
    render(<Login />);
    fireEvent.change(screen.getByPlaceholderText(/email address/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/^password$/i), { target: { value: 'StrongPass1!' } });

    const rememberCheckbox = screen.getByLabelText(/remember me/i);
    fireEvent.click(rememberCheckbox); // toggle off

    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form')!);
    // Allow promises to resolve
    await new Promise(r => setTimeout(r, 0));
    expect(localStorage.getItem('rememberMe')).toBe('false');
  });
});