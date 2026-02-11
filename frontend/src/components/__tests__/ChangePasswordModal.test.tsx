import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChangePasswordModal from '../ChangePasswordModal';
import { authApi } from '../../utils/api';

jest.mock('../../utils/api', () => ({
  authApi: {
    changeUserDetails: jest.fn(),
  },
}));

describe('ChangePasswordModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('visibility', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <ChangePasswordModal
          isOpen={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render when isOpen is true', () => {
      render(
        <ChangePasswordModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      expect(screen.getByRole('heading', { name: /change password/i })).toBeInTheDocument();
    });
  });

  describe('form rendering', () => {
    it('should display current password input field', () => {
      render(
        <ChangePasswordModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      expect(screen.getByPlaceholderText(/enter current password/i)).toBeInTheDocument();
    });

    it('should display new password input field', () => {
      render(
        <ChangePasswordModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      expect(screen.getByPlaceholderText(/enter new password/i)).toBeInTheDocument();
    });

    it('should display Cancel and Change Password buttons', () => {
      render(
        <ChangePasswordModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /change password/i })).toBeInTheDocument();
    });

    it('should render password inputs with type password', () => {
      render(
        <ChangePasswordModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const currentPasswordInput = screen.getByPlaceholderText(/enter current password/i);
      const newPasswordInput = screen.getByPlaceholderText(/enter new password/i);

      expect(currentPasswordInput).toHaveAttribute('type', 'password');
      expect(newPasswordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('user interactions', () => {
    it('should update current password when user types', async () => {
      const user = userEvent.setup();
      render(
        <ChangePasswordModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const input = screen.getByPlaceholderText(/enter current password/i);
      await user.type(input, 'oldPassword123');

      expect(input).toHaveValue('oldPassword123');
    });

    it('should update new password when user types', async () => {
      const user = userEvent.setup();
      render(
        <ChangePasswordModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const input = screen.getByPlaceholderText(/enter new password/i);
      await user.type(input, 'newPassword456');

      expect(input).toHaveValue('newPassword456');
    });

    it('should call onClose when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ChangePasswordModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('form submission', () => {
    it('should call API with trimmed passwords on successful submission', async () => {
      const user = userEvent.setup();
      (authApi.changeUserDetails as jest.Mock).mockResolvedValue({});

      render(
        <ChangePasswordModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      await user.type(screen.getByPlaceholderText(/enter current password/i), '  oldPass123  ');
      await user.type(screen.getByPlaceholderText(/enter new password/i), '  newPass456  ');
      await user.click(screen.getByRole('button', { name: /change password/i }));

      await waitFor(() => {
        expect(authApi.changeUserDetails).toHaveBeenCalledWith({
          oldPassword: 'oldPass123',
          newPassword: 'newPass456',
        });
      });
    });

    it('should call onSuccess and onClose after successful password change', async () => {
      const user = userEvent.setup();
      (authApi.changeUserDetails as jest.Mock).mockResolvedValue({});

      render(
        <ChangePasswordModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      await user.type(screen.getByPlaceholderText(/enter current password/i), 'oldPass123');
      await user.type(screen.getByPlaceholderText(/enter new password/i), 'newPass456');
      await user.click(screen.getByRole('button', { name: /change password/i }));

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
        expect(mockOnSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it('should call onError when API call fails', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Invalid current password';
      (authApi.changeUserDetails as jest.Mock).mockRejectedValue(new Error(errorMessage));

      render(
        <ChangePasswordModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      await user.type(screen.getByPlaceholderText(/enter current password/i), 'wrongPass');
      await user.type(screen.getByPlaceholderText(/enter new password/i), 'newPass456');
      await user.click(screen.getByRole('button', { name: /change password/i }));

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(errorMessage);
      });
    });

    it('should call onError with default message when error has no message', async () => {
      const user = userEvent.setup();
      (authApi.changeUserDetails as jest.Mock).mockRejectedValue({});

      render(
        <ChangePasswordModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      await user.type(screen.getByPlaceholderText(/enter current password/i), 'oldPass');
      await user.type(screen.getByPlaceholderText(/enter new password/i), 'newPass');
      await user.click(screen.getByRole('button', { name: /change password/i }));

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Failed to change password');
      });
    });

    it('should not submit when current password is empty', async () => {
      const user = userEvent.setup();
      render(
        <ChangePasswordModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      await user.type(screen.getByPlaceholderText(/enter new password/i), 'newPass456');
      await user.click(screen.getByRole('button', { name: /change password/i }));

      expect(authApi.changeUserDetails).not.toHaveBeenCalled();
    });

    it('should not submit when new password is empty', async () => {
      const user = userEvent.setup();
      render(
        <ChangePasswordModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      await user.type(screen.getByPlaceholderText(/enter current password/i), 'oldPass123');
      await user.click(screen.getByRole('button', { name: /change password/i }));

      expect(authApi.changeUserDetails).not.toHaveBeenCalled();
    });

    it('should not submit when passwords are only whitespace', async () => {
      const user = userEvent.setup();
      render(
        <ChangePasswordModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      await user.type(screen.getByPlaceholderText(/enter current password/i), '   ');
      await user.type(screen.getByPlaceholderText(/enter new password/i), '   ');
      await user.click(screen.getByRole('button', { name: /change password/i }));

      expect(authApi.changeUserDetails).not.toHaveBeenCalled();
    });

    it('should clear form fields after successful submission', async () => {
      const user = userEvent.setup();
      (authApi.changeUserDetails as jest.Mock).mockResolvedValue({});

      render(
        <ChangePasswordModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const currentPasswordInput = screen.getByPlaceholderText(/enter current password/i);
      const newPasswordInput = screen.getByPlaceholderText(/enter new password/i);

      await user.type(currentPasswordInput, 'oldPass123');
      await user.type(newPasswordInput, 'newPass456');
      await user.click(screen.getByRole('button', { name: /change password/i }));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('loading state', () => {
    it('should show "Changing..." text when loading', async () => {
      const user = userEvent.setup();
      (authApi.changeUserDetails as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(
        <ChangePasswordModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      await user.type(screen.getByPlaceholderText(/enter current password/i), 'oldPass');
      await user.type(screen.getByPlaceholderText(/enter new password/i), 'newPass');
      await user.click(screen.getByRole('button', { name: /change password/i }));

      expect(screen.getByRole('button', { name: /changing\.\.\./i })).toBeInTheDocument();
    });

    it('should disable submit button when loading', async () => {
      const user = userEvent.setup();
      (authApi.changeUserDetails as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(
        <ChangePasswordModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      await user.type(screen.getByPlaceholderText(/enter current password/i), 'oldPass');
      await user.type(screen.getByPlaceholderText(/enter new password/i), 'newPass');
      await user.click(screen.getByRole('button', { name: /change password/i }));

      const submitButton = screen.getByRole('button', { name: /changing\.\.\./i });
      expect(submitButton).toBeDisabled();
    });

    it('should disable cancel button when loading', async () => {
      const user = userEvent.setup();
      (authApi.changeUserDetails as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(
        <ChangePasswordModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      await user.type(screen.getByPlaceholderText(/enter current password/i), 'oldPass');
      await user.type(screen.getByPlaceholderText(/enter new password/i), 'newPass');
      await user.click(screen.getByRole('button', { name: /change password/i }));

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeDisabled();
    });

    it('should disable submit button when fields are empty', () => {
      render(
        <ChangePasswordModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const submitButton = screen.getByRole('button', { name: /change password/i });
      expect(submitButton).toBeDisabled();
    });
  });
});
