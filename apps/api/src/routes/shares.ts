import { and, eq } from "@pkg/db";
import { randomUUID } from "node:crypto";
import { Hono } from "hono";
import { db, materialShares, notifications, materials, users } from "@pkg/db";
import { CreateShareInputSchema } from "@pkg/shared";
import { authMiddleware, type AuthContext } from "../lib/middleware";
import { canEditMaterial } from "../lib/auth";

export const shareRoutes = new Hono<AuthContext>();
shareRoutes.use("*", authMiddleware);

shareRoutes.post("/:id/share", async (c) => {
  const user = c.get("user");
  const materialId = c.req.param("id");
  const canEdit = await canEditMaterial(materialId, user.id);
  if (!canEdit) return c.json({ error: "Sem permissao" }, 403);

  const parsed = CreateShareInputSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const [material] = await db.select().from(materials).where(eq(materials.id, materialId)).limit(1);
  if (!material) return c.json({ error: "Material nao encontrado" }, 404);

  const [recipient] = await db.select().from(users).where(eq(users.id, parsed.data.sharedWithUserId)).limit(1);
  if (!recipient) return c.json({ error: "Usuario destino nao encontrado" }, 404);

  const [existing] = await db
    .select()
    .from(materialShares)
    .where(and(eq(materialShares.materialId, materialId), eq(materialShares.sharedWithUserId, recipient.id)))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(materialShares)
      .set({ permission: parsed.data.permission, message: parsed.data.message ?? null })
      .where(eq(materialShares.id, existing.id))
      .returning();
    return c.json(updated);
  }

  const [inserted] = await db
    .insert(materialShares)
    .values({
      id: randomUUID(),
      materialId,
      sharedByUserId: user.id,
      sharedWithUserId: recipient.id,
      permission: parsed.data.permission,
      message: parsed.data.message
    })
    .returning();

  await db.insert(notifications).values({
    id: randomUUID(),
    institutionId: user.institutionId,
    recipientUserId: recipient.id,
    actorUserId: user.id,
    materialId,
    type: "share",
    title: `${user.name} compartilhou um material com voce`,
    body: parsed.data.message || null,
    isRead: false
  });

  return c.json(inserted, 201);
});

