import { describe, expect, it } from "vitest";
import { CreateMaterialInputSchema, LoginInputSchema } from "./schemas";

describe("schemas", () => {
  it("validates login", () => {
    const parsed = LoginInputSchema.safeParse({ email: "a@b.com", password: "123456" });
    expect(parsed.success).toBe(true);
  });

  it("requires title in material", () => {
    const parsed = CreateMaterialInputSchema.safeParse({
      title: "",
      description: "x",
      categoryId: "bad",
      materialType: "pdf",
      privacy: "institution"
    });
    expect(parsed.success).toBe(false);
  });
});
