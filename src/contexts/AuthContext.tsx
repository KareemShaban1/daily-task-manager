import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';

interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  timezone: string;
  emailVerified: boolean;
  subscriptionTier: string;
  subscriptionStatus: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    timezone?: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (data: {
    firstName?: string;
    lastName?: string;
    timezone?: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const profile = await api.getProfile();
      setUser(profile);
    } catch (error) {
      setUser(null);
      api.setToken(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        api.setToken(token);
        await refreshUser();
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.login({ email, password });
    setUser(response.user);
  };

  const signup = async (data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    timezone?: string;
  }) => {
    const response = await api.signup(data);
    setUser(response.user);
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  const updateProfile = async (data: {
    firstName?: string;
    lastName?: string;
    timezone?: string;
  }) => {
    const updatedUser = await api.updateProfile(data);
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, logout, refreshUser, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

