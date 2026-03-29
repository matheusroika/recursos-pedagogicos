import { and, asc, desc, eq, ilike, inArray } from "@pkg/db";
import { Hono } from "hono";
import {
  db,
  materials,
  materialTags,
  tags,
  categories,
  users,
  files,
  materialShares
} from "@pkg/db";
import {
  CreateMaterialInputSchema,
  MaterialQuerySchema,
  UpdateMaterialInputSchema
} from "@pkg/shared";
import { authMiddleware, type AuthContext } from "../lib/middleware";
import { canEditMaterial } from "../lib/auth";

export const materialRoutes = new Hono<AuthContext>();
materialRoutes.use("*", authMiddleware);

materialRoutes.get("/", async (c) => {
  const user = c.get("user");
  const query = MaterialQuerySchema.parse({
    ...c.req.query(),
    tags: [...(c.req.queries("tags") ?? []), ...(c.req.queries("tagId") ?? [])]
  });

  const whereParts = [eq(materials.institutionId, user.institutionId)];

  if (query.q) {
    whereParts.push(ilike(materials.title, `%${query.q}%`));
  }
  if (query.categoryId) {
    whereParts.push(eq(materials.categoryId, query.categoryId));
  }
  if (query.type) {
    whereParts.push(eq(materials.materialType, query.type));
  }

  if (query.tags && query.tags.length > 0) {
    const taggedMaterialRows = await db
      .select({ materialId: materialTags.materialId })
      .from(materialTags)
      .where(inArray(materialTags.tagId, query.tags))
      .groupBy(materialTags.materialId);

    const taggedMaterialIds = taggedMaterialRows.map((row) => row.materialId);

    if (taggedMaterialIds.length === 0) {
      return c.json({ items: [] });
    }

    whereParts.push(inArray(materials.id, taggedMaterialIds));
  }

  const orderBy =
    query.sort === "oldest"
      ? asc(materials.createdAt)
      : query.sort === "az"
        ? asc(materials.title)
        : query.sort === "za"
          ? desc(materials.title)
          : desc(materials.createdAt);

  const rows = await db
    .select({
      id: materials.id,
      title: materials.title,
      description: materials.description,
      materialType: materials.materialType,
      privacy: materials.privacy,
      status: materials.status,
      createdAt: materials.createdAt,
      authorName: users.name,
      categoryName: categories.name,
      categoryId: categories.id
    })
    .from(materials)
    .innerJoin(users, eq(users.id, materials.authorUserId))
    .innerJoin(categories, eq(categories.id, materials.categoryId))
    .where(and(...whereParts))
    .orderBy(orderBy)
    .limit(query.pageSize)
    .offset((query.page - 1) * query.pageSize);

  const ids = rows.map((r) => r.id);
  const tagsMap = new Map<string, string[]>();
  if (ids.length > 0) {
    const tagRows = await db
      .select({ materialId: materialTags.materialId, tagName: tags.name })
      .from(materialTags)
      .innerJoin(tags, eq(tags.id, materialTags.tagId))
      .where(inArray(materialTags.materialId, ids));

    for (const row of tagRows) {
      tagsMap.set(row.materialId, [...(tagsMap.get(row.materialId) || []), row.tagName]);
    }
  }

  return c.json({
    items: rows.map((row) => ({ ...row, tags: tagsMap.get(row.id) || [] }))
  });
});

materialRoutes.post("/", async (c) => {
  const user = c.get("user");
  const parsed = CreateMaterialInputSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const [inserted] = await db
    .insert(materials)
    .values({
      institutionId: user.institutionId,
      authorUserId: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      categoryId: parsed.data.categoryId,
      materialType: parsed.data.materialType,
      privacy: parsed.data.privacy,
      status: parsed.data.status,
      fileId: parsed.data.fileId || null,
      externalUrl: parsed.data.externalUrl || null,
      publishedAt: parsed.data.status === "published" ? new Date() : null
    })
    .returning();

  if (parsed.data.tagIds.length > 0) {
    await db.insert(materialTags).values(parsed.data.tagIds.map((tagId) => ({ materialId: inserted.id, tagId })));
  }

  return c.json(inserted, 201);
});

materialRoutes.get("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const rows = await db
    .select()
    .from(materials)
    .where(and(eq(materials.id, id), eq(materials.institutionId, user.institutionId)))
    .limit(1);
  const material = rows[0];
  if (!material) return c.json({ error: "Material nao encontrado" }, 404);

  const [author] = await db.select().from(users).where(eq(users.id, material.authorUserId)).limit(1);
  const [category] = await db.select().from(categories).where(eq(categories.id, material.categoryId)).limit(1);
  const tagRows = await db
    .select({ id: tags.id, name: tags.name })
    .from(materialTags)
    .innerJoin(tags, eq(tags.id, materialTags.tagId))
    .where(eq(materialTags.materialId, id));

  const file = material.fileId ? (await db.select().from(files).where(eq(files.id, material.fileId)).limit(1))[0] : null;

  return c.json({ ...material, author, category, tags: tagRows, file });
});

materialRoutes.patch("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const canEdit = await canEditMaterial(id, user.id);
  if (!canEdit) return c.json({ error: "Sem permissao" }, 403);

  const parsed = UpdateMaterialInputSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const updatedPayload: Record<string, unknown> = { updatedAt: new Date() };
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value !== undefined) updatedPayload[key] = value;
  }

  const [updated] = await db.update(materials).set(updatedPayload).where(eq(materials.id, id)).returning();

  if (!updated) return c.json({ error: "Material nao encontrado" }, 404);

  if (parsed.data.tagIds) {
    await db.delete(materialTags).where(eq(materialTags.materialId, id));
    if (parsed.data.tagIds.length > 0) {
      await db.insert(materialTags).values(parsed.data.tagIds.map((tagId) => ({ materialId: id, tagId })));
    }
  }

  return c.json(updated);
});

materialRoutes.delete("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const canEdit = await canEditMaterial(id, user.id);
  if (!canEdit) return c.json({ error: "Sem permissao" }, 403);

  await db.delete(materials).where(eq(materials.id, id));
  return c.json({ ok: true });
});

materialRoutes.get("/:id/shares", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const canEdit = await canEditMaterial(id, user.id);
  if (!canEdit) return c.json({ error: "Sem permissao" }, 403);

  const rows = await db
    .select({
      id: materialShares.id,
      permission: materialShares.permission,
      message: materialShares.message,
      createdAt: materialShares.createdAt,
      sharedWithUserId: materialShares.sharedWithUserId,
      sharedWithName: users.name
    })
    .from(materialShares)
    .innerJoin(users, eq(users.id, materialShares.sharedWithUserId))
    .where(eq(materialShares.materialId, id));

  return c.json(rows);
});

