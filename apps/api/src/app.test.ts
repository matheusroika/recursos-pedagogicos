import { describe, it, expect } from "vitest";
import { createApp } from "./app";

describe("api health", () => {
  it("returns ok", async () => {
    const app = createApp();
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
