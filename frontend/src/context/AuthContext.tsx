import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LoginCredentials } from '@/types/auth';
import { loginUser, getCurrentUserProfile } from '@/services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('gramai_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('gramai_token');
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const handleAuthChange = () => {
      const currentToken = localStorage.getItem('gramai_token');
      const currentUser = localStorage.getItem('gramai_user');
      setToken(currentToken);
      try {
        setUser(currentUser ? JSON.parse(currentUser) : null);
      } catch {
        setUser(null);
      }
    };

    window.addEventListener('gramai_auth_change', handleAuthChange);
    return () => window.removeEventListener('gramai_auth_change', handleAuthChange);
  }, []);

  useEffect(() => {
    const verifySession = async () => {
      if (token) {
        try {
          const profile = await getCurrentUserProfile();
          setUser(profile);
          localStorage.setItem('gramai_user', JSON.stringify(profile));
        } catch {
          // Token is expired or invalid
          localStorage.removeItem('gramai_token');
          localStorage.removeItem('gramai_user');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    verifySession();
  }, [token]);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await loginUser(credentials);
      localStorage.setItem('gramai_token', response.token);
      localStorage.setItem('gramai_user', JSON.stringify(response.user));
      setToken(response.token);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('gramai_token');
    localStorage.removeItem('gramai_user');
    setToken(null);
    setUser(null);
    window.dispatchEvent(new Event('gramai_auth_change'));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
