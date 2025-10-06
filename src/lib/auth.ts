import type {
  AuthRequest,
  RegisterRequest,
  AuthSuccessResponse,
  ErrorResponse,
  ValidationErrorResponse,
} from '@/types';

const API_BASE_URL = 'http://localhost:3000/api/v1';

class AuthAPI {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw data as ErrorResponse | ValidationErrorResponse;
    }

    return data as T;
  }

  async login(credentials: AuthRequest): Promise<AuthSuccessResponse> {
    return this.request<AuthSuccessResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: RegisterRequest): Promise<AuthSuccessResponse> {
    return this.request<AuthSuccessResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }
}

export const authAPI = new AuthAPI();