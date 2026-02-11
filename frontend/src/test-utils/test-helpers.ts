import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ReactElement } from 'react';

/**
 * Renders a component wrapped in MemoryRouter for testing
 * Includes React Router v7 future flags to suppress warnings
 * @param component - React component to render
 * @param initialRoute - Initial route path (default: '/')
 */
export const renderWithRouter = (
  component: ReactElement,
  initialRoute = '/'
) => {
  return render(
    <MemoryRouter
      initialEntries={[initialRoute]}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      {component}
    </MemoryRouter>
  );
};

/**
 * Creates a mock API error for testing
 */
export class MockApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Creates a mock localStorage for testing
 */
export const createMockLocalStorage = () => {
  let store: Record<string, string> = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
};

/**
 * Suppresses console errors during tests
 * Useful for testing error scenarios without cluttering test output
 */
export const suppressConsoleError = () => {
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });
};

/**
 * Waits for a specific amount of time (for debounce testing)
 */
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
