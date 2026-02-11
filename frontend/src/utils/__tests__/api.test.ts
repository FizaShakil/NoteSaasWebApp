import { ApiError, tokenUtils, authApi, notesApi } from '../api';

// Mock fetch globally
global.fetch = jest.fn();

describe('ApiError', () => {
  describe('constructor', () => {
    it('should create an ApiError with status and message', () => {
      // Arrange
      const status = 404;
      const message = 'Not found';

      // Act
      const error = new ApiError(status, message);

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.status).toBe(status);
      expect(error.message).toBe(message);
      expect(error.name).toBe('ApiError');
    });

    it('should create an ApiError with status 500', () => {
      // Arrange
      const status = 500;
      const message = 'Internal server error';

      // Act
      const error = new ApiError(status, message);

      // Assert
      expect(error.status).toBe(500);
      expect(error.message).toBe(message);
    });

    it('should create an ApiError with status 401', () => {
      // Arrange
      const status = 401;
      const message = 'Unauthorized';

      // Act
      const error = new ApiError(status, message);

      // Assert
      expect(error.status).toBe(401);
      expect(error.message).toBe(message);
    });

    it('should create an ApiError with empty message', () => {
      // Arrange
      const status = 400;
      const message = '';

      // Act
      const error = new ApiError(status, message);

      // Assert
      expect(error.status).toBe(400);
      expect(error.message).toBe('');
    });

    it('should create an ApiError with status 0', () => {
      // Arrange
      const status = 0;
      const message = 'Network error';

      // Act
      const error = new ApiError(status, message);

      // Assert
      expect(error.status).toBe(0);
      expect(error.message).toBe(message);
    });

    it('should have correct prototype chain', () => {
      // Arrange & Act
      const error = new ApiError(404, 'Not found');

      // Assert
      expect(error instanceof Error).toBe(true);
      expect(error instanceof ApiError).toBe(true);
      expect(Object.getPrototypeOf(error)).toBe(ApiError.prototype);
    });
  });
});

describe('tokenUtils', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('getAccessToken', () => {
    it('should return access token when it exists in localStorage', () => {
      // Arrange
      const token = 'test-access-token-123';
      localStorage.setItem('accessToken', token);

      // Act
      const result = tokenUtils.getAccessToken();

      // Assert
      expect(result).toBe(token);
    });

    it('should return null when access token does not exist', () => {
      // Arrange
      // localStorage is empty

      // Act
      const result = tokenUtils.getAccessToken();

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when localStorage is cleared', () => {
      // Arrange
      localStorage.setItem('accessToken', 'token');
      localStorage.clear();

      // Act
      const result = tokenUtils.getAccessToken();

      // Assert
      expect(result).toBeNull();
    });

    it('should return empty string when access token is empty', () => {
      // Arrange
      localStorage.setItem('accessToken', '');

      // Act
      const result = tokenUtils.getAccessToken();

      // Assert
      expect(result).toBe('');
    });

    it('should return the most recent token when updated', () => {
      // Arrange
      localStorage.setItem('accessToken', 'old-token');
      localStorage.setItem('accessToken', 'new-token');

      // Act
      const result = tokenUtils.getAccessToken();

      // Assert
      expect(result).toBe('new-token');
    });
  });

  describe('setTokens', () => {
    it('should store both access and refresh tokens in localStorage', () => {
      // Arrange
      const accessToken = 'access-token-123';
      const refreshToken = 'refresh-token-456';

      // Act
      tokenUtils.setTokens(accessToken, refreshToken);

      // Assert
      expect(localStorage.getItem('accessToken')).toBe(accessToken);
      expect(localStorage.getItem('refreshToken')).toBe(refreshToken);
    });

    it('should overwrite existing tokens', () => {
      // Arrange
      localStorage.setItem('accessToken', 'old-access');
      localStorage.setItem('refreshToken', 'old-refresh');
      const newAccessToken = 'new-access-token';
      const newRefreshToken = 'new-refresh-token';

      // Act
      tokenUtils.setTokens(newAccessToken, newRefreshToken);

      // Assert
      expect(localStorage.getItem('accessToken')).toBe(newAccessToken);
      expect(localStorage.getItem('refreshToken')).toBe(newRefreshToken);
    });

    it('should store empty strings as tokens', () => {
      // Arrange
      const accessToken = '';
      const refreshToken = '';

      // Act
      tokenUtils.setTokens(accessToken, refreshToken);

      // Assert
      expect(localStorage.getItem('accessToken')).toBe('');
      expect(localStorage.getItem('refreshToken')).toBe('');
    });

    it('should store very long tokens', () => {
      // Arrange
      const accessToken = 'a'.repeat(1000);
      const refreshToken = 'b'.repeat(1000);

      // Act
      tokenUtils.setTokens(accessToken, refreshToken);

      // Assert
      expect(localStorage.getItem('accessToken')).toBe(accessToken);
      expect(localStorage.getItem('refreshToken')).toBe(refreshToken);
    });

    it('should store tokens with special characters', () => {
      // Arrange
      const accessToken = 'token!@#$%^&*()_+-=[]{}|;:,.<>?';
      const refreshToken = 'refresh~`token';

      // Act
      tokenUtils.setTokens(accessToken, refreshToken);

      // Assert
      expect(localStorage.getItem('accessToken')).toBe(accessToken);
      expect(localStorage.getItem('refreshToken')).toBe(refreshToken);
    });
  });

  describe('clearTokens', () => {
    it('should remove both access and refresh tokens from localStorage', () => {
      // Arrange
      localStorage.setItem('accessToken', 'access-token');
      localStorage.setItem('refreshToken', 'refresh-token');

      // Act
      tokenUtils.clearTokens();

      // Assert
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });

    it('should not throw error when tokens do not exist', () => {
      // Arrange
      // localStorage is empty

      // Act & Assert
      expect(() => tokenUtils.clearTokens()).not.toThrow();
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });

    it('should not affect other localStorage items', () => {
      // Arrange
      localStorage.setItem('accessToken', 'access-token');
      localStorage.setItem('refreshToken', 'refresh-token');
      localStorage.setItem('otherKey', 'otherValue');

      // Act
      tokenUtils.clearTokens();

      // Assert
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(localStorage.getItem('otherKey')).toBe('otherValue');
    });

    it('should work when called multiple times', () => {
      // Arrange
      localStorage.setItem('accessToken', 'access-token');
      localStorage.setItem('refreshToken', 'refresh-token');

      // Act
      tokenUtils.clearTokens();
      tokenUtils.clearTokens();
      tokenUtils.clearTokens();

      // Assert
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when access token exists', () => {
      // Arrange
      localStorage.setItem('accessToken', 'valid-token');

      // Act
      const result = tokenUtils.isAuthenticated();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when access token does not exist', () => {
      // Arrange
      // localStorage is empty

      // Act
      const result = tokenUtils.isAuthenticated();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when access token is null', () => {
      // Arrange
      localStorage.removeItem('accessToken');

      // Act
      const result = tokenUtils.isAuthenticated();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when access token is empty string', () => {
      // Arrange
      localStorage.setItem('accessToken', '');

      // Act
      const result = tokenUtils.isAuthenticated();

      // Assert
      expect(result).toBe(false);
    });

    it('should return true when access token is whitespace', () => {
      // Arrange
      localStorage.setItem('accessToken', '   ');

      // Act
      const result = tokenUtils.isAuthenticated();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false after tokens are cleared', () => {
      // Arrange
      localStorage.setItem('accessToken', 'token');
      tokenUtils.clearTokens();

      // Act
      const result = tokenUtils.isAuthenticated();

      // Assert
      expect(result).toBe(false);
    });

    it('should return true immediately after setting tokens', () => {
      // Arrange
      tokenUtils.setTokens('access-token', 'refresh-token');

      // Act
      const result = tokenUtils.isAuthenticated();

      // Assert
      expect(result).toBe(true);
    });

    it('should not depend on refresh token', () => {
      // Arrange
      localStorage.setItem('accessToken', 'access-token');
      localStorage.removeItem('refreshToken');

      // Act
      const result = tokenUtils.isAuthenticated();

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete authentication flow', () => {
      // Arrange
      expect(tokenUtils.isAuthenticated()).toBe(false);

      // Act - Login
      tokenUtils.setTokens('access-123', 'refresh-456');

      // Assert - Authenticated
      expect(tokenUtils.isAuthenticated()).toBe(true);
      expect(tokenUtils.getAccessToken()).toBe('access-123');

      // Act - Logout
      tokenUtils.clearTokens();

      // Assert - Not authenticated
      expect(tokenUtils.isAuthenticated()).toBe(false);
      expect(tokenUtils.getAccessToken()).toBeNull();
    });

    it('should handle token refresh scenario', () => {
      // Arrange
      tokenUtils.setTokens('old-access', 'old-refresh');
      expect(tokenUtils.getAccessToken()).toBe('old-access');

      // Act - Refresh tokens
      tokenUtils.setTokens('new-access', 'new-refresh');

      // Assert
      expect(tokenUtils.getAccessToken()).toBe('new-access');
      expect(tokenUtils.isAuthenticated()).toBe(true);
    });

    it('should handle forced logout scenario', () => {
      // Arrange
      tokenUtils.setTokens('access', 'refresh');
      expect(tokenUtils.isAuthenticated()).toBe(true);

      // Act - Force logout (e.g., 401 response)
      tokenUtils.clearTokens();

      // Assert
      expect(tokenUtils.isAuthenticated()).toBe(false);
      expect(tokenUtils.getAccessToken()).toBeNull();
    });
  });
});

describe('authApi', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    localStorage.clear();
    mockFetch.mockClear();
  });

  describe('login', () => {
    it('should make POST request to correct endpoint with credentials', async () => {
      // Arrange
      const credentials = { email: 'test@example.com', password: 'password123' };
      const mockResponse = {
        success: true,
        message: 'Login successful',
        data: {
          user: { id: '1', email: 'test@example.com', name: 'Test User' },
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-456',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // Act
      const result = await authApi.login(credentials);

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/users/login',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(credentials),
          credentials: 'include',
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should store tokens in localStorage after successful login', async () => {
      // Arrange
      const credentials = { email: 'test@example.com', password: 'password123' };
      const mockResponse = {
        success: true,
        message: 'Login successful',
        data: {
          user: { id: '1', email: 'test@example.com' },
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-456',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // Act
      await authApi.login(credentials);

      // Assert
      expect(localStorage.getItem('accessToken')).toBe('access-token-123');
      expect(localStorage.getItem('refreshToken')).toBe('refresh-token-456');
    });

    it('should throw ApiError on failed login', async () => {
      // Arrange
      const credentials = { email: 'test@example.com', password: 'wrong' };
      const mockErrorResponse = {
        success: false,
        message: 'Invalid credentials',
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => mockErrorResponse,
      } as Response);

      // Act & Assert
      await expect(authApi.login(credentials)).rejects.toThrow(ApiError);
      
      // Reset mock for second call
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => mockErrorResponse,
      } as Response);
      
      await expect(authApi.login(credentials)).rejects.toMatchObject({
        status: 401,
        message: 'Invalid credentials',
      });
    });

    it('should clear tokens on 401 error', async () => {
      // Arrange
      localStorage.setItem('accessToken', 'old-token');
      localStorage.setItem('refreshToken', 'old-refresh');
      const credentials = { email: 'test@example.com', password: 'wrong' };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ success: false, message: 'Unauthorized' }),
      } as Response);

      // Act
      try {
        await authApi.login(credentials);
      } catch (error) {
        // Expected to throw
      }

      // Assert
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });

    it('should handle network error', async () => {
      // Arrange
      const credentials = { email: 'test@example.com', password: 'password123' };
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(authApi.login(credentials)).rejects.toThrow(ApiError);
      await expect(authApi.login(credentials)).rejects.toMatchObject({
        status: 500,
        message: 'Network error. Please try again.',
      });
    });
  });

  describe('signup', () => {
    it('should make POST request to correct endpoint with user data', async () => {
      // Arrange
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };
      const mockResponse = {
        success: true,
        message: 'User created successfully',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // Act
      const result = await authApi.signup(userData);

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/users/signup',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(userData),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw ApiError when email already exists', async () => {
      // Arrange
      const userData = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123',
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ success: false, message: 'Email already exists' }),
      } as Response);

      // Act & Assert
      await expect(authApi.signup(userData)).rejects.toThrow(ApiError);
      
      // Reset mock for second call
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ success: false, message: 'Email already exists' }),
      } as Response);
      
      await expect(authApi.signup(userData)).rejects.toMatchObject({
        status: 400,
        message: 'Email already exists',
      });
    });
  });

  describe('forgotPassword', () => {
    it('should make POST request to correct endpoint with email', async () => {
      // Arrange
      const email = 'test@example.com';
      const mockResponse = {
        success: true,
        message: 'Password reset email sent',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // Act
      const result = await authApi.forgotPassword(email);

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/users/forgot-password',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email }),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('changeUserDetails', () => {
    it('should make PATCH request to correct endpoint with user data', async () => {
      // Arrange
      localStorage.setItem('accessToken', 'valid-token');
      const updateData = { name: 'New Name', email: 'new@example.com' };
      const mockResponse = {
        success: true,
        message: 'User details updated',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // Act
      const result = await authApi.changeUserDetails(updateData);

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/users/change-user-details',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(updateData),
          headers: expect.objectContaining({
            Authorization: 'Bearer valid-token',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should include password change data', async () => {
      // Arrange
      localStorage.setItem('accessToken', 'valid-token');
      const updateData = {
        oldPassword: 'oldpass123',
        newPassword: 'newpass456',
      };
      const mockResponse = {
        success: true,
        message: 'Password updated',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // Act
      await authApi.changeUserDetails(updateData);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/users/change-user-details',
        expect.objectContaining({
          body: JSON.stringify(updateData),
        })
      );
    });
  });

  describe('getUserDetails', () => {
    it('should make GET request to correct endpoint with auth token', async () => {
      // Arrange
      localStorage.setItem('accessToken', 'valid-token');
      const mockResponse = {
        success: true,
        message: 'User details fetched',
        data: { id: '1', email: 'test@example.com', name: 'Test User' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // Act
      const result = await authApi.getUserDetails();

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/users/get-user-details',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer valid-token',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('logout', () => {
    it('should make POST request and clear tokens on success', async () => {
      // Arrange
      localStorage.setItem('accessToken', 'valid-token');
      localStorage.setItem('refreshToken', 'valid-refresh');
      const mockResponse = {
        success: true,
        message: 'Logged out successfully',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // Act
      const result = await authApi.logout();

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/users/logout',
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(result).toEqual(mockResponse);
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });

    it('should clear tokens even if logout request fails', async () => {
      // Arrange
      localStorage.setItem('accessToken', 'valid-token');
      localStorage.setItem('refreshToken', 'valid-refresh');

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ success: false, message: 'Server error' }),
      } as Response);

      // Act
      try {
        await authApi.logout();
      } catch (error) {
        // Expected to throw
      }

      // Assert
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });
});

describe('notesApi', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    localStorage.clear();
    mockFetch.mockClear();
  });

  describe('getAllNotes', () => {
    it('should make GET request to correct endpoint', async () => {
      // Arrange
      localStorage.setItem('accessToken', 'valid-token');
      const mockResponse = {
        success: true,
        message: 'Notes fetched',
        data: [
          { id: '1', title: 'Note 1', content: 'Content 1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
          { id: '2', title: 'Note 2', content: 'Content 2', createdAt: '2024-01-02', updatedAt: '2024-01-02' },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // Act
      const result = await notesApi.getAllNotes();

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/notes/get-notes',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer valid-token',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
      expect(result.data).toHaveLength(2);
    });
  });

  describe('getSingleNote', () => {
    it('should make GET request to correct endpoint with note ID', async () => {
      // Arrange
      localStorage.setItem('accessToken', 'valid-token');
      const noteId = 'note-123';
      const mockResponse = {
        success: true,
        message: 'Note fetched',
        data: { id: noteId, title: 'Test Note', content: 'Test Content', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // Act
      const result = await notesApi.getSingleNote(noteId);

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:8000/api/v1/notes/get-note/${noteId}`,
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw ApiError when note not found', async () => {
      // Arrange
      localStorage.setItem('accessToken', 'valid-token');
      const noteId = 'non-existent';

      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ success: false, message: 'Note not found' }),
      } as Response);

      // Act & Assert
      await expect(notesApi.getSingleNote(noteId)).rejects.toThrow(ApiError);
      
      // Reset mock for second call
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ success: false, message: 'Note not found' }),
      } as Response);
      
      await expect(notesApi.getSingleNote(noteId)).rejects.toMatchObject({
        status: 404,
        message: 'Note not found',
      });
    });
  });

  describe('createNote', () => {
    it('should make POST request to correct endpoint with note data', async () => {
      // Arrange
      localStorage.setItem('accessToken', 'valid-token');
      const noteData = { title: 'New Note', content: 'New Content' };
      const mockResponse = {
        success: true,
        message: 'Note created',
        data: { id: 'new-id', ...noteData, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // Act
      const result = await notesApi.createNote(noteData);

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/notes/create-note',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(noteData),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should create note without title', async () => {
      // Arrange
      localStorage.setItem('accessToken', 'valid-token');
      const noteData = { content: 'Content only' };
      const mockResponse = {
        success: true,
        message: 'Note created',
        data: { id: 'new-id', content: 'Content only', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // Act
      await notesApi.createNote(noteData);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/notes/create-note',
        expect.objectContaining({
          body: JSON.stringify(noteData),
        })
      );
    });
  });

  describe('editNote', () => {
    it('should make PATCH request to correct endpoint with note data', async () => {
      // Arrange
      localStorage.setItem('accessToken', 'valid-token');
      const noteData = { id: 'note-123', title: 'Updated Title', content: 'Updated Content' };
      const mockResponse = {
        success: true,
        message: 'Note updated',
        data: { ...noteData, createdAt: '2024-01-01', updatedAt: '2024-01-02' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // Act
      const result = await notesApi.editNote(noteData);

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/notes/edit-note',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(noteData),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteNote', () => {
    it('should make DELETE request to correct endpoint with note ID', async () => {
      // Arrange
      localStorage.setItem('accessToken', 'valid-token');
      const noteId = 'note-123';
      const mockResponse = {
        success: true,
        message: 'Note deleted',
        data: { id: noteId, title: 'Deleted Note', content: 'Content', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // Act
      const result = await notesApi.deleteNote(noteId);

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:8000/api/v1/notes/delete-note/${noteId}`,
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('searchNotes', () => {
    it('should make GET request to correct endpoint with encoded query', async () => {
      // Arrange
      localStorage.setItem('accessToken', 'valid-token');
      const query = 'test search';
      const mockResponse = {
        success: true,
        message: 'Search results',
        data: [
          { id: '1', title: 'Test Note', content: 'Search content', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // Act
      const result = await notesApi.searchNotes(query);

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:8000/api/v1/notes/search?query=${encodeURIComponent(query)}`,
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should properly encode special characters in query', async () => {
      // Arrange
      localStorage.setItem('accessToken', 'valid-token');
      const query = 'test & special?chars=value';
      const mockResponse = {
        success: true,
        message: 'Search results',
        data: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // Act
      await notesApi.searchNotes(query);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:8000/api/v1/notes/search?query=${encodeURIComponent(query)}`,
        expect.any(Object)
      );
    });
  });

  describe('getTotalNotes', () => {
    it('should make GET request to correct endpoint', async () => {
      // Arrange
      localStorage.setItem('accessToken', 'valid-token');
      const mockResponse = {
        success: true,
        message: 'Total notes count',
        data: { totalNotes: 42 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // Act
      const result = await notesApi.getTotalNotes();

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/notes/get-total-notes',
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual(mockResponse);
      expect(result.data?.totalNotes).toBe(42);
    });
  });
});
