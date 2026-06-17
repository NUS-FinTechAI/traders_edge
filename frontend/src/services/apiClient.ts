import { auth } from './firebase';

const resolveApiBase = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim().length > 0) return envUrl;
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:8000`;
  }
  return 'http://localhost:8000';
};

export class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string = resolveApiBase()) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  // The Firebase SDK auto-refreshes ID tokens (1h TTL); we pull a fresh one
  // per-request so handlers downstream never see a stale token. If a request
  // 401s anyway we force-refresh and retry once.
  private async getAuthToken(forceRefresh = false): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;
    return user.getIdToken(forceRefresh);
  }

  private async request<T>(
    endpointOrUrl: string,
    options: RequestInit,
    forceRefresh = false,
  ): Promise<T> {
    const isAbsolute = /^(https?:)?\/\//i.test(endpointOrUrl);
    const url = isAbsolute ? endpointOrUrl : `${this.baseURL}${endpointOrUrl}`;
    const token = await this.getAuthToken(forceRefresh);

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);

    // One retry path for stale-token races: if we had a token and the server
    // said 401, fetch a fresh token (force=true) and retry once.
    if (response.status === 401 && token && !forceRefresh) {
      return this.request<T>(endpointOrUrl, options, true);
    }

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        (data && (data.message || data.error || data.detail)) ||
        `Request failed (${response.status})`;
      const err = new Error(message) as Error & { status?: number };
      err.status = response.status;
      throw err;
    }
    return data as T;
  }

  async getJson<T>(endpointOrUrl: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpointOrUrl, { method: 'GET', ...options });
  }

  async postJson<T>(endpointOrUrl: string, data?: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpointOrUrl, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  async putJson<T>(endpointOrUrl: string, data?: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpointOrUrl, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }
}

export const apiClient = new ApiClient();
