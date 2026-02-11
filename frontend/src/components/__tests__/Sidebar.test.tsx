import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Sidebar from '../Sidebar';
import { authApi, tokenUtils } from '../../utils/api';
import { mockUser } from '../../test-utils/common-mocks';

// Mock API
jest.mock('../../utils/api', () => ({
  authApi: {
    getUserDetails: jest.fn(),
    logout: jest.fn(),
  },
  tokenUtils: {
    clearTokens: jest.fn(),
  },
}));

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/dashboard' }),
}));

const renderSidebar = () => {
  return render(
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Sidebar />
    </BrowserRouter>
  );
};

describe('Sidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authApi.getUserDetails as jest.Mock).mockResolvedValue({
      data: mockUser,
    });
  });

  describe('branding', () => {
    it('renders logo and app name', () => {
      renderSidebar();

      expect(screen.getByText('NoteApp')).toBeInTheDocument();
      expect(screen.getByText('Enterprise Edition')).toBeInTheDocument();
    });
  });

  describe('navigation menu', () => {
    it('renders all menu items', () => {
      renderSidebar();

      expect(screen.getByText('Dashboard / Notes')).toBeInTheDocument();
      expect(screen.getByText('Create New Note')).toBeInTheDocument();
      expect(screen.getByText('User Profile')).toBeInTheDocument();
    });

    it('renders dashboard link with correct path', () => {
      renderSidebar();

      const dashboardLink = screen.getByText('Dashboard / Notes').closest('a');
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    });

    it('renders create note link with correct path', () => {
      renderSidebar();

      const createNoteLink = screen.getByText('Create New Note').closest('a');
      expect(createNoteLink).toHaveAttribute('href', '/dashboard/create-note');
    });

    it('renders user profile link with correct path', () => {
      renderSidebar();

      const profileLink = screen.getByText('User Profile').closest('a');
      expect(profileLink).toHaveAttribute('href', '/dashboard/profile');
    });

    it('highlights active menu item based on current path', () => {
      renderSidebar();

      const dashboardLink = screen.getByText('Dashboard / Notes').closest('a');
      expect(dashboardLink).toHaveClass('bg-blue-600');
    });
  });

  describe('user details', () => {
    it('fetches and displays user details on mount', async () => {
      renderSidebar();

      await waitFor(() => {
        expect(authApi.getUserDetails).toHaveBeenCalledTimes(1);
      });

      expect(screen.getByText(mockUser.name)).toBeInTheDocument();
      expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    });

    it('displays default user info when API call fails', async () => {
      (authApi.getUserDetails as jest.Mock).mockRejectedValue(new Error('Failed to fetch'));

      renderSidebar();

      await waitFor(() => {
        expect(screen.getByText('User')).toBeInTheDocument();
        expect(screen.getByText('user@example.com')).toBeInTheDocument();
      });
    });

    it('displays default user info when no data is returned', async () => {
      (authApi.getUserDetails as jest.Mock).mockResolvedValue({});

      renderSidebar();

      await waitFor(() => {
        expect(screen.getByText('User')).toBeInTheDocument();
        expect(screen.getByText('user@example.com')).toBeInTheDocument();
      });
    });

    it('displays user avatar icon', () => {
      renderSidebar();

      expect(document.querySelector('.w-6.h-6.bg-slate-600')).toBeInTheDocument();
    });

    it('truncates long user names', async () => {
      (authApi.getUserDetails as jest.Mock).mockResolvedValue({
        data: {
          name: 'Very Long User Name That Should Be Truncated',
          email: 'user@example.com',
        },
      });

      renderSidebar();

      await waitFor(() => {
        const nameElement = screen.getByText('Very Long User Name That Should Be Truncated');
        expect(nameElement).toHaveClass('truncate');
      });
    });

    it('truncates long email addresses', async () => {
      (authApi.getUserDetails as jest.Mock).mockResolvedValue({
        data: {
          name: 'John Doe',
          email: 'verylongemailaddress@example.com',
        },
      });

      renderSidebar();

      await waitFor(() => {
        const emailElement = screen.getByText('verylongemailaddress@example.com');
        expect(emailElement).toHaveClass('truncate');
      });
    });
  });

  describe('logout', () => {
    it('renders logout button', () => {
      renderSidebar();

      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    });

    it('calls logout API when logout button is clicked', async () => {
      const user = userEvent.setup();
      (authApi.logout as jest.Mock).mockResolvedValue({});

      renderSidebar();

      await user.click(screen.getByRole('button', { name: /logout/i }));

      await waitFor(() => {
        expect(authApi.logout).toHaveBeenCalledTimes(1);
      });
    });

    it('clears tokens after logout', async () => {
      const user = userEvent.setup();
      (authApi.logout as jest.Mock).mockResolvedValue({});

      renderSidebar();

      await user.click(screen.getByRole('button', { name: /logout/i }));

      await waitFor(() => {
        expect(tokenUtils.clearTokens).toHaveBeenCalledTimes(1);
      });
    });

    it('navigates to home page after logout', async () => {
      const user = userEvent.setup();
      (authApi.logout as jest.Mock).mockResolvedValue({});

      renderSidebar();

      await user.click(screen.getByRole('button', { name: /logout/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('clears tokens and navigates even if logout API fails', async () => {
      const user = userEvent.setup();
      (authApi.logout as jest.Mock).mockRejectedValue(new Error('Logout failed'));

      renderSidebar();

      await user.click(screen.getByRole('button', { name: /logout/i }));

      await waitFor(() => {
        expect(tokenUtils.clearTokens).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });
  });
});
