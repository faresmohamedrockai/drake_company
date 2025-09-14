// --- START OF FILE: AuthContext.tsx ---

import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInterceptor from '../../axiosInterceptor/axiosInterceptor';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie'; // 1. استيراد مكتبة js-cookie

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'sales_admin' | 'team_leader' | 'sales_rep' | 'sales_manager';
  teamId?: string;
  teamLeaderId?: string | null;
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
    try {
      const foundUser = await axiosInterceptor.post('/auth/login', { email, password });
      if (foundUser.data.user) {
        setUser(foundUser.data.user);
        setIsAuthenticated(true);

       
        Cookies.set('token', foundUser.data.access_token, { expires: 30, secure: true, sameSite: 'strict' });
        
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
    
 
    Cookies.remove('token');
    
    // مسح باقي البيانات من localStorage
    localStorage.removeItem('propai_user');
    localStorage.removeItem('propai_dashboard_stats');
    localStorage.removeItem('leads_kpi_stats');
    localStorage.removeItem('propai_notification_history');
    localStorage.removeItem('propai_notification_settings');
    
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
    
    // 4. تم حذف window.location.reload()، سيتولى المعترض (interceptor) عملية التوجيه
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