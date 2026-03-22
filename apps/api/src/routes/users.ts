import { eq } from "@pkg/db";
import { Hono } from "hono";
import { db, users } from "@pkg/db";
import { authMiddleware, type AuthContext } from "../lib/middleware";

export const userRoutes = new Hono<AuthContext>();
userRoutes.use("*", authMiddleware);

userRoutes.get("/", async (c) => {
  const user = c.get("user");
  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.institutionId, user.institutionId));

  return c.json(rows);
});

