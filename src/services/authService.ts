import api from '@/lib/api';

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export const authService = {
  login: (data: LoginPayload) =>
    api.post<LoginResponse>('/auth/login', data),
};
