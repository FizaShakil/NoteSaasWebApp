/**
 * Common mock data and functions used across tests
 */

export const mockUser = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  notesCount: 5,
};

export const mockNote = {
  id: 'note-1',
  title: 'Test Note',
  content: '<p>Test content</p>',
  createdAt: new Date('2024-01-01').toISOString(),
  updatedAt: new Date('2024-01-02').toISOString(),
};

export const createMockNotes = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `note-${i + 1}`,
    title: `Test Note ${i + 1}`,
    content: `<p>Content ${i + 1}</p>`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
};

/**
 * Creates a mock navigate function for react-router
 */
export const createMockNavigate = () => jest.fn();

/**
 * Creates mock API responses
 */
export const mockApiResponse = {
  success: <T>(data: T) => ({
    success: true,
    data,
  }),
  error: (message: string) => ({
    success: false,
    error: message,
  }),
};
