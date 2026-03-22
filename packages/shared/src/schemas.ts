import { z } from "zod";

export const UserRoleSchema = z.enum(["teacher", "manager", "specialist"]);
export const MaterialTypeSchema = z.enum(["document", "video", "link", "image", "pdf"]);
export const MaterialPrivacySchema = z.enum(["private", "institution", "public"]);
export const SharePermissionSchema = z.enum(["view", "edit"]);

export const MaterialQuerySchema = z.object({
  q: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  tags: z.array(z.string().uuid()).optional(),
  type: MaterialTypeSchema.optional(),
  sort: z.enum(["recent", "oldest", "az", "za"]).default("recent"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10)
});

export const CreateMaterialInputSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(3),
  categoryId: z.string().uuid(),
  tagIds: z.array(z.string().uuid()).default([]),
  materialType: MaterialTypeSchema,
  privacy: MaterialPrivacySchema,
  fileId: z.string().uuid().nullable().optional(),
  externalUrl: z.string().url().nullable().optional(),
  status: z.enum(["draft", "published"]).default("draft")
});

export const UpdateMaterialInputSchema = CreateMaterialInputSchema.partial();

export const CreateShareInputSchema = z.object({
  sharedWithUserId: z.string().uuid(),
  permission: SharePermissionSchema,
  message: z.string().max(500).optional()
});

export const LoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export type MaterialQuery = z.infer<typeof MaterialQuerySchema>;
export type CreateMaterialInput = z.infer<typeof CreateMaterialInputSchema>;
export type UpdateMaterialInput = z.infer<typeof UpdateMaterialInputSchema>;
export type CreateShareInput = z.infer<typeof CreateShareInputSchema>;
export type LoginInput = z.infer<typeof LoginInputSchema>;
