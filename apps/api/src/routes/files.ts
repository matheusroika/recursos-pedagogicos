import { randomUUID } from "node:crypto";
import { and, eq } from "@pkg/db";
import { Hono } from "hono";
import { db, files } from "@pkg/db";
import { authMiddleware, type AuthContext } from "../lib/middleware";
import { minioBucket, minioClient } from "../lib/minio";

export const fileRoutes = new Hono<AuthContext>();
fileRoutes.use("*", authMiddleware);

fileRoutes.post("/upload-url", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  if (!body.originalName || !body.mimeType || !body.sizeBytes) {
    return c.json({ error: "Campos obrigatorios: originalName, mimeType, sizeBytes" }, 400);
  }

  const fileId = randomUUID();
  const objectKey = `${user.institutionId}/${fileId}-${String(body.originalName).replace(/\s+/g, "_")}`;

  const uploadUrl = await minioClient.presignedPutObject(minioBucket, objectKey, 60 * 10);

  await db.insert(files).values({
    id: fileId,
    bucket: minioBucket,
    objectKey,
    originalName: body.originalName,
    mimeType: body.mimeType,
    sizeBytes: Number(body.sizeBytes),
    checksum: body.checksum || null,
    uploadedByUserId: user.id
  });

  return c.json({ fileId, objectKey, uploadUrl, expiresInSeconds: 600 });
});

fileRoutes.get("/:id/download-url", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const [file] = await db.select().from(files).where(eq(files.id, id)).limit(1);
  if (!file) return c.json({ error: "Arquivo nao encontrado" }, 404);

  const canAccess = file.objectKey.startsWith(`${user.institutionId}/`);
  if (!canAccess) return c.json({ error: "Sem permissao" }, 403);

  const downloadUrl = await minioClient.presignedGetObject(file.bucket, file.objectKey, 60 * 10);
  return c.json({ downloadUrl, expiresInSeconds: 600, file });
});

