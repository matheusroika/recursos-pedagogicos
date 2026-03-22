import { and, eq } from "@pkg/db";
import { randomUUID } from "node:crypto";
import { Hono } from "hono";
import { db, tags } from "@pkg/db";
import { authMiddleware, type AuthContext } from "../lib/middleware";

export const tagRoutes = new Hono<AuthContext>();
tagRoutes.use("*", authMiddleware);

function slugify(v: string) {
  return v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

tagRoutes.get("/", async (c) => {
  const user = c.get("user");
  const rows = await db.select().from(tags).where(eq(tags.institutionId, user.institutionId));
  return c.json(rows);
});

tagRoutes.post("/", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  if (!body.name) return c.json({ error: "Nome obrigatorio" }, 400);
  const [inserted] = await db.insert(tags).values({
    id: randomUUID(),
    institutionId: user.institutionId,
    name: body.name,
    slug: slugify(body.name),
    color: body.color || "#3b82f6"
  }).returning();
  return c.json(inserted, 201);
});

tagRoutes.patch("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const body = await c.req.json();
  const [updated] = await db
    .update(tags)
    .set({
      name: body.name,
      slug: body.name ? slugify(body.name) : undefined,
      color: body.color
    })
    .where(and(eq(tags.id, id), eq(tags.institutionId, user.institutionId)))
    .returning();
  if (!updated) return c.json({ error: "Tag nao encontrada" }, 404);
  return c.json(updated);
});

tagRoutes.delete("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  await db.delete(tags).where(and(eq(tags.id, id), eq(tags.institutionId, user.institutionId)));
  return c.json({ ok: true });
});

