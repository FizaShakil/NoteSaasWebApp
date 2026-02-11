import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RichTextEditor from '../RichTextEditor';

describe('RichTextEditor', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    document.execCommand = jest.fn();
  });

  describe('rendering', () => {
    it('should render editor with default placeholder', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const editor = document.querySelector('.editor-content');
      expect(editor).toBeInTheDocument();
      expect(editor).toHaveAttribute('data-placeholder', 'Start writing your note...');
    });

    it('should render editor with custom placeholder', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} placeholder="Type here..." />);

      const editor = document.querySelector('.editor-content');
      expect(editor).toHaveAttribute('data-placeholder', 'Type here...');
    });

    it('should render editor with initial value', () => {
      render(<RichTextEditor value="<p>Initial content</p>" onChange={mockOnChange} />);

      const editor = document.querySelector('.editor-content');
      expect(editor).toHaveTextContent('Initial content');
    });

    it('should render toolbar with formatting buttons', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      expect(screen.getByTitle('Bold')).toBeInTheDocument();
      expect(screen.getByTitle('Italic')).toBeInTheDocument();
      expect(screen.getByTitle('Underline')).toBeInTheDocument();
    });

    it('should render heading buttons', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      expect(screen.getByTitle('Heading 1')).toBeInTheDocument();
      expect(screen.getByTitle('Heading 2')).toBeInTheDocument();
    });

    it('should render list buttons', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      expect(screen.getByTitle('Numbered List')).toBeInTheDocument();
      expect(screen.getByTitle('Bullet List')).toBeInTheDocument();
    });

    it('should render alignment buttons', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      expect(screen.getByTitle('Align Left')).toBeInTheDocument();
      expect(screen.getByTitle('Align Center')).toBeInTheDocument();
      expect(screen.getByTitle('Align Right')).toBeInTheDocument();
    });

    it('should render code block and link buttons', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      expect(screen.getByTitle('Code Block')).toBeInTheDocument();
      expect(screen.getByTitle('Insert Link')).toBeInTheDocument();
    });

    it('should render clear formatting button', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      expect(screen.getByTitle('Clear Formatting')).toBeInTheDocument();
    });

    it('should render import and export buttons', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      expect(screen.getByTitle('Import from .txt file')).toBeInTheDocument();
      expect(screen.getByTitle('Export as .txt file')).toBeInTheDocument();
      expect(screen.getByTitle('Export as PDF')).toBeInTheDocument();
    });
  });

  describe('text formatting', () => {
    it('should call execCommand for bold formatting', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const boldButton = screen.getByTitle('Bold');
      await user.click(boldButton);

      expect(document.execCommand).toHaveBeenCalledWith('bold', false, undefined);
    });

    it('should call execCommand for italic formatting', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const italicButton = screen.getByTitle('Italic');
      await user.click(italicButton);

      expect(document.execCommand).toHaveBeenCalledWith('italic', false, undefined);
    });

    it('should call execCommand for underline formatting', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const underlineButton = screen.getByTitle('Underline');
      await user.click(underlineButton);

      expect(document.execCommand).toHaveBeenCalledWith('underline', false, undefined);
    });

    it('should call execCommand for heading 1', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const h1Button = screen.getByTitle('Heading 1');
      await user.click(h1Button);

      expect(document.execCommand).toHaveBeenCalledWith('formatBlock', false, 'h1');
    });

    it('should call execCommand for heading 2', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const h2Button = screen.getByTitle('Heading 2');
      await user.click(h2Button);

      expect(document.execCommand).toHaveBeenCalledWith('formatBlock', false, 'h2');
    });

    it('should call execCommand for clear formatting', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const clearButton = screen.getByTitle('Clear Formatting');
      await user.click(clearButton);

      expect(document.execCommand).toHaveBeenCalledWith('removeFormat', false, undefined);
    });
  });

  describe('text alignment', () => {
    it('should set left alignment when left align button is clicked', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const leftAlignButton = screen.getByTitle('Align Left');
      await user.click(leftAlignButton);

      expect(leftAlignButton).toHaveClass('active');
    });

    it('should set center alignment when center align button is clicked', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const centerAlignButton = screen.getByTitle('Align Center');
      await user.click(centerAlignButton);

      expect(centerAlignButton).toHaveClass('active');
    });

    it('should set right alignment when right align button is clicked', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const rightAlignButton = screen.getByTitle('Align Right');
      await user.click(rightAlignButton);

      expect(rightAlignButton).toHaveClass('active');
    });

    it('should apply text alignment to editor', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const centerAlignButton = screen.getByTitle('Align Center');
      await user.click(centerAlignButton);

      const editor = document.querySelector('.editor-content') as HTMLElement;
      expect(editor.style.textAlign).toBe('center');
    });
  });

  describe('list creation', () => {
    it('should call execCommand for ordered list', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const orderedListButton = screen.getByTitle('Numbered List');
      await user.click(orderedListButton);

      expect(document.execCommand).toHaveBeenCalledWith('insertOrderedList');
    });

    it('should call execCommand for unordered list', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const unorderedListButton = screen.getByTitle('Bullet List');
      await user.click(unorderedListButton);

      expect(document.execCommand).toHaveBeenCalledWith('insertUnorderedList');
    });
  });

  describe('link insertion', () => {
    it('should prompt for URL when insert link is clicked', async () => {
      const user = userEvent.setup();
      window.prompt = jest.fn().mockReturnValue('https://example.com');

      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const linkButton = screen.getByTitle('Insert Link');
      await user.click(linkButton);

      expect(window.prompt).toHaveBeenCalledWith('Enter URL:');
      expect(document.execCommand).toHaveBeenCalledWith('createLink', false, 'https://example.com');
    });

    it('should not insert link when prompt is cancelled', async () => {
      const user = userEvent.setup();
      window.prompt = jest.fn().mockReturnValue(null);

      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const linkButton = screen.getByTitle('Insert Link');
      await user.click(linkButton);

      expect(window.prompt).toHaveBeenCalled();
    });
  });

  describe('file import', () => {
    it('should trigger file input when import button is clicked', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = jest.spyOn(fileInput, 'click');

      const importButton = screen.getByTitle('Import from .txt file');
      await user.click(importButton);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('should accept only .txt files', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', '.txt');
    });

    it('should import text from file', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const fileContent = 'Line 1\nLine 2\nLine 3';
      const file = new File([fileContent], 'test.txt', { type: 'text/plain' });

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });
  });

  describe('text export', () => {
    it('should export content as text file', async () => {
      const user = userEvent.setup();
      const createElementSpy = jest.spyOn(document, 'createElement');
      URL.createObjectURL = jest.fn().mockReturnValue('blob:url');
      URL.revokeObjectURL = jest.fn();

      render(<RichTextEditor value="<p>Test content</p>" onChange={mockOnChange} />);

      const exportButton = screen.getByTitle('Export as .txt file');
      await user.click(exportButton);

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    it('should export content as PDF', async () => {
      const user = userEvent.setup();
      const mockPrintWindow = {
        document: {
          write: jest.fn(),
          close: jest.fn(),
        },
        focus: jest.fn(),
        print: jest.fn(),
        close: jest.fn(),
      };
      window.open = jest.fn().mockReturnValue(mockPrintWindow);

      render(<RichTextEditor value="<p>Test content</p>" onChange={mockOnChange} />);

      const exportPdfButton = screen.getByTitle('Export as PDF');
      await user.click(exportPdfButton);

      expect(window.open).toHaveBeenCalledWith('', '_blank');
      expect(mockPrintWindow.document.write).toHaveBeenCalled();
    });
  });

  describe('content editing', () => {
    it('should call onChange when content is modified', async () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const editor = document.querySelector('.editor-content') as HTMLElement;
      
      editor.innerHTML = '<p>New content</p>';
      editor.dispatchEvent(new Event('input', { bubbles: true }));

      expect(mockOnChange).toHaveBeenCalledWith('<p>New content</p>');
    });

    it('should be contentEditable', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const editor = document.querySelector('.editor-content');
      expect(editor).toHaveAttribute('contentEditable', 'true');
    });
  });

  describe('editor initialization', () => {
    it('should initialize editor with provided value', () => {
      const initialValue = '<h1>Title</h1><p>Content</p>';
      render(<RichTextEditor value={initialValue} onChange={mockOnChange} />);

      const editor = document.querySelector('.editor-content');
      expect(editor?.innerHTML).toContain('Title');
      expect(editor?.innerHTML).toContain('Content');
    });

    it('should handle empty initial value', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const editor = document.querySelector('.editor-content');
      expect(editor).toBeInTheDocument();
    });
  });

  describe('toolbar groups', () => {
    it('should render alignment toolbar group', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const toolbarGroups = document.querySelectorAll('.toolbar-group');
      expect(toolbarGroups.length).toBeGreaterThan(0);
    });

    it('should render formatting toolbar group', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      expect(screen.getByTitle('Bold')).toBeInTheDocument();
      expect(screen.getByTitle('Italic')).toBeInTheDocument();
      expect(screen.getByTitle('Underline')).toBeInTheDocument();
    });

    it('should render tools toolbar group', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      expect(screen.getByTitle('Code Block')).toBeInTheDocument();
      expect(screen.getByTitle('Insert Link')).toBeInTheDocument();
    });
  });
});
