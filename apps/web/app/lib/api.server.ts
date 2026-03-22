const API_URL = process.env.API_URL || "http://localhost:3001";

export async function apiFetch(path: string, init?: RequestInit, request?: Request) {
  const headers = new Headers(init?.headers || {});
  if (request?.headers.get("cookie")) {
    headers.set("cookie", request.headers.get("cookie")!);
  }
  if (!headers.get("content-type") && init?.body) {
    headers.set("content-type", "application/json");
  }

  return fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    redirect: "manual"
  });
}
