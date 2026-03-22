import { and, eq } from "@pkg/db";
import { randomUUID } from "node:crypto";
import { Hono } from "hono";
import { db, categories } from "@pkg/db";
import { authMiddleware, type AuthContext } from "../lib/middleware";

export const categoryRoutes = new Hono<AuthContext>();
categoryRoutes.use("*", authMiddleware);

function slugify(v: string) {
  return v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

categoryRoutes.get("/", async (c) => {
  const user = c.get("user");
  const rows = await db.select().from(categories).where(eq(categories.institutionId, user.institutionId));
  return c.json(rows);
});

categoryRoutes.post("/", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  if (!body.name) return c.json({ error: "Nome obrigatorio" }, 400);
  const [inserted] = await db.insert(categories).values({
    id: randomUUID(),
    institutionId: user.institutionId,
    name: body.name,
    slug: slugify(body.name),
    description: body.description || null
  }).returning();
  return c.json(inserted, 201);
});

categoryRoutes.patch("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const body = await c.req.json();
  const [updated] = await db
    .update(categories)
    .set({
      name: body.name,
      slug: body.name ? slugify(body.name) : undefined,
      description: body.description
    })
    .where(and(eq(categories.id, id), eq(categories.institutionId, user.institutionId)))
    .returning();
  if (!updated) return c.json({ error: "Categoria nao encontrada" }, 404);
  return c.json(updated);
});

categoryRoutes.delete("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  await db.delete(categories).where(and(eq(categories.id, id), eq(categories.institutionId, user.institutionId)));
  return c.json({ ok: true });
});

