export type UserRole = 'SUPERADMIN' | 'MANAGER' | 'AFITSANT' | 'SUPER_AFITSANT' | 'CHEF' | 'KASSA';

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  companyId: string | null;
  branchId: string | null;
}

export interface AuthData {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

const AUTH_KEY = 'rms_auth';

export function saveAuth(data: AuthData): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(data));
}

export function getAuth(): AuthData | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  localStorage.removeItem(AUTH_KEY);
}

export function getAccessToken(): string | null {
  return getAuth()?.accessToken ?? null;
}

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export function extractUserFromResponse(response: {
  accessToken: string;
  refreshToken: string;
  user: { id: string; firstName: string; lastName: string; role: UserRole };
}): AuthData {
  const payload = parseJwtPayload(response.accessToken);
  return {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    user: {
      id: response.user.id,
      firstName: response.user.firstName,
      lastName: response.user.lastName,
      role: response.user.role,
      companyId: (payload?.companyId as string) ?? null,
      branchId: (payload?.branchId as string) ?? null,
    },
  };
}

export function getRoleBasePath(role: UserRole): string {
  switch (role) {
    case 'SUPERADMIN': return '/superadmin';
    case 'MANAGER': return '/manager';
    case 'AFITSANT': return '/waiter';
    case 'SUPER_AFITSANT': return '/waiter';
    case 'CHEF': return '/kitchen';
    case 'KASSA': return '/cashier';
    default: return '/login';
  }
}
