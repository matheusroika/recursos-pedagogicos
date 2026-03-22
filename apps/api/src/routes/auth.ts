import { eq } from "@pkg/db";
import { Hono } from "hono";
import { db, sessions, users } from "@pkg/db";
import { LoginInputSchema } from "@pkg/shared";
import { callBetterAuth } from "../lib/better-auth";

export const authRoutes = new Hono();

function appendSetCookieHeaders(c: { header: (name: string, value: string, options?: { append: boolean }) => void }, response: Response) {
  const getSetCookie = (response.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  const cookies = getSetCookie ? getSetCookie.call(response.headers) : [];

  if (cookies.length > 0) {
    for (const cookie of cookies) {
      c.header("set-cookie", cookie, { append: true });
    }
    return;
  }

  const single = response.headers.get("set-cookie");
  if (single) {
    c.header("set-cookie", single);
  }
}

authRoutes.post("/login", async (c) => {
  const data = await c.req.json();
  const parsed = LoginInputSchema.safeParse(data);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const authResponse = await callBetterAuth(
    "/api/auth/sign-in/email",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: process.env.APP_ORIGIN || "http://localhost:3000"
      },
      body: JSON.stringify({
        email: parsed.data.email,
        password: parsed.data.password,
        rememberMe: true
      })
    },
    c.req.raw.headers
  );

  if (!authResponse.ok) {
    return c.json({ error: "Credenciais invalidas" }, 401);
  }

  appendSetCookieHeaders(c, authResponse);

  const authData = (await authResponse.json()) as {
    token: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };

  const [user] = await db.select().from(users).where(eq(users.id, authData.user.id)).limit(1);
  const [session] = await db.select().from(sessions).where(eq(sessions.token, authData.token)).limit(1);

  if (!user || !session) {
    return c.json({ error: "Falha ao carregar sessao" }, 500);
  }

  return c.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    expiresAt: session.expiresAt.toISOString()
  });
});

authRoutes.post("/logout", async (c) => {
  const authResponse = await callBetterAuth(
    "/api/auth/sign-out",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: process.env.APP_ORIGIN || "http://localhost:3000"
      }
    },
    c.req.raw.headers
  );

  appendSetCookieHeaders(c, authResponse);
  return c.json({ ok: true });
});

authRoutes.get("/session", async (c) => {
  const authResponse = await callBetterAuth("/api/auth/get-session", { method: "GET" }, c.req.raw.headers);
  appendSetCookieHeaders(c, authResponse);

  if (!authResponse.ok) {
    return c.json({ user: null }, 200);
  }

  const payload = (await authResponse.json()) as
    | {
        session: {
          expiresAt: string;
        };
        user: {
          id: string;
        };
      }
    | null;

  if (!payload?.user) {
    return c.json({ user: null }, 200);
  }

  const [user] = await db.select().from(users).where(eq(users.id, payload.user.id)).limit(1);

  if (!user) {
    return c.json({ user: null }, 200);
  }

  return c.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    expiresAt: payload.session.expiresAt
  });
});
