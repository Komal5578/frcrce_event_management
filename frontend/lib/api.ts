export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

type Init = Omit<RequestInit, "body"> & { json?: unknown };

/** Fetch the backend through the /api rewrite. Errors carry the backend's plain-language message. */
export async function api<T>(url: string, { json, headers, ...init }: Init = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      credentials: "same-origin",
      ...init,
      headers: { ...(json !== undefined ? { "content-type": "application/json" } : {}), ...headers },
      body: json !== undefined ? JSON.stringify(json) : undefined,
    });
  } catch {
    throw new ApiError("NETWORK", "We could not reach the server. Check your connection and try again.", 0);
  }
  if (!res.ok) {
    let code = "INTERNAL";
    let message = "Something went wrong on our side. Please try again in a moment.";
    try {
      const body = await res.json();
      if (body?.code) code = body.code;
      if (body?.message) message = body.message;
      else if (Array.isArray(body?.detail)) {
        code = "INVALID_INPUT";
        message = "Some details are missing or not valid. Check the form and try again.";
      }
    } catch {}
    throw new ApiError(code, message, res.status);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const fetcher = <T,>(url: string) => api<T>(url);

export const errText = (e: unknown) =>
  e instanceof ApiError ? e.message : "Something went wrong. Please try again.";
