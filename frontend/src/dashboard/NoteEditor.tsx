import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { notesApi, type Note, type CreateNoteData, type EditNoteData } from '../utils/api';
import Sidebar from '../components/Sidebar';
import RichTextEditor from '../components/RichTextEditor';

const NoteEditor: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const createdNoteIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (isEditing && id) {
      fetchNote(id);
    }
  }, [id, isEditing]);

  const fetchNote = async (noteId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await notesApi.getSingleNote(noteId);
      const noteData = response.data;
      if (noteData) {
        setNote(noteData);
        setTitle(noteData.title || '');
        setContent(noteData.content || '');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to fetch note');
      console.error('Error fetching note:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSave = useCallback(async () => {
    if (!content.trim()) return;
    if (saving || autoSaveStatus === 'saving') return; // Prevent concurrent saves

    try {
      setAutoSaveStatus('saving');
      setSaving(true); // Lock to prevent concurrent saves
      
      // Use the created note ID if it exists, or the URL id
      const noteId = createdNoteIdRef.current || id;
      
      if (noteId) {
        // Edit existing note
        const editData: EditNoteData = {
          id: noteId,
          title: title.trim() || undefined,
          content: content.trim(),
        };
        await notesApi.editNote(editData);
      } else {
        // Create new note
        const createData: CreateNoteData = {
          title: title.trim() || undefined,
          content: content.trim(),
        };
        const response = await notesApi.createNote(createData);
        if (response.data?.id) {
          // Store the created note ID
          createdNoteIdRef.current = response.data.id;
          // Update URL to edit mode after first save
          window.history.replaceState(null, '', `/dashboard/edit-note/${response.data.id}`);
        }
      }
      
      setAutoSaveStatus('saved');
    } catch (error: any) {
      console.error('Auto-save failed:', error);
      setAutoSaveStatus('unsaved');
    } finally {
      setSaving(false);
    }
  }, [content, title, isEditing, id, autoSaveStatus]);

  // Auto-save functionality with debouncing
  useEffect(() => {
    if (!title && !content) return;
    if (saving) return; // Don't auto-save while manually saving
    
    // Clear any existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    setAutoSaveStatus('unsaved');
    autoSaveTimerRef.current = setTimeout(() => {
      handleAutoSave();
    }, 3000); // Auto-save after 3 seconds of inactivity

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [title, content]);

  const handleSave = async () => {
    if (!content.trim()) {
      setError('Note content is required');
      return;
    }

    // Cancel any pending auto-save
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    try {
      setSaving(true);
      setAutoSaveStatus('saving');
      setError(null);

      // Use the created note ID if it exists, or the URL id
      const noteId = createdNoteIdRef.current || id;

      if (noteId) {
        // Edit existing note
        const editData: EditNoteData = {
          id: noteId,
          title: title.trim() || undefined,
          content: content.trim(),
        };
        await notesApi.editNote(editData);
      } else {
        // Create new note
        const createData: CreateNoteData = {
          title: title.trim() || undefined,
          content: content.trim(),
        };
        await notesApi.createNote(createData);
      }

      navigate('/dashboard');
    } catch (error: any) {
      setError(error.message || 'Failed to save note');
      console.error('Error saving note:', error);
    } finally {
      setSaving(false);
      setAutoSaveStatus('saved');
    }
  };

  const handleDelete = async () => {
    if (!isEditing || !id) return;

    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        setLoading(true);
        await notesApi.deleteNote(id);
        navigate('/dashboard');
      } catch (error: any) {
        setError(error.message || 'Failed to delete note');
        console.error('Error deleting note:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const getAutoSaveText = () => {
    switch (autoSaveStatus) {
      case 'saving':
        return 'Auto-saving...';
      case 'saved':
        return 'All changes saved';
      case 'unsaved':
        return 'Unsaved changes';
      default:
        return '';
    }
  };

  const getAutoSaveIcon = () => {
    switch (autoSaveStatus) {
      case 'saving':
        return (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
        );
      case 'saved':
        return (
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'unsaved':
        return (
          <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 w-full">
      <Sidebar />
      
      <div className="flex-1 flex flex-col w-full">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Breadcrumb and Title */}
            <div className="flex items-center space-x-4">
              <nav className="text-sm text-gray-500">
                <span className="text-blue-600 cursor-pointer">Notebooks</span>
                <span className="mx-2">&gt;</span>
                <span className="text-blue-600 cursor-pointer">Personal</span>
                <span className="mx-2">&gt;</span>
                <span>{title || 'Untitled Note'}</span>
              </nav>
            </div>

            {/* Auto-save status and actions */}
            <div className="flex items-center space-x-4">
              {/* Auto-save status */}
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                {getAutoSaveIcon()}
                <span>{getAutoSaveText()}</span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !content.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto h-full">
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-red-800">{error}</div>
                </div>
              )}

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
                {/* Title Input */}
                <div className="p-6 border-b border-gray-200">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Untitled Note"
                    className="w-full text-3xl font-bold text-gray-900 placeholder-gray-400 border-none outline-none bg-transparent"
                  />
                </div>

                {/* Rich Text Editor */}
                <div className="flex-1 p-6">
                  <RichTextEditor
                    value={content}
                    onChange={setContent}
                    placeholder="Start writing your note..."
                  />
                </div>

                {/* Footer with metadata */}
                {isEditing && note && (
                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div>
                        Last edited by Sarah, 2 minutes ago
                      </div>
                      <div className="flex items-center space-x-4">
                        <span>{content.replace(/<[^>]*>/g, '').length} characters</span>
                        {isEditing && (
                          <button
                            onClick={handleDelete}
                            disabled={loading}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50"
                          >
                            Delete Note
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;