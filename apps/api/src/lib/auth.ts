import { and, eq } from "@pkg/db";
import { db, materials, materialShares, users } from "@pkg/db";

export async function canEditMaterial(materialId: string, userId: string) {
  const [material] = await db.select().from(materials).where(eq(materials.id, materialId)).limit(1);
  if (!material) return false;

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return false;

  if (material.authorUserId === userId || user.role === "manager") return true;

  const [share] = await db
    .select()
    .from(materialShares)
    .where(and(eq(materialShares.materialId, materialId), eq(materialShares.sharedWithUserId, userId), eq(materialShares.permission, "edit")))
    .limit(1);

  return !!share;
}
