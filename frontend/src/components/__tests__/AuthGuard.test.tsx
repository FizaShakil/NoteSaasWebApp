import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AuthGuard from '../AuthGuard';
import { useAuth } from '../../hooks/useAuth';

jest.mock('../../hooks/useAuth');

const MockProtectedContent = () => <div>Protected Content</div>;
const MockLoginPage = () => <div>Login Page</div>;

const renderWithRouter = (component: React.ReactElement, initialRoute = '/protected', isAuthenticated = true) => {
  (useAuth as jest.Mock).mockReturnValue({ isAuthenticated });

  return render(
    <MemoryRouter
      initialEntries={[initialRoute]}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/login" element={<MockLoginPage />} />
        <Route path="/protected" element={component} />
      </Routes>
    </MemoryRouter>
  );
};

describe('AuthGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('access with valid auth', () => {
    it('should render protected content when user is authenticated', async () => {
      renderWithRouter(
        <AuthGuard>
          <MockProtectedContent />
        </AuthGuard>,
        '/protected',
        true
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });

    it('should render multiple children when authenticated', async () => {
      renderWithRouter(
        <AuthGuard>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </AuthGuard>,
        '/protected',
        true
      );

      await waitFor(() => {
        expect(screen.getByText('Child 1')).toBeInTheDocument();
        expect(screen.getByText('Child 2')).toBeInTheDocument();
        expect(screen.getByText('Child 3')).toBeInTheDocument();
      });
    });

    it('should render complex nested children when authenticated', async () => {
      renderWithRouter(
        <AuthGuard>
          <div>
            <h1>Dashboard</h1>
            <p>Welcome back!</p>
          </div>
        </AuthGuard>,
        '/protected',
        true
      );

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Welcome back!')).toBeInTheDocument();
      });
    });
  });

  describe('redirect when unauthenticated', () => {
    it('should redirect to login page when user is not authenticated', async () => {
      renderWithRouter(
        <AuthGuard>
          <MockProtectedContent />
        </AuthGuard>,
        '/protected',
        false
      );

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
    });

    it('should not render protected content when user is not authenticated', async () => {
      renderWithRouter(
        <AuthGuard>
          <MockProtectedContent />
        </AuthGuard>,
        '/protected',
        false
      );

      await waitFor(() => {
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
    });

    it('should redirect from any protected route when unauthenticated', async () => {
      renderWithRouter(
        <AuthGuard>
          <div>Secret Dashboard</div>
        </AuthGuard>,
        '/protected',
        false
      );

      await waitFor(() => {
        expect(screen.queryByText('Secret Dashboard')).not.toBeInTheDocument();
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
    });
  });

  describe('protected route behavior', () => {
    it('should allow access to protected route when authenticated', async () => {
      renderWithRouter(
        <AuthGuard>
          <MockProtectedContent />
        </AuthGuard>,
        '/protected',
        true
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });

    it('should block access to protected route when not authenticated', async () => {
      renderWithRouter(
        <AuthGuard>
          <MockProtectedContent />
        </AuthGuard>,
        '/protected',
        false
      );

      await waitFor(() => {
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
    });

    it('should check authentication status on mount', async () => {
      renderWithRouter(
        <AuthGuard>
          <MockProtectedContent />
        </AuthGuard>,
        '/protected',
        true
      );

      await waitFor(() => {
        expect(useAuth).toHaveBeenCalled();
      });
    });
  });

  describe('mock authentication state', () => {
    it('should respect mocked authenticated state', async () => {
      renderWithRouter(
        <AuthGuard>
          <MockProtectedContent />
        </AuthGuard>,
        '/protected',
        true
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });

    it('should respect mocked unauthenticated state', async () => {
      renderWithRouter(
        <AuthGuard>
          <MockProtectedContent />
        </AuthGuard>,
        '/protected',
        false
      );

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
    });

    it('should handle authentication state changes between tests', async () => {
      // First test - authenticated
      const { unmount } = renderWithRouter(
        <AuthGuard>
          <MockProtectedContent />
        </AuthGuard>,
        '/protected',
        true
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });

      unmount();

      // Second test - unauthenticated
      renderWithRouter(
        <AuthGuard>
          <MockProtectedContent />
        </AuthGuard>,
        '/protected',
        false
      );

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
    });
  });
});
