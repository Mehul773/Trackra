import api from './api';
import { ApiResponse, User } from '../types';

/**
 * Authentication Service.
 * Coordinates auth-related API requests with our backend.
 */

/**
 * Fetch the currently logged-in user profile.
 */
export const getMe = async (): Promise<User> => {
  const response = await api.get<ApiResponse<User>>('/auth/me');
  return response.data.data;
};

/**
 * Trigger Google OAuth redirection.
 * In production, we navigate directly to the backend OAuth initialization URL.
 */
export const loginWithGoogle = (): void => {
  const apiBase = (import.meta.env['VITE_API_URL'] as string) || 'http://localhost:3000/api';
  window.location.href = `${apiBase}/auth/google`;
};

/**
 * Log out from the application by calling backend (for completeness)
 * and clearing the local state.
 */
export const logout = async (): Promise<void> => {
  try {
    await api.post<ApiResponse<null>>('/auth/logout');
  } catch (error) {
    console.error('Logout request failed:', error);
  } finally {
    localStorage.removeItem('trackra_token');
  }
};
