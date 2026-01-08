import type { ApiError } from './types.js';

export class ApiClientError extends Error {
  constructor(
    public statusCode: number,
    public error: ApiError
  ) {
    super(error.message);
    this.name = 'ApiClientError';
  }
}

export class ApiClient {
  constructor(private baseUrl: string) {}

  private async fetch<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    // Only set Content-Type if there's a body
    const headers: Record<string, string> = {};
    if (options?.body) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error: { error: ApiError } = await response.json();
      throw new ApiClientError(response.status, error.error);
    }

    // Handle empty responses (e.g., 204 No Content)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return undefined as T;
    }

    return response.json();
  }

  protected get<T>(endpoint: string): Promise<T> {
    return this.fetch<T>(endpoint, { method: 'GET' });
  }

  protected post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.fetch<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  protected patch<T>(endpoint: string, body: unknown): Promise<T> {
    return this.fetch<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  protected delete<T>(endpoint: string): Promise<T> {
    return this.fetch<T>(endpoint, { method: 'DELETE' });
  }
}
