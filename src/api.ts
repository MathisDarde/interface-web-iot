export const API_URL: string =
  import.meta.env.VITE_API_URL ?? "http://localhost:3001";

type JsonValue = unknown;

function getAuthToken() {
  return localStorage.getItem("auth_token");
}

export async function getJson<TResponse>(
  path: string,
  params?: Record<string, string | number | undefined>,
  options?: { auth?: boolean },
): Promise<TResponse> {
  const url = new URL(`${API_URL}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;
      url.searchParams.set(key, String(value));
    }
  }

  const headers: Record<string, string> = {};
  if (options?.auth) {
    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers,
  });

  const data = (await res.json().catch(() => null)) as unknown;

  if (!res.ok) {
    const message =
      typeof data === "object" && data !== null && "error" in data
        ? String((data as any).error)
        : `HTTP_${res.status}`;
    throw new Error(message);
  }

  return data as TResponse;
}

export async function postJson<TResponse>(
  path: string,
  body: JsonValue,
  options?: { auth?: boolean },
): Promise<TResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options?.auth) {
    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => null)) as unknown;

  if (!res.ok) {
    const message =
      typeof data === "object" && data !== null && "error" in data
        ? String((data as any).error)
        : `HTTP_${res.status}`;
    throw new Error(message);
  }

  return data as TResponse;
}

export async function patchJson<TResponse>(
  path: string,
  body: JsonValue,
  options?: { auth?: boolean },
): Promise<TResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options?.auth) {
    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => null)) as unknown;

  if (!res.ok) {
    const message =
      typeof data === "object" && data !== null && "error" in data
        ? String((data as any).error)
        : `HTTP_${res.status}`;
    throw new Error(message);
  }

  return data as TResponse;
}

export async function deleteJson(
  path: string,
  options?: { auth?: boolean },
): Promise<void> {
  const headers: Record<string, string> = {};

  if (options?.auth) {
    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: "DELETE",
    headers,
  });

  if (res.status === 204) return;

  const data = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const message =
      typeof data === "object" && data !== null && "error" in data
        ? String((data as any).error)
        : `HTTP_${res.status}`;
    throw new Error(message);
  }
}
