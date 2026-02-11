import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';
import { authApi } from '../../utils/api';

// Mock the API
jest.mock('../../utils/api', () => ({
  authApi: {
    login: jest.fn(),
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
  useLocation: () => ({ state: null }),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

const renderLoginPage = () => {
  return render(
    <MemoryRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <LoginPage />
    </MemoryRouter>
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  describe('initial render', () => {
    it('should display the login form', () => {
      renderLoginPage();

      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should display navigation links', () => {
      renderLoginPage();

      const signupLinks = screen.getAllByRole('link', { name: /sign up/i });
      expect(signupLinks.length).toBeGreaterThan(0);
      expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument();
    });

    it('should display Google login button', () => {
      renderLoginPage();

      expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
    });

    it('should display remember me checkbox', () => {
      renderLoginPage();

      expect(screen.getByRole('checkbox', { name: /remember me/i })).toBeInTheDocument();
    });
  });

  describe('form submission - success flow', () => {
    it('should submit form with valid credentials', async () => {
      const user = userEvent.setup();
      (authApi.login as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          user: { id: '1', name: 'John Doe', email: 'john@example.com' },
        },
      });

      renderLoginPage();

      // Fill in the form
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');

      // Submit the form
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Verify API was called with correct data
      await waitFor(() => {
        expect(authApi.login).toHaveBeenCalledWith({
          email: 'john@example.com',
          password: 'password123',
        });
      });
    });

    it('should store user data in localStorage on successful login', async () => {
      const user = userEvent.setup();
      const mockUserData = { id: '1', name: 'John Doe', email: 'john@example.com' };
      (authApi.login as jest.Mock).mockResolvedValue({
        success: true,
        data: { user: mockUserData },
      });

      renderLoginPage();

      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(localStorageMock.getItem('user')).toBe(JSON.stringify(mockUserData));
      });
    });

    it('should navigate to dashboard on successful login', async () => {
      const user = userEvent.setup();
      (authApi.login as jest.Mock).mockResolvedValue({
        success: true,
        data: { user: { id: '1', name: 'John Doe', email: 'john@example.com' } },
      });

      renderLoginPage();

      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should show loading state while submitting', async () => {
      const user = userEvent.setup();
      (authApi.login as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true, data: {} }), 100))
      );

      renderLoginPage();

      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Check that button is disabled during loading
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const submitBtn = buttons.find(btn => btn.getAttribute('type') === 'submit');
        expect(submitBtn).toBeDisabled();
      });
    }, 10000); // Increased timeout for slow userEvent.type()
  });

  describe('form submission - validation errors', () => {
    it('should display error message when login fails', async () => {
      const user = userEvent.setup();
      const { ApiError } = jest.requireMock('../../utils/api');
      (authApi.login as jest.Mock).mockRejectedValue(
        new ApiError('Invalid email or password')
      );

      renderLoginPage();

      await user.type(screen.getByLabelText(/email address/i), 'wrong@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      });
    });

    it('should display generic error message for unknown errors', async () => {
      const user = userEvent.setup();
      (authApi.login as jest.Mock).mockRejectedValue(new Error('Network error'));

      renderLoginPage();

      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });
    });

    it('should clear error message when user starts typing', async () => {
      const user = userEvent.setup();
      const { ApiError } = jest.requireMock('../../utils/api');
      (authApi.login as jest.Mock).mockRejectedValue(
        new ApiError('Invalid credentials')
      );

      renderLoginPage();

      await user.type(screen.getByLabelText(/email address/i), 'wrong@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });

      // Start typing again
      await user.type(screen.getByLabelText(/email address/i), 'a');

      expect(screen.queryByText(/invalid credentials/i)).not.toBeInTheDocument();
    });

    it('should require email field', () => {
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toBeRequired();
    });

    it('should require password field', () => {
      renderLoginPage();

      const passwordInput = screen.getByLabelText(/^password$/i);
      expect(passwordInput).toBeRequired();
    });
  });

  describe('navigation links', () => {
    it('should have link to signup page', () => {
      renderLoginPage();

      const signupLinks = screen.getAllByRole('link', { name: /sign up/i });
      expect(signupLinks.length).toBeGreaterThan(0);
      expect(signupLinks[0]).toHaveAttribute('href', '/signup');
    });

    it('should have link to forgot password page', () => {
      renderLoginPage();

      const forgotPasswordLink = screen.getByRole('link', { name: /forgot password/i });
      expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password');
    });

    it('should have back to home button', () => {
      renderLoginPage();

      const backButton = screen.getByRole('link', { name: /back to home/i });
      expect(backButton).toBeInTheDocument();
    });
  });

  describe('user interactions', () => {
    it('should update email field when user types', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
      await user.type(emailInput, 'test@example.com');

      expect(emailInput.value).toBe('test@example.com');
    });

    it('should update password field when user types', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement;
      await user.type(passwordInput, 'mypassword');

      expect(passwordInput.value).toBe('mypassword');
    });

    it('should toggle remember me checkbox', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      const checkbox = screen.getByRole('checkbox', { name: /remember me/i }) as HTMLInputElement;
      expect(checkbox.checked).toBe(false);

      await user.click(checkbox);
      expect(checkbox.checked).toBe(true);

      await user.click(checkbox);
      expect(checkbox.checked).toBe(false);
    });

    it('should handle Google login button click', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      renderLoginPage();

      const googleButton = screen.getByRole('button', { name: /google/i });
      await user.click(googleButton);

      expect(consoleSpy).toHaveBeenCalledWith('Google login clicked');
      consoleSpy.mockRestore();
    });
  });
});
