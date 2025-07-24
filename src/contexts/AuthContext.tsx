import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInterceptor from '../../axiosInterceptor/axiosInterceptor';
import { toast } from 'react-toastify';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'sales_admin' | 'team_leader' | 'sales_rep' | 'sales_manager';
  teamId?: string;
  image?: string | null;

}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
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
    try {
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
    } catch (error: any) {
      toast.error(error.response.data.message);
      console.error('Error logging in:', error);
      return false;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    
    // Clear authentication-related data
    localStorage.removeItem('propai_user');
    localStorage.removeItem('token');
    
    // Clear user-specific performance and stats data
    localStorage.removeItem('propai_dashboard_stats');
    localStorage.removeItem('leads_kpi_stats');
    
    // Clear notification data
    localStorage.removeItem('propai_notification_history');
    localStorage.removeItem('propai_notification_settings');
    
    // Clear any other performance/KPI keys that might exist
    // These are generated dynamically in various components
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('_performance_') || 
        key.includes('_kpi_') || 
        key.includes('meeting_performance_') ||
        key.startsWith('property_views_')
      )) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Refresh the system to ensure clean state
    window.location.reload();
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