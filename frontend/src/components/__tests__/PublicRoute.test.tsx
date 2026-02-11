import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PublicRoute from '../PublicRoute';
import { useAuth } from '../../hooks/useAuth';

// Mock the useAuth hook
jest.mock('../../hooks/useAuth');

const MockLoginPage = () => <div>Login Page</div>;
const MockDashboard = () => <div>Dashboard Page</div>;

const renderPublicRoute = (isAuthenticated: boolean, initialRoute = '/login') => {
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
        <Route
          path="/login"
          element={
            <PublicRoute>
              <MockLoginPage />
            </PublicRoute>
          }
        />
        <Route path="/dashboard" element={<MockDashboard />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('PublicRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when user is not authenticated', () => {
    renderPublicRoute(false);

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('redirects to dashboard when user is authenticated', () => {
    renderPublicRoute(true);

    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });

  it('prevents authenticated users from accessing login page', () => {
    renderPublicRoute(true, '/login');

    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });
});
