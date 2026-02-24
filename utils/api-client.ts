type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ApiOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  token?: string;
}

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

/**
 * Typed fetch wrapper for API calls
 */
export async function apiClient<T = unknown>(
  url: string,
  options: ApiOptions = {}
): Promise<ApiResponse<T>> {
  const { method = "GET", body, headers = {}, token } = options;

  const config: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };

  if (body && method !== "GET") {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);
    const data = response.ok ? await response.json() : null;
    const error = response.ok
      ? null
      : (await response.json().catch(() => ({ message: "Request failed" }))).message;

    return { data: data as T, error, status: response.status };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Network error",
      status: 0,
    };
  }
}
