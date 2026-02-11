import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { tokenUtils } from '../../utils/api';

// Mock the tokenUtils
jest.mock('../../utils/api', () => ({
  tokenUtils: {
    isAuthenticated: jest.fn(),
  },
}));

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns authenticated state when token exists', () => {
    (tokenUtils.isAuthenticated as jest.Mock).mockReturnValue(true);

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(true);
  });

  it('returns unauthenticated state when token does not exist', () => {
    (tokenUtils.isAuthenticated as jest.Mock).mockReturnValue(false);

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(false);
  });

  it('updates authentication state when storage changes', () => {
    (tokenUtils.isAuthenticated as jest.Mock).mockReturnValue(false);

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(false);

    // Simulate token being added
    (tokenUtils.isAuthenticated as jest.Mock).mockReturnValue(true);

    // Trigger storage event
    act(() => {
      window.dispatchEvent(new Event('storage'));
    });

    expect(result.current.isAuthenticated).toBe(true);
  });

  it('cleans up event listener on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    (tokenUtils.isAuthenticated as jest.Mock).mockReturnValue(true);

    const { unmount } = renderHook(() => useAuth());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function));
  });
});
