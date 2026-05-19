import axios from "axios";

let clientAuthCleared = false;

const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // sends httpOnly refresh-token cookie automatically
});

// ─── Token helpers ────────────────────────────────────────────────────────────

export const getAccessToken = (): string | null =>
  typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

export const saveAccessToken = (token: string): void => {
  clientAuthCleared = false;
  localStorage.setItem("accessToken", token);
};

export const clearAccessToken = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("accessToken");
  }
  delete api.defaults.headers.common.Authorization;
};

export const clearClientAuth = (): void => {
  clientAuthCleared = true;
  clearAccessToken();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth:logout"));
  }
};

// ─── Request interceptor — attach Bearer token ────────────────────────────────

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  else delete config.headers.Authorization;
  // FormData needs multipart/form-data with a boundary set by the browser.
  // The hardcoded application/json default kills that — remove it for FormData.
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

// ─── Response interceptor — silent token refresh on 401 ──────────────────────

let isRefreshing = false;
let queue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = [];

const drainQueue = (token: string | null, error: unknown = null) => {
  queue.forEach((p) => (token ? p.resolve(token) : p.reject(error)));
  queue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    // Don't retry auth endpoints themselves.
    if (
      original.url?.includes("/auth/refresh") ||
      original.url?.includes("/auth/login") ||
      original.url?.includes("/auth/logout")
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => queue.push({ resolve, reject })).then(
        (token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        }
      );
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await api.post<{ accessToken: string }>("/auth/refresh");
      if (clientAuthCleared) {
        throw new Error("Session was cleared while refresh was in progress");
      }
      saveAccessToken(data.accessToken);
      api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
      drainQueue(data.accessToken);
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(original);
    } catch (refreshError) {
      drainQueue(null, refreshError);
      clearClientAuth();
      if (typeof window !== "undefined" && window.location.pathname !== "/signin") {
        window.location.href = "/signin";
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
