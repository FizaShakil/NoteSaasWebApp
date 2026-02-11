import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ResetPasswordPage from '../ResetPasswordPage';
import { authApi } from '../../utils/api';

// Mock the API
jest.mock('../../utils/api', () => ({
  authApi: {
    resetPassword: jest.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ApiError';
    }
  },
}));

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderResetPasswordPage = (token = 'valid-token') => {
  return render(
    <MemoryRouter
      initialEntries={[`/reset-password?token=${token}`]}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('initial render', () => {
    it('displays the reset password form', () => {
      renderResetPasswordPage();

      expect(screen.getByRole('heading', { name: /reset your password/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter new password/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/confirm new password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
    });

    it('displays navigation links', () => {
      renderResetPasswordPage();

      expect(screen.getByRole('link', { name: /back to login/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /back to home/i })).toBeInTheDocument();
    });

    it('displays NOTESAAS logo', () => {
      renderResetPasswordPage();

      expect(screen.getByText(/notesaas/i)).toBeInTheDocument();
    });
  });

  describe('form submission - success flow', () => {
    it('submits form with valid passwords', async () => {
      const user = userEvent.setup({ delay: null });
      (authApi.resetPassword as jest.Mock).mockResolvedValue({
        success: true,
      });

      renderResetPasswordPage('test-token');

      await user.type(screen.getByPlaceholderText(/enter new password/i), 'NewPassword123!');
      await user.type(screen.getByPlaceholderText(/confirm new password/i), 'NewPassword123!');
      await user.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(authApi.resetPassword).toHaveBeenCalledWith('test-token', 'NewPassword123!');
      });
    });

    it('shows success message after password reset', async () => {
      const user = userEvent.setup({ delay: null });
      (authApi.resetPassword as jest.Mock).mockResolvedValue({
        success: true,
      });

      renderResetPasswordPage();

      await user.type(screen.getByPlaceholderText(/enter new password/i), 'NewPassword123!');
      await user.type(screen.getByPlaceholderText(/confirm new password/i), 'NewPassword123!');
      await user.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /password reset successful/i })).toBeInTheDocument();
        expect(screen.getByText(/your password has been reset successfully/i)).toBeInTheDocument();
      });
    });

    it('redirects to login page after successful reset', async () => {
      const user = userEvent.setup({ delay: null });
      (authApi.resetPassword as jest.Mock).mockResolvedValue({
        success: true,
      });

      renderResetPasswordPage();

      await user.type(screen.getByPlaceholderText(/enter new password/i), 'NewPassword123!');
      await user.type(screen.getByPlaceholderText(/confirm new password/i), 'NewPassword123!');
      await user.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /password reset successful/i })).toBeInTheDocument();
      });

      // Fast-forward timer for auto-redirect
      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login', {
          state: { message: 'Password reset successfully! Please sign in with your new password.' },
        });
      });
    });

    it('shows loading state while submitting', async () => {
      const user = userEvent.setup({ delay: null });
      (authApi.resetPassword as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      );

      renderResetPasswordPage();

      await user.type(screen.getByPlaceholderText(/enter new password/i), 'NewPassword123!');
      await user.type(screen.getByPlaceholderText(/confirm new password/i), 'NewPassword123!');

      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const submitBtn = buttons.find(btn => btn.getAttribute('type') === 'submit');
        expect(submitBtn).toBeDisabled();
      });
    });
  });

  describe('form submission - validation errors', () => {
    it('shows error when passwords do not match', async () => {
      const user = userEvent.setup({ delay: null });
      renderResetPasswordPage();

      await user.type(screen.getByPlaceholderText(/enter new password/i), 'Password123!');
      await user.type(screen.getByPlaceholderText(/confirm new password/i), 'DifferentPassword');
      await user.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });

      expect(authApi.resetPassword).not.toHaveBeenCalled();
    });

    it('shows error when password is too short', async () => {
      const user = userEvent.setup({ delay: null });
      renderResetPasswordPage();

      await user.type(screen.getByPlaceholderText(/enter new password/i), 'short');
      await user.type(screen.getByPlaceholderText(/confirm new password/i), 'short');
      await user.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });

      expect(authApi.resetPassword).not.toHaveBeenCalled();
    });

    it('displays error message when reset fails', async () => {
      const user = userEvent.setup({ delay: null });
      const { ApiError } = jest.requireMock('../../utils/api');
      (authApi.resetPassword as jest.Mock).mockRejectedValue(
        new ApiError('Invalid or expired reset token')
      );

      renderResetPasswordPage();

      await user.type(screen.getByPlaceholderText(/enter new password/i), 'NewPassword123!');
      await user.type(screen.getByPlaceholderText(/confirm new password/i), 'NewPassword123!');
      await user.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid or expired reset token/i)).toBeInTheDocument();
      });
    });

    it('displays generic error message for unknown errors', async () => {
      const user = userEvent.setup({ delay: null });
      (authApi.resetPassword as jest.Mock).mockRejectedValue(new Error('Network error'));

      renderResetPasswordPage();

      await user.type(screen.getByPlaceholderText(/enter new password/i), 'NewPassword123!');
      await user.type(screen.getByPlaceholderText(/confirm new password/i), 'NewPassword123!');
      await user.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });
    });

    it('clears error when user starts typing', async () => {
      const user = userEvent.setup({ delay: null });
      const { ApiError } = jest.requireMock('../../utils/api');
      (authApi.resetPassword as jest.Mock).mockRejectedValue(
        new ApiError('Invalid token')
      );

      renderResetPasswordPage();

      await user.type(screen.getByPlaceholderText(/enter new password/i), 'NewPassword123!');
      await user.type(screen.getByPlaceholderText(/confirm new password/i), 'NewPassword123!');
      await user.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid token/i)).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText(/enter new password/i), 'a');

      expect(screen.queryByText(/invalid token/i)).not.toBeInTheDocument();
    });

    it('requires both password fields', () => {
      renderResetPasswordPage();

      expect(screen.getByPlaceholderText(/enter new password/i)).toBeRequired();
      expect(screen.getByPlaceholderText(/confirm new password/i)).toBeRequired();
    });
  });

  describe('password strength indicator', () => {
    it('shows password strength indicator when typing', async () => {
      const user = userEvent.setup({ delay: null });
      renderResetPasswordPage();

      const passwordInput = screen.getByPlaceholderText(/enter new password/i);
      await user.type(passwordInput, 'weak');

      expect(screen.getByText(/password strength:/i)).toBeInTheDocument();
      expect(screen.getByText(/must be at least 8 characters/i)).toBeInTheDocument();
    });

    it('shows weak strength for simple passwords', async () => {
      const user = userEvent.setup({ delay: null });
      renderResetPasswordPage();

      await user.type(screen.getByPlaceholderText(/enter new password/i), 'password');

      expect(screen.getByText(/weak/i)).toBeInTheDocument();
    });

    it('shows strong strength for complex passwords', async () => {
      const user = userEvent.setup({ delay: null });
      renderResetPasswordPage();

      await user.type(screen.getByPlaceholderText(/enter new password/i), 'StrongPass123!@#');

      expect(screen.getByText(/strong/i)).toBeInTheDocument();
    });

    it('updates strength as user types', async () => {
      const user = userEvent.setup({ delay: null });
      renderResetPasswordPage();

      const passwordInput = screen.getByPlaceholderText(/enter new password/i);

      await user.type(passwordInput, 'weak');
      expect(screen.getByText(/weak/i)).toBeInTheDocument();

      await user.clear(passwordInput);
      await user.type(passwordInput, 'StrongPass123!');
      expect(screen.getByText(/strong/i)).toBeInTheDocument();
    });
  });

  describe('navigation links', () => {
    it('has link to login page', () => {
      renderResetPasswordPage();

      const loginLink = screen.getByRole('link', { name: /back to login/i });
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('has link to home page', () => {
      renderResetPasswordPage();

      const homeLink = screen.getByRole('link', { name: /back to home/i });
      expect(homeLink).toBeInTheDocument();
    });

    it('has clickable logo linking to home', () => {
      renderResetPasswordPage();

      const logoLink = screen.getByRole('link', { name: /notesaas/i });
      expect(logoLink).toHaveAttribute('href', '/');
    });
  });

  describe('user interactions', () => {
    it('updates password fields when user types', async () => {
      const user = userEvent.setup({ delay: null });
      renderResetPasswordPage();

      const newPasswordInput = screen.getByPlaceholderText(/enter new password/i) as HTMLInputElement;
      const confirmPasswordInput = screen.getByPlaceholderText(/confirm new password/i) as HTMLInputElement;

      await user.type(newPasswordInput, 'MyPassword123!');
      await user.type(confirmPasswordInput, 'MyPassword123!');

      expect(newPasswordInput.value).toBe('MyPassword123!');
      expect(confirmPasswordInput.value).toBe('MyPassword123!');
    });
  });

  describe('success page', () => {
    it('displays go to login button on success page', async () => {
      const user = userEvent.setup({ delay: null });
      (authApi.resetPassword as jest.Mock).mockResolvedValue({
        success: true,
      });

      renderResetPasswordPage();

      await user.type(screen.getByPlaceholderText(/enter new password/i), 'NewPassword123!');
      await user.type(screen.getByPlaceholderText(/confirm new password/i), 'NewPassword123!');
      await user.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        const loginButton = screen.getByRole('link', { name: /go to login/i });
        expect(loginButton).toBeInTheDocument();
        expect(loginButton).toHaveAttribute('href', '/login');
      });
    });

    it('displays success icon on success page', async () => {
      const user = userEvent.setup({ delay: null });
      (authApi.resetPassword as jest.Mock).mockResolvedValue({
        success: true,
      });

      renderResetPasswordPage();

      await user.type(screen.getByPlaceholderText(/enter new password/i), 'NewPassword123!');
      await user.type(screen.getByPlaceholderText(/confirm new password/i), 'NewPassword123!');
      await user.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /password reset successful/i })).toBeInTheDocument();
      });
    });
  });
});
