import { and, eq } from "@pkg/db";
import { Hono } from "hono";
import { db, users } from "@pkg/db";
import { authMiddleware, type AuthContext } from "../lib/middleware";

export const profileRoutes = new Hono<AuthContext>();
profileRoutes.use("*", authMiddleware);

profileRoutes.get("/", async (c) => {
  const user = c.get("user");
  const [profile] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  return c.json(profile);
});

profileRoutes.patch("/", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  const [updated] = await db
    .update(users)
    .set({
      name: body.name,
      phone: body.phone,
      bio: body.bio,
      avatarUrl: body.avatarUrl,
      updatedAt: new Date()
    })
    .where(and(eq(users.id, user.id), eq(users.institutionId, user.institutionId)))
    .returning();

  return c.json(updated);
});

