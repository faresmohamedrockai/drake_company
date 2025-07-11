import React, { createContext, useContext, useState, useEffect } from 'react';
import { useData } from './DataContext';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Sales Admin' | 'Team Leader' | 'Sales Rep';
  teamId?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demonstration
const mockUsers: User[] = [
  { id: '1', name: 'Abdullah Sobhy', email: 'admin@propai.com', role: 'Admin' },
  { id: '2', name: 'fadel', email: 'fadel@propai.com', role: 'Admin' },
  { id: '3', name: 'Sales Manager', email: 'sales@propai.com', role: 'Sales Admin' },
  { id: '4', name: 'Team Lead', email: 'team@propai.com', role: 'Team Leader', teamId: 'team1' },
  { id: '5', name: 'Sales Rep', email: 'rep@propai.com', role: 'Sales Rep', teamId: 'team1' }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const dataContext = useData();

  useEffect(() => {
    const savedUser = localStorage.getItem('propai_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  // Listen for changes to the current user's data in DataContext or localStorage
  useEffect(() => {
    if (!user || !dataContext) return;
    // Find the latest user data by id
    const updatedUser = dataContext.users.find(u => u.id === user.id);
    if (updatedUser) {
      setUser(prev => {
        // Only update if something actually changed
        if (JSON.stringify(prev) !== JSON.stringify(updatedUser)) {
          localStorage.setItem('propai_user', JSON.stringify(updatedUser));
          return updatedUser;
        }
        return prev;
      });
    }
  }, [dataContext?.users, user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Check against users from DataContext
    const foundUser = dataContext?.users.find(u => 
      (u.email === email || u.username === email) && u.password === password && u.isActive
    );
    if (foundUser) {
      setUser(foundUser);
      setIsAuthenticated(true);
      localStorage.setItem('propai_user', JSON.stringify(foundUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('propai_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
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