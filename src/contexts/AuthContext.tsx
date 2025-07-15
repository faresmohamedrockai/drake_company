import React, { createContext, useContext, useState, useEffect } from 'react';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demonstration - moved here to avoid circular dependency
const mockUsers: User[] = [
  { id: '1', name: 'Abdullah Sobhy', email: 'admin@propai.com', role: 'admin' },
  { id: '2', name: 'Hassan Rageh', email: 'hassan@propai.com', role: 'admin' },
  { id: '3', name: 'Sales Manager', email: 'sales@propai.com', role: 'sales_admin' },
  { id: '4', name: 'Team Lead', email: 'team@propai.com', role: 'team_leader', teamId: 'team1' },
  { id: '5', name: 'Sales Rep', email: 'rep@propai.com', role: 'sales_rep', teamId: 'team1' }
];

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
    const foundUser = mockUsers.find(u => u.email === email);
    
    if (foundUser) {
      // In a real app, you would verify the password here
      // For demo purposes, we'll accept any user from the mock list
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