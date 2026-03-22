import { describe, expect, it } from "vitest";
import { materials, users } from "./schema";

describe("db schema", () => {
  it("exposes key tables", () => {
    expect(materials).toBeDefined();
    expect(users).toBeDefined();
  });
});
