import React, { createContext, useContext, useState } from 'react';
import Cookies from 'js-cookie';
import type { User } from '../types';

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



  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`http://localhost:3000/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok || !data.ok) throw new Error(data.message || "Login failed");

      Cookies.set('access_token', data.access_token, { expires: 1 }); // صلاحية 1 يوم

      // Cookies.set('refresh_token', data.refresh_token, { expires: 29 }); // صلاحية 7 أيام
      const TherAccess = Cookies.get("access_token")
      
      if (TherAccess) {
        setUser(data.user);
        setIsAuthenticated(true);
        
      }
      
      return true;

    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user?.id }), // إرسال userId مع الطلب
      });

      setUser(null);
      setIsAuthenticated(false);

      console.log('has removed successfully');
      

 
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };













































  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
