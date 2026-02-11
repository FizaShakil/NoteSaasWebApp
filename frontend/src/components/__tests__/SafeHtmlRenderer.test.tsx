import { render, screen } from '@testing-library/react';
import SafeHtmlRenderer from '../SafeHtmlRenderer';

describe('SafeHtmlRenderer', () => {
  describe('HTML rendering', () => {
    it('renders plain text from HTML', () => {
      render(<SafeHtmlRenderer html="<p>Hello World</p>" />);

      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('strips HTML tags and shows only text', () => {
      render(<SafeHtmlRenderer html="<strong>Bold</strong> and <em>italic</em>" />);

      expect(screen.getByText('Bold and italic')).toBeInTheDocument();
    });

    it('handles nested HTML tags', () => {
      render(<SafeHtmlRenderer html="<div><p><span>Nested</span> content</p></div>" />);

      expect(screen.getByText('Nested content')).toBeInTheDocument();
    });

    it('handles empty HTML', () => {
      const { container } = render(<SafeHtmlRenderer html="" />);

      expect(container.firstChild).toBeEmptyDOMElement();
    });

    it('handles HTML with only whitespace', () => {
      const { container } = render(<SafeHtmlRenderer html="<p>   </p>" />);

      expect(container.textContent?.trim()).toBe('');
    });

    it('handles HTML with special characters', () => {
      render(<SafeHtmlRenderer html="<p>&lt;div&gt; &amp; &quot;quotes&quot;</p>" />);

      expect(screen.getByText(/& "quotes"/i)).toBeInTheDocument();
    });

    it('handles HTML with line breaks', () => {
      render(<SafeHtmlRenderer html="<p>Line 1<br/>Line 2</p>" />);

      expect(screen.getByText(/Line 1Line 2/)).toBeInTheDocument();
    });

    it('handles multiple paragraphs', () => {
      render(<SafeHtmlRenderer html="<p>Para 1</p><p>Para 2</p>" />);

      expect(screen.getByText('Para 1Para 2')).toBeInTheDocument();
    });
  });

  describe('text truncation', () => {
    const DEFAULT_MAX_LENGTH = 120;

    it('truncates text longer than default maxLength', () => {
      const longText = 'a'.repeat(150);

      render(<SafeHtmlRenderer html={`<p>${longText}</p>`} />);

      const displayedText = screen.getByText(/a+\.\.\./);
      expect(displayedText.textContent?.length).toBeLessThanOrEqual(DEFAULT_MAX_LENGTH + 3);
    });

    it('does not truncate text shorter than maxLength', () => {
      const shortText = 'Short text';

      render(<SafeHtmlRenderer html={`<p>${shortText}</p>`} />);

      expect(screen.getByText(shortText)).toBeInTheDocument();
      expect(screen.queryByText(/\.\.\./)).not.toBeInTheDocument();
    });

    it('respects custom maxLength prop', () => {
      const text = 'a'.repeat(50);
      const customMaxLength = 20;

      render(<SafeHtmlRenderer html={`<p>${text}</p>`} maxLength={customMaxLength} />);

      const displayedText = screen.getByText(/a+\.\.\./);
      expect(displayedText.textContent?.length).toBeLessThanOrEqual(customMaxLength + 3);
    });

    it('adds ellipsis when truncating', () => {
      const longText = 'a'.repeat(150);

      render(<SafeHtmlRenderer html={`<p>${longText}</p>`} maxLength={50} />);

      expect(screen.getByText(/\.\.\./)).toBeInTheDocument();
    });

    it('does not add ellipsis when text equals maxLength', () => {
      const text = 'a'.repeat(50);

      render(<SafeHtmlRenderer html={`<p>${text}</p>`} maxLength={50} />);

      expect(screen.queryByText(/\.\.\./)).not.toBeInTheDocument();
    });
  });

  describe('custom styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <SafeHtmlRenderer html="<p>Test</p>" className="custom-class" />
      );

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });
});
