import { QueryClient, QueryFunction } from "@tanstack/react-query";

/**
 * Gets the base URL for the Express API server
 */
export function getApiUrl(): string {
  // Always use the live Render URL so it works on phone hotspot without laptop server
  return "https://quick-order-server-y11j.onrender.com";
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = `${baseUrl}${route}`;

  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn = <T>(
    options: { on401: UnauthorizedBehavior }
): QueryFunction<T> => async ({ queryKey }) => {
    const baseUrl = getApiUrl();
    const url = `${baseUrl}/${queryKey.join("/")}`;

    const res = await fetch(url, {
        credentials: "include",
    });

    if (options.on401 === "returnNull" && res.status === 401) {
        return null;
    }

    await throwIfResNotOk(res);
    return res.json();
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 0,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
