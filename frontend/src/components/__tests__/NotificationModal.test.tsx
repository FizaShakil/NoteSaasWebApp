import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationModal from '../NotificationModal';

describe('NotificationModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  describe('visibility', () => {
    it('does not render when closed', () => {
      const { container } = render(
        <NotificationModal isOpen={false} type="success" message="Test" onClose={mockOnClose} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders when open', () => {
      render(
        <NotificationModal isOpen={true} type="success" message="Test message" onClose={mockOnClose} />
      );

      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });

  describe('success notifications', () => {
    it('displays success icon and title', () => {
      render(
        <NotificationModal isOpen={true} type="success" message="Success message" onClose={mockOnClose} />
      );

      expect(screen.getByText('Success!')).toBeInTheDocument();
      expect(screen.getByText('Success message')).toBeInTheDocument();
    });

    it('displays green checkmark icon', () => {
      const { container } = render(
        <NotificationModal isOpen={true} type="success" message="Success" onClose={mockOnClose} />
      );

      expect(container.querySelector('.bg-green-100')).toBeInTheDocument();
    });
  });

  describe('error notifications', () => {
    it('displays error icon and title', () => {
      render(
        <NotificationModal isOpen={true} type="error" message="Error message" onClose={mockOnClose} />
      );

      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    it('displays red X icon', () => {
      const { container } = render(
        <NotificationModal isOpen={true} type="error" message="Error" onClose={mockOnClose} />
      );

      expect(container.querySelector('.bg-red-100')).toBeInTheDocument();
    });
  });

  describe('user interactions', () => {
    it('calls onClose when OK button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <NotificationModal isOpen={true} type="success" message="Test" onClose={mockOnClose} />
      );

      await user.click(screen.getByRole('button', { name: /ok/i }));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('displays OK button', () => {
      render(
        <NotificationModal isOpen={true} type="success" message="Test" onClose={mockOnClose} />
      );

      const okButton = screen.getByRole('button', { name: /ok/i });
      expect(okButton).toBeInTheDocument();
      expect(okButton).toBeVisible();
    });
  });

  describe('message display', () => {
    it('displays custom success message', () => {
      render(
        <NotificationModal isOpen={true} type="success" message="Operation completed successfully!" onClose={mockOnClose} />
      );

      expect(screen.getByText('Operation completed successfully!')).toBeInTheDocument();
    });

    it('displays custom error message', () => {
      render(
        <NotificationModal isOpen={true} type="error" message="Something went wrong!" onClose={mockOnClose} />
      );

      expect(screen.getByText('Something went wrong!')).toBeInTheDocument();
    });

    it('displays long messages', () => {
      const longMessage = 'This is a very long error message that should still be displayed correctly in the modal without any issues.';

      render(
        <NotificationModal isOpen={true} type="error" message={longMessage} onClose={mockOnClose} />
      );

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('displays empty message', () => {
      render(
        <NotificationModal isOpen={true} type="success" message="" onClose={mockOnClose} />
      );

      expect(screen.getByText('Success!')).toBeInTheDocument();
    });
  });
});
