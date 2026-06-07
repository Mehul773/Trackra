import React, { createContext, useState, useEffect, useContext } from 'react';
import { User } from '../types';
import * as authService from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: () => void;
  logout: () => Promise<void>;
  setTokenAndUser: (token: string, user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize auth state: check if token exists and verify it
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('trackra_token');
      if (token) {
        try {
          const profile = await authService.getMe();
          setUser(profile);
        } catch (error) {
          console.error('Session verification failed, logging out:', error);
          localStorage.removeItem('trackra_token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = () => {
    authService.loginWithGoogle();
  };

  const logout = async () => {
    setLoading(true);
    await authService.logout();
    setUser(null);
    setLoading(false);
  };

  const setTokenAndUser = (token: string, userData: User) => {
    localStorage.setItem('trackra_token', token);
    setUser(userData);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        logout,
        setTokenAndUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
