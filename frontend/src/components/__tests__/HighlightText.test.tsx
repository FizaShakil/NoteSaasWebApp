import { render, screen } from '@testing-library/react';
import HighlightText from '../HighlightText';

describe('HighlightText', () => {
  describe('rendering', () => {
    it('should render text without highlighting when search query is empty', () => {
      // Arrange & Act
      render(<HighlightText text="Hello World" searchQuery="" />);

      // Assert
      expect(screen.getByText('Hello World')).toBeInTheDocument();
      expect(screen.queryByRole('mark')).not.toBeInTheDocument();
    });

    it('should render text without highlighting when search query is whitespace', () => {
      // Arrange & Act
      render(<HighlightText text="Hello World" searchQuery="   " />);

      // Assert
      expect(screen.getByText('Hello World')).toBeInTheDocument();
      expect(screen.queryByRole('mark')).not.toBeInTheDocument();
    });

    it('should render plain text when no match is found', () => {
      // Arrange & Act
      render(<HighlightText text="Hello World" searchQuery="xyz" />);

      // Assert
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });
  });

  describe('highlighting', () => {
    it('should highlight matching text', () => {
      // Arrange & Act
      const { container } = render(<HighlightText text="Hello World" searchQuery="Hello" />);

      // Assert
      const mark = container.querySelector('mark');
      expect(mark).toBeInTheDocument();
      expect(mark).toHaveTextContent('Hello');
    });

    it('should highlight text case-insensitively', () => {
      // Arrange & Act
      const { container } = render(<HighlightText text="Hello World" searchQuery="hello" />);

      // Assert
      const mark = container.querySelector('mark');
      expect(mark).toBeInTheDocument();
      expect(mark).toHaveTextContent('Hello');
    });

    it('should highlight multiple occurrences', () => {
      // Arrange & Act
      const { container } = render(
        <HighlightText text="test test test" searchQuery="test" />
      );

      // Assert
      const marks = container.querySelectorAll('mark');
      expect(marks).toHaveLength(3);
      marks.forEach(mark => {
        expect(mark).toHaveTextContent('test');
      });
    });

    it('should highlight partial word matches', () => {
      // Arrange & Act
      const { container } = render(<HighlightText text="JavaScript" searchQuery="Script" />);

      // Assert
      const mark = container.querySelector('mark');
      expect(mark).toBeInTheDocument();
      expect(mark).toHaveTextContent('Script');
    });

    it('should handle special regex characters in search query', () => {
      // Arrange & Act
      const { container } = render(<HighlightText text="Price: $100" searchQuery="$100" />);

      // Assert
      const mark = container.querySelector('mark');
      expect(mark).toBeInTheDocument();
      expect(mark).toHaveTextContent('$100');
    });
  });

  describe('props handling', () => {
    it('should apply custom className', () => {
      // Arrange & Act
      const { container } = render(
        <HighlightText text="Hello" searchQuery="" className="custom-class" />
      );

      // Assert
      const span = container.querySelector('.custom-class');
      expect(span).toBeInTheDocument();
    });

    it('should work with empty text', () => {
      // Arrange & Act
      render(<HighlightText text="" searchQuery="test" />);

      // Assert
      expect(screen.queryByRole('mark')).not.toBeInTheDocument();
    });

    it('should work with long text', () => {
      // Arrange
      const longText = 'Lorem ipsum dolor sit amet '.repeat(10);

      // Act
      const { container } = render(<HighlightText text={longText} searchQuery="ipsum" />);

      // Assert
      const marks = container.querySelectorAll('mark');
      expect(marks.length).toBeGreaterThan(0);
    });
  });
});
