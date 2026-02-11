import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import UserProfile from '../UserProfile';
import { authApi, notesApi, tokenUtils } from '../../utils/api';

// Mock the API
jest.mock('../../utils/api', () => ({
  authApi: {
    getUserDetails: jest.fn(),
    changeUserDetails: jest.fn(),
    logout: jest.fn(),
  },
  notesApi: {
    getTotalNotes: jest.fn(),
  },
  tokenUtils: {
    clearTokens: jest.fn(),
    isAuthenticated: jest.fn(() => true),
    getAccessToken: jest.fn(() => 'mock-token'),
  },
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderUserProfile = () => {
  return render(
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <UserProfile />
    </BrowserRouter>
  );
};

describe('UserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loading state', () => {
    it('should show loading spinner while fetching user data', () => {
      (authApi.getUserDetails as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      (notesApi.getTotalNotes as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      );

      renderUserProfile();

      // The loading spinner is a div with specific classes, not a progressbar role
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should hide loading spinner after data is loaded', async () => {
      (authApi.getUserDetails as jest.Mock).mockResolvedValue({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          createdAt: new Date().toISOString(),
        },
      });
      (notesApi.getTotalNotes as jest.Mock).mockResolvedValue({
        data: { totalNotes: 5 },
      });

      renderUserProfile();

      await waitFor(() => {
        expect(screen.queryByRole('progressbar', { hidden: true })).not.toBeInTheDocument();
      });
    });
  });

  describe('rendered data', () => {
    it('should display user name', async () => {
      (authApi.getUserDetails as jest.Mock).mockResolvedValue({
        data: {
          name: 'Jane Smith',
          email: 'jane@example.com',
          createdAt: new Date().toISOString(),
        },
      });
      (notesApi.getTotalNotes as jest.Mock).mockResolvedValue({
        data: { totalNotes: 0 },
      });

      renderUserProfile();

      await waitFor(() => {
        // Check for the name in the profile header (h2 element)
        expect(screen.getByRole('heading', { name: 'Jane Smith', level: 2 })).toBeInTheDocument();
      });
    });

    it('should display user email', async () => {
      (authApi.getUserDetails as jest.Mock).mockResolvedValue({
        data: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          createdAt: new Date().toISOString(),
        },
      });
      (notesApi.getTotalNotes as jest.Mock).mockResolvedValue({
        data: { totalNotes: 0 },
      });

      renderUserProfile();

      await waitFor(() => {
        // Email appears in multiple places, just check it exists
        const emails = screen.getAllByText('john.doe@example.com');
        expect(emails.length).toBeGreaterThan(0);
      });
    });

    it('should display total notes count', async () => {
      (authApi.getUserDetails as jest.Mock).mockResolvedValue({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          createdAt: new Date().toISOString(),
        },
      });
      (notesApi.getTotalNotes as jest.Mock).mockResolvedValue({
        data: { totalNotes: 42 },
      });

      renderUserProfile();

      await waitFor(() => {
        expect(screen.getByText('42 Notes')).toBeInTheDocument();
      });
    });

    it('should display singular "Note" when count is 1', async () => {
      (authApi.getUserDetails as jest.Mock).mockResolvedValue({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          createdAt: new Date().toISOString(),
        },
      });
      (notesApi.getTotalNotes as jest.Mock).mockResolvedValue({
        data: { totalNotes: 1 },
      });

      renderUserProfile();

      await waitFor(() => {
        expect(screen.getByText('1 Note')).toBeInTheDocument();
      });
    });

    it('should display default values when user data is missing', async () => {
      (authApi.getUserDetails as jest.Mock).mockResolvedValue({
        data: null,
      });
      (notesApi.getTotalNotes as jest.Mock).mockResolvedValue({
        data: { totalNotes: 0 },
      });

      renderUserProfile();

      await waitFor(() => {
        expect(screen.getByText('User')).toBeInTheDocument();
      });
    });
  });

  describe('user interactions - edit name', () => {
    it('should open edit name modal when clicking on name field', async () => {
      const user = userEvent.setup();
      (authApi.getUserDetails as jest.Mock).mockResolvedValue({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          createdAt: new Date().toISOString(),
        },
      });
      (notesApi.getTotalNotes as jest.Mock).mockResolvedValue({
        data: { totalNotes: 0 },
      });

      renderUserProfile();

      await waitFor(() => {
        const names = screen.getAllByText('John Doe');
        expect(names.length).toBeGreaterThan(0);
      });

      // Find the clickable name field by looking for the label
      const nameLabel = screen.getByText('Full Name');
      const nameField = nameLabel.parentElement?.querySelector('[class*="cursor-pointer"]');
      if (nameField) {
        await user.click(nameField);
      }

      await waitFor(() => {
        expect(screen.getByText('Edit Name')).toBeInTheDocument();
      });
    });

    it('should update name when saving in modal', async () => {
      const user = userEvent.setup();
      (authApi.getUserDetails as jest.Mock).mockResolvedValue({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          createdAt: new Date().toISOString(),
        },
      });
      (notesApi.getTotalNotes as jest.Mock).mockResolvedValue({
        data: { totalNotes: 0 },
      });
      (authApi.changeUserDetails as jest.Mock).mockResolvedValue({});

      renderUserProfile();

      await waitFor(() => {
        const names = screen.getAllByText('John Doe');
        expect(names.length).toBeGreaterThan(0);
      });

      const nameLabel = screen.getByText('Full Name');
      const nameField = nameLabel.parentElement?.querySelector('[class*="cursor-pointer"]');
      if (nameField) {
        await user.click(nameField);
      }

      await waitFor(() => {
        expect(screen.getByText('Edit Name')).toBeInTheDocument();
      });

      const nameInput = screen.getByPlaceholderText(/enter your full name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Jane Smith');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(authApi.changeUserDetails).toHaveBeenCalledWith({
          name: 'Jane Smith',
        });
      });
    });

    it('should show success notification after name update', async () => {
      const user = userEvent.setup();
      (authApi.getUserDetails as jest.Mock).mockResolvedValue({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          createdAt: new Date().toISOString(),
        },
      });
      (notesApi.getTotalNotes as jest.Mock).mockResolvedValue({
        data: { totalNotes: 0 },
      });
      (authApi.changeUserDetails as jest.Mock).mockResolvedValue({});

      renderUserProfile();

      await waitFor(() => {
        const names = screen.getAllByText('John Doe');
        expect(names.length).toBeGreaterThan(0);
      });

      const nameLabel = screen.getByText('Full Name');
      const nameField = nameLabel.parentElement?.querySelector('[class*="cursor-pointer"]');
      if (nameField) {
        await user.click(nameField);
      }

      await waitFor(() => {
        expect(screen.getByText('Edit Name')).toBeInTheDocument();
      });

      const nameInput = screen.getByPlaceholderText(/enter your full name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'New Name');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Name updated successfully!')).toBeInTheDocument();
      });
    });

    it('should show error notification when name update fails', async () => {
      const user = userEvent.setup();
      (authApi.getUserDetails as jest.Mock).mockResolvedValue({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          createdAt: new Date().toISOString(),
        },
      });
      (notesApi.getTotalNotes as jest.Mock).mockResolvedValue({
        data: { totalNotes: 0 },
      });
      (authApi.changeUserDetails as jest.Mock).mockRejectedValue(
        new Error('Update failed')
      );

      renderUserProfile();

      await waitFor(() => {
        const names = screen.getAllByText('John Doe');
        expect(names.length).toBeGreaterThan(0);
      });

      const nameLabel = screen.getByText('Full Name');
      const nameField = nameLabel.parentElement?.querySelector('[class*="cursor-pointer"]');
      if (nameField) {
        await user.click(nameField);
      }

      await waitFor(() => {
        expect(screen.getByText('Edit Name')).toBeInTheDocument();
      });

      const nameInput = screen.getByPlaceholderText(/enter your full name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'New Name');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Update failed')).toBeInTheDocument();
      });
    });
  });

  describe('user interactions - change password', () => {
    it('should open change password modal when clicking button', async () => {
      const user = userEvent.setup();
      (authApi.getUserDetails as jest.Mock).mockResolvedValue({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          createdAt: new Date().toISOString(),
        },
      });
      (notesApi.getTotalNotes as jest.Mock).mockResolvedValue({
        data: { totalNotes: 0 },
      });

      renderUserProfile();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /change password/i })).toBeInTheDocument();
      });

      const changePasswordButton = screen.getByRole('button', { name: /change password/i });
      await user.click(changePasswordButton);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /change password/i })).toBeInTheDocument();
      });
    });

    it('should show success notification after password change', async () => {
      const user = userEvent.setup();
      (authApi.getUserDetails as jest.Mock).mockResolvedValue({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          createdAt: new Date().toISOString(),
        },
      });
      (notesApi.getTotalNotes as jest.Mock).mockResolvedValue({
        data: { totalNotes: 0 },
      });
      (authApi.changeUserDetails as jest.Mock).mockResolvedValue({});

      renderUserProfile();

      await waitFor(() => {
        const buttons = screen.getAllByRole('button', { name: /change password/i });
        expect(buttons.length).toBeGreaterThan(0);
      });

      // Click the first "Change Password" button (the one that opens the modal)
      const changePasswordButtons = screen.getAllByRole('button', { name: /change password/i });
      await user.click(changePasswordButtons[0]);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/enter current password/i)).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText(/enter current password/i), 'oldpass123');
      await user.type(screen.getByPlaceholderText(/enter new password/i), 'newpass456');

      // Now click the submit button inside the modal (the second "Change Password" button)
      const submitButtons = screen.getAllByRole('button', { name: /^change password$/i });
      await user.click(submitButtons[submitButtons.length - 1]);

      await waitFor(() => {
        expect(screen.getByText('Password changed successfully!')).toBeInTheDocument();
      });
    });
  });

  describe('user interactions - sign out', () => {
    it('should call logout API when clicking sign out', async () => {
      const user = userEvent.setup();
      (authApi.getUserDetails as jest.Mock).mockResolvedValue({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          createdAt: new Date().toISOString(),
        },
      });
      (notesApi.getTotalNotes as jest.Mock).mockResolvedValue({
        data: { totalNotes: 0 },
      });
      (authApi.logout as jest.Mock).mockResolvedValue({});

      renderUserProfile();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
      });

      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      await user.click(signOutButton);

      await waitFor(() => {
        expect(authApi.logout).toHaveBeenCalledTimes(1);
      });
    });

    it('should clear tokens after sign out', async () => {
      const user = userEvent.setup();
      (authApi.getUserDetails as jest.Mock).mockResolvedValue({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          createdAt: new Date().toISOString(),
        },
      });
      (notesApi.getTotalNotes as jest.Mock).mockResolvedValue({
        data: { totalNotes: 0 },
      });
      (authApi.logout as jest.Mock).mockResolvedValue({});

      renderUserProfile();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
      });

      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      await user.click(signOutButton);

      await waitFor(() => {
        expect(tokenUtils.clearTokens).toHaveBeenCalledTimes(1);
      });
    });

    it('should navigate to home page after sign out', async () => {
      const user = userEvent.setup();
      (authApi.getUserDetails as jest.Mock).mockResolvedValue({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          createdAt: new Date().toISOString(),
        },
      });
      (notesApi.getTotalNotes as jest.Mock).mockResolvedValue({
        data: { totalNotes: 0 },
      });
      (authApi.logout as jest.Mock).mockResolvedValue({});

      renderUserProfile();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
      });

      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      await user.click(signOutButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('should clear tokens and navigate even if logout API fails', async () => {
      const user = userEvent.setup();
      (authApi.getUserDetails as jest.Mock).mockResolvedValue({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          createdAt: new Date().toISOString(),
        },
      });
      (notesApi.getTotalNotes as jest.Mock).mockResolvedValue({
        data: { totalNotes: 0 },
      });
      (authApi.logout as jest.Mock).mockRejectedValue(new Error('Logout failed'));

      renderUserProfile();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
      });

      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      await user.click(signOutButton);

      await waitFor(() => {
        expect(tokenUtils.clearTokens).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('account stats', () => {
    it('should display member since date', async () => {
      const createdDate = new Date('2023-01-15').toISOString();
      (authApi.getUserDetails as jest.Mock).mockResolvedValue({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          createdAt: createdDate,
        },
      });
      (notesApi.getTotalNotes as jest.Mock).mockResolvedValue({
        data: { totalNotes: 0 },
      });

      renderUserProfile();

      await waitFor(() => {
        expect(screen.getByText(/January 15, 2023/i)).toBeInTheDocument();
      });
    });
  });
});
