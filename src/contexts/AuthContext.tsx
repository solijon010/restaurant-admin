import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AuthData, AuthUser, getAuth, saveAuth, clearAuth, extractUserFromResponse } from '@/lib/auth';
import { authService } from '@/services/authService';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
  logout: () => void;
  updateUser: (patch: Partial<AuthUser>) => void;
}

const defaultValue: AuthContextType = {
  user: null,
  isAuthenticated: false,
  login: async () => ({ success: false, error: 'AuthProvider not mounted' }),
  logout: () => {},
  updateUser: () => {},
};

const AuthContext = createContext<AuthContextType>(defaultValue);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authData, setAuthData] = useState<AuthData | null>(getAuth);

  const login = useCallback(async (phone: string, password: string) => {
    try {
      const response = await authService.login({ identifier: phone, password });
      const data = extractUserFromResponse(response.data as Parameters<typeof extractUserFromResponse>[0]);
      saveAuth(data);
      setAuthData(data);
      return { success: true, user: data.user };
    } catch (apiError: unknown) {
      const message = (apiError as { response?: { data?: { message?: unknown } } })?.response?.data?.message || 'Telefon raqam yoki parol noto\'g\'ri';
      return { success: false, error: typeof message === 'string' ? message : 'Xatolik yuz berdi' };
    }
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setAuthData(null);
  }, []);

  const updateUser = useCallback((patch: Partial<AuthUser>) => {
    setAuthData((current) => {
      if (!current) return current;
      const next: AuthData = {
        ...current,
        user: {
          ...current.user,
          ...patch,
        },
      };
      saveAuth(next);
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{
      user: authData?.user ?? null,
      isAuthenticated: !!authData,
      login,
      logout,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
