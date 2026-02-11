import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditNameModal from '../EditNameModal';

describe('EditNameModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnSave.mockClear();
  });

  describe('visibility', () => {
    it('should not render when isOpen is false', () => {
      // Arrange & Act
      const { container } = render(
        <EditNameModal
          isOpen={false}
          currentName="John Doe"
          onClose={mockOnClose}
          onSave={mockOnSave}
          loading={false}
        />
      );

      // Assert
      expect(container.firstChild).toBeNull();
    });

    it('should render when isOpen is true', () => {
      // Arrange & Act
      render(
        <EditNameModal
          isOpen={true}
          currentName="John Doe"
          onClose={mockOnClose}
          onSave={mockOnSave}
          loading={false}
        />
      );

      // Assert
      expect(screen.getByText('Edit Name')).toBeInTheDocument();
    });
  });

  describe('form rendering', () => {
    it('should display input field with current name', () => {
      // Arrange & Act
      render(
        <EditNameModal
          isOpen={true}
          currentName="John Doe"
          onClose={mockOnClose}
          onSave={mockOnSave}
          loading={false}
        />
      );

      // Assert
      const input = screen.getByPlaceholderText(/enter your full name/i);
      expect(input).toHaveValue('John Doe');
    });

    it('should display Save and Cancel buttons', () => {
      // Arrange & Act
      render(
        <EditNameModal
          isOpen={true}
          currentName="John Doe"
          onClose={mockOnClose}
          onSave={mockOnSave}
          loading={false}
        />
      );

      // Assert
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should display label for input field', () => {
      // Arrange & Act
      render(
        <EditNameModal
          isOpen={true}
          currentName="John Doe"
          onClose={mockOnClose}
          onSave={mockOnSave}
          loading={false}
        />
      );

      // Assert
      expect(screen.getByText('Full Name')).toBeInTheDocument();
    });
  });

  describe('user interactions', () => {
    it('should update input value when user types', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <EditNameModal
          isOpen={true}
          currentName="John"
          onClose={mockOnClose}
          onSave={mockOnSave}
          loading={false}
        />
      );

      // Act
      const input = screen.getByPlaceholderText(/enter your full name/i);
      await user.clear(input);
      await user.type(input, 'Jane Smith');

      // Assert
      expect(input).toHaveValue('Jane Smith');
    });

    it('should call onClose when Cancel button is clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <EditNameModal
          isOpen={true}
          currentName="John Doe"
          onClose={mockOnClose}
          onSave={mockOnSave}
          loading={false}
        />
      );

      // Act
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Assert
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onSave with trimmed name when form is submitted', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <EditNameModal
          isOpen={true}
          currentName="John"
          onClose={mockOnClose}
          onSave={mockOnSave}
          loading={false}
        />
      );

      // Act
      const input = screen.getByPlaceholderText(/enter your full name/i);
      await user.clear(input);
      await user.type(input, '  Jane Smith  ');
      
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Assert
      expect(mockOnSave).toHaveBeenCalledWith('Jane Smith');
    });

    it('should not call onSave when name is empty', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <EditNameModal
          isOpen={true}
          currentName="John"
          onClose={mockOnClose}
          onSave={mockOnSave}
          loading={false}
        />
      );

      // Act
      const input = screen.getByPlaceholderText(/enter your full name/i);
      await user.clear(input);
      
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Assert
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should not call onSave when name is only whitespace', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <EditNameModal
          isOpen={true}
          currentName="John"
          onClose={mockOnClose}
          onSave={mockOnSave}
          loading={false}
        />
      );

      // Act
      const input = screen.getByPlaceholderText(/enter your full name/i);
      await user.clear(input);
      await user.type(input, '   ');
      
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Assert
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('should show "Saving..." text when loading', () => {
      // Arrange & Act
      render(
        <EditNameModal
          isOpen={true}
          currentName="John Doe"
          onClose={mockOnClose}
          onSave={mockOnSave}
          loading={true}
        />
      );

      // Assert
      expect(screen.getByRole('button', { name: /saving\.\.\./i })).toBeInTheDocument();
    });

    it('should disable Save button when loading', () => {
      // Arrange & Act
      render(
        <EditNameModal
          isOpen={true}
          currentName="John Doe"
          onClose={mockOnClose}
          onSave={mockOnSave}
          loading={true}
        />
      );

      // Assert
      const saveButton = screen.getByRole('button', { name: /saving\.\.\./i });
      expect(saveButton).toBeDisabled();
    });

    it('should disable Cancel button when loading', () => {
      // Arrange & Act
      render(
        <EditNameModal
          isOpen={true}
          currentName="John Doe"
          onClose={mockOnClose}
          onSave={mockOnSave}
          loading={true}
        />
      );

      // Assert
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeDisabled();
    });

    it('should disable Save button when name is empty', () => {
      // Arrange & Act
      render(
        <EditNameModal
          isOpen={true}
          currentName=""
          onClose={mockOnClose}
          onSave={mockOnSave}
          loading={false}
        />
      );

      // Assert
      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toBeDisabled();
    });
  });

  describe('props handling', () => {
    it('should update input when currentName prop changes', () => {
      // Arrange
      const { rerender } = render(
        <EditNameModal
          isOpen={true}
          currentName="John Doe"
          onClose={mockOnClose}
          onSave={mockOnSave}
          loading={false}
        />
      );

      // Act
      rerender(
        <EditNameModal
          isOpen={true}
          currentName="Jane Smith"
          onClose={mockOnClose}
          onSave={mockOnSave}
          loading={false}
        />
      );

      // Assert
      const input = screen.getByPlaceholderText(/enter your full name/i);
      expect(input).toHaveValue('Jane Smith');
    });
  });
});
