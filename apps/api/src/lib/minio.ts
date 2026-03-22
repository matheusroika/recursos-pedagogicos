import { Client } from "minio";

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: Number(process.env.MINIO_PORT || 9000),
  useSSL: (process.env.MINIO_USE_SSL || "false") === "true",
  accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
  secretKey: process.env.MINIO_SECRET_KEY || "minioadmin"
});

export const minioBucket = process.env.MINIO_BUCKET || "recursos-pedagogicos";

export async function ensureBucket() {
  const exists = await minioClient.bucketExists(minioBucket).catch(() => false);
  if (!exists) {
    await minioClient.makeBucket(minioBucket, "us-east-1");
  }
}

export { minioClient };
