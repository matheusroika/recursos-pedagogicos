import { Hono } from "hono";
import { cors } from "hono/cors";
import { authRoutes } from "./routes/auth";
import { materialRoutes } from "./routes/materials";
import { shareRoutes } from "./routes/shares";
import { categoryRoutes } from "./routes/categories";
import { tagRoutes } from "./routes/tags";
import { notificationRoutes } from "./routes/notifications";
import { profileRoutes } from "./routes/profile";
import { fileRoutes } from "./routes/files";
import { userRoutes } from "./routes/users";

export function createApp() {
  const app = new Hono();
  const appOrigin = process.env.APP_ORIGIN || "http://localhost:3000";

  app.use("*", cors({ origin: appOrigin, credentials: true }));
  app.get("/health", (c) => c.json({ ok: true }));

  app.route("/api/auth", authRoutes);
  app.route("/api/materials", materialRoutes);
  app.route("/api/materials", shareRoutes);
  app.route("/api/categories", categoryRoutes);
  app.route("/api/tags", tagRoutes);
  app.route("/api/notifications", notificationRoutes);
  app.route("/api/profile", profileRoutes);
  app.route("/api/files", fileRoutes);
  app.route("/api/users", userRoutes);

  return app;
}
