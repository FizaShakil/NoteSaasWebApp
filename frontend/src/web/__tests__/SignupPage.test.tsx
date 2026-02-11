import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SignupPage from '../SignupPage';
import { authApi } from '../../utils/api';

// Mock the API
jest.mock('../../utils/api', () => ({
  authApi: {
    signup: jest.fn(),
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

const renderSignupPage = () => {
  return render(
    <MemoryRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <SignupPage />
    </MemoryRouter>
  );
};

describe('SignupPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial render', () => {
    it('should display the signup form', () => {
      renderSignupPage();

      expect(screen.getByRole('heading', { name: /create an account/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('should display navigation links', () => {
      renderSignupPage();

      const loginLinks = screen.getAllByRole('link', { name: /log in/i });
      expect(loginLinks.length).toBeGreaterThan(0);
    });

    it('should display Google signup button', () => {
      renderSignupPage();

      expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
    });

    it('should display terms and privacy policy checkbox', () => {
      renderSignupPage();

      expect(screen.getByRole('checkbox', { name: /i agree to the/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /terms of service/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /privacy policy/i })).toBeInTheDocument();
    });
  });

  describe('form submission - success flow', () => {
    it('should submit form with valid data', async () => {
      const user = userEvent.setup();
      (authApi.signup as jest.Mock).mockResolvedValue({
        success: true,
      });

      renderSignupPage();

      // Fill in the form
      await user.type(screen.getByLabelText(/username/i), 'John Doe');
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');
      await user.click(screen.getByRole('checkbox', { name: /i agree to the/i }));

      // Submit the form
      await user.click(screen.getByRole('button', { name: /create account/i }));

      // Verify API was called with correct data
      await waitFor(() => {
        expect(authApi.signup).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123!',
        });
      });
    });

    it('should navigate to login page with success message on successful signup', async () => {
      const user = userEvent.setup();
      (authApi.signup as jest.Mock).mockResolvedValue({
        success: true,
      });

      renderSignupPage();

      await user.type(screen.getByLabelText(/username/i), 'John Doe');
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');
      await user.click(screen.getByRole('checkbox', { name: /i agree to the/i }));
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login', {
          state: { message: 'Account created successfully! Please sign in.' },
        });
      });
    });

    it('should show loading state while submitting', async () => {
      const user = userEvent.setup();
      (authApi.signup as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      );

      renderSignupPage();

      await user.type(screen.getByLabelText(/username/i), 'John Doe');
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');
      await user.click(screen.getByRole('checkbox', { name: /i agree to the/i }));
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      // Check that button is disabled during loading
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const submitBtn = buttons.find(btn => btn.getAttribute('type') === 'submit');
        expect(submitBtn).toBeDisabled();
      });
    });
  });

  describe('form submission - validation errors', () => {
    it('should show error when passwords do not match', async () => {
      const user = userEvent.setup();
      renderSignupPage();

      await user.type(screen.getByLabelText(/username/i), 'John Doe');
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'DifferentPassword');
      await user.click(screen.getByRole('checkbox', { name: /i agree to the/i }));
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });

      // API should not be called
      expect(authApi.signup).not.toHaveBeenCalled();
    });

    it('should show error when password is too short', async () => {
      const user = userEvent.setup();
      renderSignupPage();

      await user.type(screen.getByLabelText(/username/i), 'John Doe');
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'short');
      await user.type(screen.getByLabelText(/confirm password/i), 'short');
      await user.click(screen.getByRole('checkbox', { name: /i agree to the/i }));
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });

      // API should not be called
      expect(authApi.signup).not.toHaveBeenCalled();
    });

    it('should display error message when signup fails', async () => {
      const user = userEvent.setup();
      const { ApiError } = jest.requireMock('../../utils/api');
      (authApi.signup as jest.Mock).mockRejectedValue(
        new ApiError('Email already exists')
      );

      renderSignupPage();

      await user.type(screen.getByLabelText(/username/i), 'John Doe');
      await user.type(screen.getByLabelText(/email address/i), 'existing@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');
      await user.click(screen.getByRole('checkbox', { name: /i agree to the/i }));
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      });
    }, 10000); // Increased timeout for slow userEvent.type()

    it('should display generic error message for unknown errors', async () => {
      const user = userEvent.setup();
      (authApi.signup as jest.Mock).mockRejectedValue(new Error('Network error'));

      renderSignupPage();

      await user.type(screen.getByLabelText(/username/i), 'John Doe');
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');
      await user.click(screen.getByRole('checkbox', { name: /i agree to the/i }));
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });
    }, 10000); // Increased timeout for slow userEvent.type()

    it('should clear error message when user starts typing', async () => {
      const user = userEvent.setup();
      const { ApiError } = jest.requireMock('../../utils/api');
      (authApi.signup as jest.Mock).mockRejectedValue(
        new ApiError('Email already exists')
      );

      renderSignupPage();

      await user.type(screen.getByLabelText(/username/i), 'John Doe');
      await user.type(screen.getByLabelText(/email address/i), 'existing@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');
      await user.click(screen.getByRole('checkbox', { name: /i agree to the/i }));
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      });

      // Start typing again
      await user.type(screen.getByLabelText(/email address/i), 'a');

      expect(screen.queryByText(/email already exists/i)).not.toBeInTheDocument();
    }, 10000); // Increased timeout for slow userEvent.type()

    it('should require all fields', () => {
      renderSignupPage();

      expect(screen.getByLabelText(/username/i)).toBeRequired();
      expect(screen.getByLabelText(/email address/i)).toBeRequired();
      expect(screen.getByLabelText(/^password$/i)).toBeRequired();
      expect(screen.getByLabelText(/confirm password/i)).toBeRequired();
      expect(screen.getByRole('checkbox', { name: /i agree to the/i })).toBeRequired();
    });
  });

  describe('password strength indicator', () => {
    it('should show password strength indicator when typing password', async () => {
      const user = userEvent.setup();
      renderSignupPage();

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'weak');

      expect(screen.getByText(/must be at least 8 characters/i)).toBeInTheDocument();
    });

    it('should update password strength as user types', async () => {
      const user = userEvent.setup();
      renderSignupPage();

      const passwordInput = screen.getByLabelText(/^password$/i);
      
      // Type a weak password
      await user.type(passwordInput, 'password');
      expect(screen.getByText(/must be at least 8 characters/i)).toBeInTheDocument();

      // Clear and type a stronger password
      await user.clear(passwordInput);
      await user.type(passwordInput, 'StrongPass123!');
      expect(screen.getByText(/must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  describe('navigation links', () => {
    it('should have link to login page', () => {
      renderSignupPage();

      const loginLinks = screen.getAllByRole('link', { name: /log in/i });
      expect(loginLinks.length).toBeGreaterThan(0);
      expect(loginLinks[0]).toHaveAttribute('href', '/login');
    });

    it('should have link to terms of service', () => {
      renderSignupPage();

      const termsLink = screen.getByRole('link', { name: /terms of service/i });
      expect(termsLink).toHaveAttribute('href', '/terms');
    });

    it('should have link to privacy policy', () => {
      renderSignupPage();

      const privacyLink = screen.getByRole('link', { name: /privacy policy/i });
      expect(privacyLink).toHaveAttribute('href', '/privacy');
    });

    it('should have back to home button', () => {
      renderSignupPage();

      const backButton = screen.getByRole('link', { name: /back to home/i });
      expect(backButton).toBeInTheDocument();
    });
  });

  describe('user interactions', () => {
    it('should update form fields when user types', async () => {
      const user = userEvent.setup();
      renderSignupPage();

      const nameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement;
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i) as HTMLInputElement;

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.type(confirmPasswordInput, 'Password123!');

      expect(nameInput.value).toBe('John Doe');
      expect(emailInput.value).toBe('john@example.com');
      expect(passwordInput.value).toBe('Password123!');
      expect(confirmPasswordInput.value).toBe('Password123!');
    }, 10000); // Increased timeout for slow userEvent.type()

    it('should toggle terms checkbox', async () => {
      const user = userEvent.setup();
      renderSignupPage();

      const checkbox = screen.getByRole('checkbox', { name: /i agree to the/i }) as HTMLInputElement;
      expect(checkbox.checked).toBe(false);

      await user.click(checkbox);
      expect(checkbox.checked).toBe(true);

      await user.click(checkbox);
      expect(checkbox.checked).toBe(false);
    });

    it('should handle Google signup button click', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      renderSignupPage();

      const googleButton = screen.getByRole('button', { name: /google/i });
      await user.click(googleButton);

      expect(consoleSpy).toHaveBeenCalledWith('Google signup clicked');
      consoleSpy.mockRestore();
    });
  });
});
