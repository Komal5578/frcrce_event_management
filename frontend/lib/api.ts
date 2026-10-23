import { DomainError, type ErrorCode } from "./errors";

export class ApiError extends DomainError {
  public status: number;

  constructor(code: ErrorCode, message: string, status: number) {
    super(code, message);
    this.name = "ApiError";
    this.status = status;
  }
}

export type ApiClientOptions = RequestInit;

/**
 * Isomorphic typed API client.
 * Forwards cookies in Server Components / Actions and standardizes error responses.
 */
export async function apiClient<T>(endpoint: string, options: ApiClientOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  // Forward cookies in server environment
  if (typeof window === "undefined") {
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      const cookieHeader = cookieStore.toString();
      if (cookieHeader && !headers.has("cookie")) {
        headers.set("cookie", cookieHeader);
      }
    } catch {
      // Outside Next.js request context (e.g. tests or build scripts)
    }
  }

  // Determine target URL
  let url = endpoint;
  if (!endpoint.startsWith("http://") && !endpoint.startsWith("https://")) {
    const apiBase = typeof window === "undefined" ? (process.env.API_URL || "http://127.0.0.1:8000") : "";
    if (endpoint.startsWith("/api")) {
      url = `${apiBase}${endpoint}`;
    } else {
      url = `${apiBase}/api${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
    }
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errBody: { code?: string; message?: string; detail?: unknown } = {};
    try {
      errBody = await res.json();
    } catch {
      // fallback
    }

    const code = (errBody.code || "INTERNAL") as ErrorCode;
    const message =
      errBody.message ||
      (typeof errBody.detail === "string" ? errBody.detail : res.statusText || "Request failed");
    throw new ApiError(code, message, res.status);
  }

  if (res.status === 204) {
    return undefined as unknown as T;
  }

  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return (await res.json()) as T;
  }

  return (await res.text()) as unknown as T;
}
