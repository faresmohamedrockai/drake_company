import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInterceptor from '../../axiosInterceptor/axiosInterceptor';
import { toast } from 'react-toastify';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'sales_admin' | 'team_leader' | 'sales_rep';
  teamId?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
      const savedUser = localStorage.getItem('propai_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
      }
    }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simple authentication logic - you can replace this with your actual auth logic
    // For now, we'll use a simple check against mock users
    const foundUser = await axiosInterceptor.post('/auth/login', { email, password });
    if (foundUser.data.user) {
      // In a real app, you would verify the password here
      // For demo purposes, we'll accept any user from the mock list
      setUser(foundUser.data.user);
      setIsAuthenticated(true);
      localStorage.setItem('token', foundUser.data.access_token);
      localStorage.setItem('propai_user', JSON.stringify(foundUser.data.user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('propai_user');
  };

  const checkAuth = async () => {
    try {
      const response = await axiosInterceptor.get('/auth/check');
      if (response.data.status === 200) {
        setIsAuthenticated(true);
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, checkAuth }}>
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