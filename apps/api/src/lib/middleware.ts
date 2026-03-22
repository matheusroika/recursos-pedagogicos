import { eq } from "@pkg/db";
import { createMiddleware } from "hono/factory";
import { db, users } from "@pkg/db";
import { callBetterAuth } from "./better-auth";

export const authMiddleware = createMiddleware(async (c, next) => {
  const sessionResponse = await callBetterAuth("/api/auth/get-session", { method: "GET" }, c.req.raw.headers);
  const sessionPayload = (await sessionResponse.json()) as
    | {
        session: {
          token: string;
          userId: string;
          expiresAt: string;
        };
        user: {
          id: string;
          email: string;
          name: string;
        };
      }
    | null;

  if (!sessionPayload?.user) {
    return c.json({ error: "Nao autenticado" }, 401);
  }

  const [user] = await db.select().from(users).where(eq(users.id, sessionPayload.user.id)).limit(1);

  if (!user) {
    return c.json({ error: "Nao autenticado" }, 401);
  }

  c.set("user", {
    id: user.id,
    institutionId: user.institutionId,
    name: user.name,
    email: user.email,
    role: user.role
  });

  c.set("session", {
    token: sessionPayload.session.token,
    userId: sessionPayload.session.userId,
    expiresAt: sessionPayload.session.expiresAt
  });

  await next();
});

export type AuthContext = {
  Variables: {
    user: {
      id: string;
      institutionId: string;
      name: string;
      email: string;
      role: "teacher" | "manager" | "specialist";
    };
    session: {
      token: string;
      userId: string;
      expiresAt: string;
    };
  };
};
