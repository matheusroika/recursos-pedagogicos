import { and, desc, eq } from "@pkg/db";
import { Hono } from "hono";
import { db, notifications } from "@pkg/db";
import { authMiddleware, type AuthContext } from "../lib/middleware";

export const notificationRoutes = new Hono<AuthContext>();
notificationRoutes.use("*", authMiddleware);

notificationRoutes.get("/", async (c) => {
  const user = c.get("user");
  const filter = c.req.query("filter");

  const whereParts = [eq(notifications.recipientUserId, user.id)];
  if (filter === "unread") whereParts.push(eq(notifications.isRead, false));

  const rows = await db.select().from(notifications).where(and(...whereParts)).orderBy(desc(notifications.createdAt));
  return c.json(rows);
});

notificationRoutes.patch("/:id/read", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const [updated] = await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(and(eq(notifications.id, id), eq(notifications.recipientUserId, user.id)))
    .returning();

  if (!updated) return c.json({ error: "Notificacao nao encontrada" }, 404);
  return c.json(updated);
});

