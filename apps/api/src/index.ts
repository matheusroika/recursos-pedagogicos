import "dotenv/config";
import { serve } from "@hono/node-server";
import { ensureBucket } from "./lib/minio";
import { createApp } from "./app";

const app = createApp();
const port = Number(process.env.API_PORT || 3001);

await ensureBucket().catch(() => {
  console.warn("Aviso: nao foi possivel garantir bucket MinIO no boot.");
});

serve({ fetch: app.fetch, port });
console.log(`API Hono em http://localhost:${port}`);

export type AppType = typeof app;
