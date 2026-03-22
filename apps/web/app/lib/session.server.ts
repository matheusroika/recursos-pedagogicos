import { redirect } from "@remix-run/node";
import { apiFetch } from "./api.server";

export async function getSessionUser(request: Request) {
  const res = await apiFetch("/api/auth/session", undefined, request);
  if (!res.ok) return null;
  const data = await res.json();
  return data.user || null;
}

export async function requireUser(request: Request) {
  const user = await getSessionUser(request);
  if (!user) throw redirect("/login");
  return user;
}

export async function login(email: string, password: string) {
  return apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export async function logout(request: Request) {
  return apiFetch("/api/auth/logout", { method: "POST" }, request);
}
