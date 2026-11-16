import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loginAdmin, logoutAdmin, getAdminMe, AdminUser, LoginResponse } from '../api/admin';

interface AuthContextType {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<LoginResponse>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check auth session on initial load against backend /api/auth/me
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        // If neither token nor cookie exists, definitely unauthenticated
        if (!token && !document.cookie.includes('adminToken')) {
          setAdmin(null);
          localStorage.removeItem('adminUser');
          setLoading(false);
          return;
        }

        const res = await getAdminMe();
        if (res.success && res.admin && res.admin.id) {
          setAdmin(res.admin);
          localStorage.setItem('adminUser', JSON.stringify(res.admin));
        } else {
          setAdmin(null);
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
        }
      } catch (err) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        setAdmin(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (credentials: { email: string; password: string }): Promise<LoginResponse> => {
    const res = await loginAdmin(credentials);
    if (res.success) {
      if (res.token) {
        localStorage.setItem('adminToken', res.token);
      }
      localStorage.setItem('adminUser', JSON.stringify(res.admin));
      setAdmin(res.admin);
    }
    return res;
  };

  const logout = async (): Promise<void> => {
    try {
      await logoutAdmin();
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      setAdmin(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        isAuthenticated: Boolean(admin),
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
