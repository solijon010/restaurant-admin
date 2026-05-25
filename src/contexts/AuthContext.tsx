import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AuthData, AuthUser, getAuth, saveAuth, clearAuth, extractUserFromResponse, UserRole } from '@/lib/auth';
import { authService } from '@/services/authService';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const defaultValue: AuthContextType = {
  user: null,
  isAuthenticated: false,
  login: async () => ({ success: false, error: 'AuthProvider not mounted' }),
  logout: () => {},
};

const AuthContext = createContext<AuthContextType>(defaultValue);

// Demo users for offline/testing fallback
const DEMO_USERS: Record<string, { password: string; response: Parameters<typeof extractUserFromResponse>[0] }> = {
  '+998901234567': {
    password: 'admin123',
    response: {
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InUxIiwicm9sZSI6IlNVUEVSQURNSU4iLCJicmFuY2hJZCI6bnVsbCwiY29tcGFueUlkIjoiYzEiLCJpYXQiOjE3NzEwMTE1ODYsImV4cCI6MTc3OTY1MTU4Nn0.fake',
      refreshToken: 'refresh_token_superadmin',
      user: { id: 'u1', firstName: 'Muhammadrioz', lastName: 'Daminboev', role: 'SUPERADMIN' as UserRole },
    },
  },
  '+998901234568': {
    password: 'manager123',
    response: {
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InUyIiwicm9sZSI6Ik1BTkFHRVIiLCJicmFuY2hJZCI6ImIxIiwiY29tcGFueUlkIjoiYzEiLCJpYXQiOjE3NzEwMTE1ODYsImV4cCI6MTc3OTY1MTU4Nn0.fake',
      refreshToken: 'refresh_token_manager',
      user: { id: 'u2', firstName: 'Aziz', lastName: 'Rahimov', role: 'MANAGER' as UserRole },
    },
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authData, setAuthData] = useState<AuthData | null>(getAuth);

  const login = useCallback(async (phone: string, password: string) => {
    try {
      // Try real API first
      const response = await authService.login({ identifier: phone, password });
      const data = extractUserFromResponse(response.data as Parameters<typeof extractUserFromResponse>[0]);
      saveAuth(data);
      setAuthData(data);
      return { success: true };
    } catch (apiError: any) {
      // If API is unavailable, fall back to demo users
      const demo = DEMO_USERS[phone];
      if (demo && demo.password === password) {
        const data = extractUserFromResponse(demo.response);
        saveAuth(data);
        setAuthData(data);
        return { success: true };
      }

      const message = apiError?.response?.data?.message || 'Telefon raqam yoki parol noto\'g\'ri';
      return { success: false, error: typeof message === 'string' ? message : 'Xatolik yuz berdi' };
    }
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setAuthData(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user: authData?.user ?? null,
      isAuthenticated: !!authData,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
