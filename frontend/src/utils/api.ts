const API_BASE_URL = 'http://localhost:8000/api/v1';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

interface LoginData {
  email: string;
  password: string;
}

interface SignupData {
  name: string;
  email: string;
  password: string;
}

interface UserData {
  id: string;
  email: string;
  name?: string;
  createdAt?: string;
}

interface Note {
  id: string;
  title?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateNoteData {
  title?: string;
  content: string;
}

interface EditNoteData {
  id: string;
  title?: string;
  content: string;
}

class ApiError extends Error {
  status: number;
  
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// Token management
const TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

const getAccessToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

const setTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

const clearTokens = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  try {
    const token = getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add Bearer token for authenticated requests
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers,
      credentials: 'include', // Keep cookies for additional security
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      // If token is expired or invalid, clear tokens
      if (response.status === 401 || response.status === 403) {
        clearTokens();
      }
      throw new ApiError(response.status, data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Network error. Please try again.');
  }
};

export const authApi = {
  login: async (credentials: LoginData): Promise<ApiResponse<{ user: UserData; accessToken: string; refreshToken: string }>> => {
    const response = await apiCall<{ user: UserData; accessToken: string; refreshToken: string }>('/users/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Store tokens after successful login
    if (response.data?.accessToken && response.data?.refreshToken) {
      setTokens(response.data.accessToken, response.data.refreshToken);
    }

    return response;
  },

  signup: async (userData: SignupData): Promise<ApiResponse> => {
    return apiCall('/users/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  forgotPassword: async (email: string): Promise<ApiResponse> => {
    return apiCall('/users/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (token: string, newPassword: string): Promise<ApiResponse> => {
    return apiCall('/users/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },

  changeUserDetails: async (data: { email?: string; name?: string; oldPassword?: string; newPassword?: string }): Promise<ApiResponse> => {
    return apiCall('/users/change-user-details', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  getUserDetails: async (): Promise<ApiResponse<UserData>> => {
    return apiCall('/users/get-user-details', {
      method: 'GET',
    });
  },

  logout: async (): Promise<ApiResponse> => {
    try {
      const response = await apiCall('/users/logout', {
        method: 'POST',
      });
      // Clear tokens after successful logout
      clearTokens();
      return response;
    } catch (error) {
      // Clear tokens even if logout fails
      clearTokens();
      throw error;
    }
  },
};

export const notesApi = {
  getAllNotes: async (): Promise<ApiResponse<Note[]>> => {
    return apiCall('/notes/get-notes', {
      method: 'GET',
    });
  },

  getSingleNote: async (id: string): Promise<ApiResponse<Note>> => {
    return apiCall(`/notes/get-note/${id}`, {
      method: 'GET',
    });
  },

  createNote: async (noteData: CreateNoteData): Promise<ApiResponse<Note>> => {
    return apiCall('/notes/create-note', {
      method: 'POST',
      body: JSON.stringify(noteData),
    });
  },

  editNote: async (noteData: EditNoteData): Promise<ApiResponse<Note>> => {
    return apiCall('/notes/edit-note', {
      method: 'PATCH',
      body: JSON.stringify(noteData),
    });
  },

  deleteNote: async (id: string): Promise<ApiResponse<Note>> => {
    return apiCall(`/notes/delete-note/${id}`, {
      method: 'DELETE',
    });
  },

  searchNotes: async (query: string): Promise<ApiResponse<Note[]>> => {
    return apiCall(`/notes/search?query=${encodeURIComponent(query)}`, {
      method: 'GET',
    });
  },

  getTotalNotes: async (): Promise<ApiResponse<{ totalNotes: number }>> => {
    return apiCall('/notes/get-total-notes', {
      method: 'GET',
    });
  },
};

// Utility functions for token management
export const tokenUtils = {
  getAccessToken,
  setTokens,
  clearTokens,
  isAuthenticated: (): boolean => {
    return !!getAccessToken();
  },
};

export { ApiError };
export type { ApiResponse, LoginData, SignupData, UserData, Note, CreateNoteData, EditNoteData };