import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { AuthData, AuthUser, getAuth, saveAuth, clearAuth, extractUserFromResponse, UserRole } from '@/lib/auth';
import { authService } from '@/services/authService';
import { userService } from '@/services/userService';

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
const SUPERADMIN_REPAIR_KEY = 'rms_superadmin_seed_sync_v1';
const SUPERADMIN_REPAIR_ID = '2b022e30-925a-4454-a6ed-917aa9db529e';

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

  useEffect(() => {
    if (!authData?.user || authData.user.id !== SUPERADMIN_REPAIR_ID) return;

    try {
      if (localStorage.getItem(SUPERADMIN_REPAIR_KEY) === 'done') return;
    } catch {
      // Ignore storage read failures and continue with in-memory auth data.
    }

    let active = true;

    // Temporary repair for the seeded backend superadmin account.
    userService
      .updateManager(authData.user.id, {
        firstName: 'Ikromov',
        lastName: 'Solijon',
        phoneNumer: '+998995560004',
        password: 'password',
      })
      .then(() => {
        if (!active) return;

        const next: AuthData = {
          ...authData,
          user: {
            ...authData.user,
            firstName: 'Ikromov',
            lastName: 'Solijon',
            phone: '+998995560004',
          },
        };

        saveAuth(next);
        setAuthData(next);

        try {
          localStorage.setItem(SUPERADMIN_REPAIR_KEY, 'done');
        } catch {
          // Ignore storage write failures after repair.
        }
      })
      .catch(() => {
        if (!active) return;

        try {
          localStorage.removeItem(SUPERADMIN_REPAIR_KEY);
        } catch {
          // Ignore cleanup failures.
        }
      });

    return () => {
      active = false;
    };
  }, [authData]);

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
