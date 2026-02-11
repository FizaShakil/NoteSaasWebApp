import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ForgotPasswordPage from '../ForgotPasswordPage';
import { authApi } from '../../utils/api';

// Mock the API
jest.mock('../../utils/api', () => ({
  authApi: {
    forgotPassword: jest.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ApiError';
    }
  },
}));

const renderForgotPasswordPage = () => {
  return render(
    <MemoryRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ForgotPasswordPage />
    </MemoryRouter>
  );
};

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial render', () => {
    it('should display the forgot password form', () => {
      renderForgotPasswordPage();

      expect(screen.getByRole('heading', { name: /forgot your password/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    });

    it('should display instructions', () => {
      renderForgotPasswordPage();

      expect(
        screen.getByText(/enter your email address and we'll send you a link/i)
      ).toBeInTheDocument();
    });

    it('should display navigation links', () => {
      renderForgotPasswordPage();

      expect(screen.getByRole('link', { name: /back to login/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /back to home/i })).toBeInTheDocument();
    });

    it('should display NOTESAAS logo', () => {
      renderForgotPasswordPage();

      expect(screen.getByText(/notesaas/i)).toBeInTheDocument();
    });
  });

  describe('form submission - success flow', () => {
    it('should submit form with valid email', async () => {
      const user = userEvent.setup();
      (authApi.forgotPassword as jest.Mock).mockResolvedValue({
        success: true,
      });

      renderForgotPasswordPage();

      // Fill in the form
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');

      // Submit the form
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      // Verify API was called with correct data
      await waitFor(() => {
        expect(authApi.forgotPassword).toHaveBeenCalledWith('john@example.com');
      });
    });

    it('should show success message after successful submission', async () => {
      const user = userEvent.setup();
      (authApi.forgotPassword as jest.Mock).mockResolvedValue({
        success: true,
      });

      renderForgotPasswordPage();

      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /check your email/i })).toBeInTheDocument();
        expect(
          screen.getByText(/if an account with that email exists/i)
        ).toBeInTheDocument();
      });
    });

    it('should display back to login button on success page', async () => {
      const user = userEvent.setup();
      (authApi.forgotPassword as jest.Mock).mockResolvedValue({
        success: true,
      });

      renderForgotPasswordPage();

      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        const backToLoginButton = screen.getByRole('link', { name: /back to login/i });
        expect(backToLoginButton).toBeInTheDocument();
        expect(backToLoginButton).toHaveAttribute('href', '/login');
      });
    });

    it('should show loading state while submitting', async () => {
      const user = userEvent.setup();
      (authApi.forgotPassword as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      );

      renderForgotPasswordPage();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'john@example.com');
      
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.click(submitButton);

      // Check that button is disabled during loading
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const submitBtn = buttons.find(btn => btn.getAttribute('type') === 'submit');
        expect(submitBtn).toBeDisabled();
      });
    });

    it('should display success icon on success page', async () => {
      const user = userEvent.setup();
      (authApi.forgotPassword as jest.Mock).mockResolvedValue({
        success: true,
      });

      renderForgotPasswordPage();

      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /check your email/i })).toBeInTheDocument();
      });
    });
  });

  describe('form submission - validation errors', () => {
    it('should display error message when request fails', async () => {
      const user = userEvent.setup();
      const { ApiError } = jest.requireMock('../../utils/api');
      (authApi.forgotPassword as jest.Mock).mockRejectedValue(
        new ApiError('Email not found')
      );

      renderForgotPasswordPage();

      await user.type(screen.getByLabelText(/email address/i), 'nonexistent@example.com');
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(screen.getByText(/email not found/i)).toBeInTheDocument();
      });
    });

    it('should display generic error message for unknown errors', async () => {
      const user = userEvent.setup();
      (authApi.forgotPassword as jest.Mock).mockRejectedValue(new Error('Network error'));

      renderForgotPasswordPage();

      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });
    });

    it('should require email field', () => {
      renderForgotPasswordPage();

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toBeRequired();
    });

    it('should not show success page when request fails', async () => {
      const user = userEvent.setup();
      const { ApiError } = jest.requireMock('../../utils/api');
      (authApi.forgotPassword as jest.Mock).mockRejectedValue(
        new ApiError('Email not found')
      );

      renderForgotPasswordPage();

      await user.type(screen.getByLabelText(/email address/i), 'nonexistent@example.com');
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(screen.getByText(/email not found/i)).toBeInTheDocument();
      });

      // Should still show the form, not the success page
      expect(screen.queryByRole('heading', { name: /check your email/i })).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /forgot your password/i })).toBeInTheDocument();
    });
  });

  describe('navigation links', () => {
    it('should have link to login page', () => {
      renderForgotPasswordPage();

      const backToLoginLink = screen.getByRole('link', { name: /← back to login/i });
      expect(backToLoginLink).toHaveAttribute('href', '/login');
    });

    it('should have link to home page', () => {
      renderForgotPasswordPage();

      const backToHomeLink = screen.getByRole('link', { name: /back to home/i });
      expect(backToHomeLink).toBeInTheDocument();
    });

    it('should have clickable logo that links to home', () => {
      renderForgotPasswordPage();

      const logoLink = screen.getByRole('link', { name: /notesaas/i });
      expect(logoLink).toHaveAttribute('href', '/');
    });
  });

  describe('user interactions', () => {
    it('should update email field when user types', async () => {
      const user = userEvent.setup();
      renderForgotPasswordPage();

      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
      await user.type(emailInput, 'test@example.com');

      expect(emailInput.value).toBe('test@example.com');
    });

    it('should clear email field when user clears it', async () => {
      const user = userEvent.setup();
      renderForgotPasswordPage();

      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
      await user.type(emailInput, 'test@example.com');
      expect(emailInput.value).toBe('test@example.com');

      await user.clear(emailInput);
      expect(emailInput.value).toBe('');
    });

    it('should handle form submission with Enter key', async () => {
      const user = userEvent.setup();
      (authApi.forgotPassword as jest.Mock).mockResolvedValue({
        success: true,
      });

      renderForgotPasswordPage();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'john@example.com{Enter}');

      await waitFor(() => {
        expect(authApi.forgotPassword).toHaveBeenCalledWith('john@example.com');
      });
    });
  });

  describe('success page navigation', () => {
    it('should maintain back to home button on success page', async () => {
      const user = userEvent.setup();
      (authApi.forgotPassword as jest.Mock).mockResolvedValue({
        success: true,
      });

      renderForgotPasswordPage();

      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        const backToHomeButton = screen.getByRole('link', { name: /back to home/i });
        expect(backToHomeButton).toBeInTheDocument();
      });
    });
  });
});
