import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import NoteEditor from '../NoteEditor';
import { notesApi } from '../../utils/api';

// Mock the API
jest.mock('../../utils/api', () => ({
  notesApi: {
    getSingleNote: jest.fn(),
    createNote: jest.fn(),
    editNote: jest.fn(),
    deleteNote: jest.fn(),
  },
  authApi: {
    getUserDetails: jest.fn(() => Promise.resolve({
      data: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        notesCount: 5,
      },
    })),
    logout: jest.fn(() => Promise.resolve()),
  },
  tokenUtils: {
    isAuthenticated: jest.fn(() => true),
    getAccessToken: jest.fn(() => 'mock-token'),
    clearTokens: jest.fn(),
  },
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderNoteEditor = (initialPath = '/dashboard/create-note') => {
  window.history.pushState({}, '', initialPath);
  
  return render(
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/dashboard/create-note" element={<NoteEditor />} />
        <Route path="/dashboard/edit-note/:id" element={<NoteEditor />} />
      </Routes>
    </BrowserRouter>
  );
};

describe('NoteEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
  });

  describe('create mode', () => {
    describe('initial render', () => {
      it('should render empty title input', () => {
        renderNoteEditor('/dashboard/create-note');

        const titleInput = screen.getByPlaceholderText('Untitled Note');
        expect(titleInput).toBeInTheDocument();
        expect(titleInput).toHaveValue('');
      });

      it('should render empty content editor', () => {
        renderNoteEditor('/dashboard/create-note');

        // The RichTextEditor uses a contentEditable div, not an input
        const editor = document.querySelector('.editor-content');
        expect(editor).toBeInTheDocument();
      });

      it('should show save button', () => {
        renderNoteEditor('/dashboard/create-note');

        expect(screen.getByRole('button', { name: /^save$/i })).toBeInTheDocument();
      });

      it('should show cancel button', () => {
        renderNoteEditor('/dashboard/create-note');

        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });
    });

    describe('user interactions', () => {
      it('should update title when user types', async () => {
        const user = userEvent.setup();
        renderNoteEditor('/dashboard/create-note');

        const titleInput = screen.getByPlaceholderText('Untitled Note');
        await user.type(titleInput, 'My New Note');

        expect(titleInput).toHaveValue('My New Note');
      });

      it('should navigate back to dashboard when clicking cancel', async () => {
        const user = userEvent.setup();
        renderNoteEditor('/dashboard/create-note');

        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        await user.click(cancelButton);

        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });

      it('should disable save button when content is empty', () => {
        renderNoteEditor('/dashboard/create-note');

        const saveButton = screen.getByRole('button', { name: /^save$/i });
        expect(saveButton).toBeDisabled();
      });
    });

    describe('save functionality', () => {
      it('should create note with title and content', async () => {
        const user = userEvent.setup();
        (notesApi.createNote as jest.Mock).mockResolvedValue({
          data: { id: 'new-note-id' },
        });

        renderNoteEditor('/dashboard/create-note');

        const titleInput = screen.getByPlaceholderText('Untitled Note');
        await user.type(titleInput, 'Test Title');

        // Simulate content editor change
        const contentEditor = document.querySelector('.editor-content');
        if (contentEditor) {
          contentEditor.innerHTML = '<p>Test content</p>';
          contentEditor.dispatchEvent(new Event('input', { bubbles: true }));
        }

        await waitFor(() => {
          const saveButton = screen.getByRole('button', { name: /^save$/i });
          expect(saveButton).not.toBeDisabled();
        });

        const saveButton = screen.getByRole('button', { name: /^save$/i });
        await user.click(saveButton);

        await waitFor(() => {
          expect(notesApi.createNote).toHaveBeenCalledWith({
            title: 'Test Title',
            content: '<p>Test content</p>',
          });
        });
      });

      it('should navigate to dashboard after successful save', async () => {
        const user = userEvent.setup();
        (notesApi.createNote as jest.Mock).mockResolvedValue({
          data: { id: 'new-note-id' },
        });

        renderNoteEditor('/dashboard/create-note');

        const contentEditor = document.querySelector('.editor-content');
        if (contentEditor) {
          contentEditor.innerHTML = '<p>Content</p>';
          contentEditor.dispatchEvent(new Event('input', { bubbles: true }));
        }

        await waitFor(() => {
          const saveButton = screen.getByRole('button', { name: /^save$/i });
          expect(saveButton).not.toBeDisabled();
        });

        const saveButton = screen.getByRole('button', { name: /^save$/i });
        await user.click(saveButton);

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
        });
      });

      it('should show error message when save fails', async () => {
        const user = userEvent.setup();
        (notesApi.createNote as jest.Mock).mockRejectedValue(
          new Error('Failed to save note')
        );

        renderNoteEditor('/dashboard/create-note');

        const contentEditor = document.querySelector('.editor-content');
        if (contentEditor) {
          contentEditor.innerHTML = '<p>Content</p>';
          contentEditor.dispatchEvent(new Event('input', { bubbles: true }));
        }

        await waitFor(() => {
          const saveButton = screen.getByRole('button', { name: /^save$/i });
          expect(saveButton).not.toBeDisabled();
        });

        const saveButton = screen.getByRole('button', { name: /^save$/i });
        await user.click(saveButton);

        await waitFor(() => {
          expect(screen.getByText('Failed to save note')).toBeInTheDocument();
        });
      });

      it('should show saving state while saving', async () => {
        const user = userEvent.setup();
        (notesApi.createNote as jest.Mock).mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve({ data: { id: '1' } }), 100))
        );

        renderNoteEditor('/dashboard/create-note');

        const contentEditor = document.querySelector('.editor-content');
        if (contentEditor) {
          contentEditor.innerHTML = '<p>Content</p>';
          contentEditor.dispatchEvent(new Event('input', { bubbles: true }));
        }

        await waitFor(() => {
          const saveButton = screen.getByRole('button', { name: /^save$/i });
          expect(saveButton).not.toBeDisabled();
        });

        const saveButton = screen.getByRole('button', { name: /^save$/i });
        await user.click(saveButton);

        expect(screen.getByRole('button', { name: /saving\.\.\./i })).toBeInTheDocument();
      });
    });
  });

  describe('edit mode', () => {
    describe('loading state', () => {
      it('should show loading spinner while fetching note', () => {
        (notesApi.getSingleNote as jest.Mock).mockImplementation(
          () => new Promise(() => {}) // Never resolves
        );

        renderNoteEditor('/dashboard/edit-note/note-123');

        // The loading spinner is a div with specific classes, not a progressbar role
        const spinner = document.querySelector('.animate-spin');
        expect(spinner).toBeInTheDocument();
      });

      it('should hide loading spinner after note is loaded', async () => {
        (notesApi.getSingleNote as jest.Mock).mockResolvedValue({
          data: {
            id: 'note-123',
            title: 'Existing Note',
            content: '<p>Existing content</p>',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });

        renderNoteEditor('/dashboard/edit-note/note-123');

        await waitFor(() => {
          const spinner = document.querySelector('.animate-spin');
          expect(spinner).not.toBeInTheDocument();
        });
      });
    });

    describe('rendered data', () => {
      it('should display existing note title', async () => {
        (notesApi.getSingleNote as jest.Mock).mockResolvedValue({
          data: {
            id: 'note-123',
            title: 'Existing Note Title',
            content: '<p>Content</p>',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });

        renderNoteEditor('/dashboard/edit-note/note-123');

        await waitFor(() => {
          const titleInput = screen.getByPlaceholderText('Untitled Note');
          expect(titleInput).toHaveValue('Existing Note Title');
        });
      });

      it('should display existing note content', async () => {
        (notesApi.getSingleNote as jest.Mock).mockResolvedValue({
          data: {
            id: 'note-123',
            title: 'Note',
            content: '<p>Existing content here</p>',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });

        renderNoteEditor('/dashboard/edit-note/note-123');

        await waitFor(() => {
          expect(screen.getByText(/Existing content here/i)).toBeInTheDocument();
        });
      });

      it('should show delete button in edit mode', async () => {
        (notesApi.getSingleNote as jest.Mock).mockResolvedValue({
          data: {
            id: 'note-123',
            title: 'Note',
            content: '<p>Content</p>',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });

        renderNoteEditor('/dashboard/edit-note/note-123');

        await waitFor(() => {
          expect(screen.getByRole('button', { name: /delete note/i })).toBeInTheDocument();
        });
      });
    });

    describe('update functionality', () => {
      it('should update note when saving changes', async () => {
        const user = userEvent.setup();
        (notesApi.getSingleNote as jest.Mock).mockResolvedValue({
          data: {
            id: 'note-123',
            title: 'Original Title',
            content: '<p>Original content</p>',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });
        (notesApi.editNote as jest.Mock).mockResolvedValue({});

        renderNoteEditor('/dashboard/edit-note/note-123');

        await waitFor(() => {
          expect(screen.getByDisplayValue('Original Title')).toBeInTheDocument();
        });

        const titleInput = screen.getByPlaceholderText('Untitled Note');
        await user.clear(titleInput);
        await user.type(titleInput, 'Updated Title');

        const saveButton = screen.getByRole('button', { name: /^save$/i });
        await user.click(saveButton);

        await waitFor(() => {
          expect(notesApi.editNote).toHaveBeenCalledWith({
            id: 'note-123',
            title: 'Updated Title',
            content: '<p>Original content</p>',
          });
        });
      });

      it('should navigate to dashboard after successful update', async () => {
        const user = userEvent.setup();
        (notesApi.getSingleNote as jest.Mock).mockResolvedValue({
          data: {
            id: 'note-123',
            title: 'Note',
            content: '<p>Content</p>',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });
        (notesApi.editNote as jest.Mock).mockResolvedValue({});

        renderNoteEditor('/dashboard/edit-note/note-123');

        await waitFor(() => {
          expect(screen.getByRole('button', { name: /^save$/i })).toBeInTheDocument();
        });

        const saveButton = screen.getByRole('button', { name: /^save$/i });
        await user.click(saveButton);

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
        });
      });
    });

    describe('delete functionality', () => {
      it('should show confirmation dialog when deleting note', async () => {
        const user = userEvent.setup();
        (notesApi.getSingleNote as jest.Mock).mockResolvedValue({
          data: {
            id: 'note-123',
            title: 'Note to Delete',
            content: '<p>Content</p>',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });

        renderNoteEditor('/dashboard/edit-note/note-123');

        await waitFor(() => {
          expect(screen.getByRole('button', { name: /delete note/i })).toBeInTheDocument();
        });

        const deleteButton = screen.getByRole('button', { name: /delete note/i });
        await user.click(deleteButton);

        expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this note?');
      });

      it('should delete note and navigate to dashboard when confirmed', async () => {
        const user = userEvent.setup();
        (notesApi.getSingleNote as jest.Mock).mockResolvedValue({
          data: {
            id: 'note-123',
            title: 'Note',
            content: '<p>Content</p>',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });
        (notesApi.deleteNote as jest.Mock).mockResolvedValue({});
        window.confirm = jest.fn(() => true);

        renderNoteEditor('/dashboard/edit-note/note-123');

        await waitFor(() => {
          expect(screen.getByRole('button', { name: /delete note/i })).toBeInTheDocument();
        });

        const deleteButton = screen.getByRole('button', { name: /delete note/i });
        await user.click(deleteButton);

        await waitFor(() => {
          expect(notesApi.deleteNote).toHaveBeenCalledWith('note-123');
          expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
        });
      });

      it('should not delete note when confirmation is cancelled', async () => {
        const user = userEvent.setup();
        (notesApi.getSingleNote as jest.Mock).mockResolvedValue({
          data: {
            id: 'note-123',
            title: 'Note',
            content: '<p>Content</p>',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });
        window.confirm = jest.fn(() => false);

        renderNoteEditor('/dashboard/edit-note/note-123');

        await waitFor(() => {
          expect(screen.getByRole('button', { name: /delete note/i })).toBeInTheDocument();
        });

        const deleteButton = screen.getByRole('button', { name: /delete note/i });
        await user.click(deleteButton);

        expect(notesApi.deleteNote).not.toHaveBeenCalled();
      });
    });

    describe('error handling', () => {
      it('should display error message when fetch fails', async () => {
        (notesApi.getSingleNote as jest.Mock).mockRejectedValue(
          new Error('Failed to fetch note')
        );

        renderNoteEditor('/dashboard/edit-note/note-123');

        await waitFor(() => {
          expect(screen.getByText('Failed to fetch note')).toBeInTheDocument();
        });
      });

      it('should display error message when update fails', async () => {
        const user = userEvent.setup();
        (notesApi.getSingleNote as jest.Mock).mockResolvedValue({
          data: {
            id: 'note-123',
            title: 'Note',
            content: '<p>Content</p>',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });
        (notesApi.editNote as jest.Mock).mockRejectedValue(
          new Error('Failed to save note')
        );

        renderNoteEditor('/dashboard/edit-note/note-123');

        await waitFor(() => {
          expect(screen.getByRole('button', { name: /^save$/i })).toBeInTheDocument();
        });

        const saveButton = screen.getByRole('button', { name: /^save$/i });
        await user.click(saveButton);

        await waitFor(() => {
          expect(screen.getByText('Failed to save note')).toBeInTheDocument();
        });
      });
    });
  });

  describe('auto-save functionality', () => {
    it('should show auto-save status', async () => {
      renderNoteEditor('/dashboard/create-note');

      await waitFor(() => {
        expect(screen.getByText(/all changes saved/i)).toBeInTheDocument();
      });
    });
  });
});
