import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["teacher", "manager", "specialist"]);
export const materialTypeEnum = pgEnum("material_type", ["document", "video", "link", "image", "pdf"]);
export const materialPrivacyEnum = pgEnum("material_privacy", ["private", "institution", "public"]);
export const materialStatusEnum = pgEnum("material_status", ["draft", "published"]);
export const sharePermissionEnum = pgEnum("share_permission", ["view", "edit"]);

export const institutions = pgTable("institutions", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (t) => ({
  slugIdx: uniqueIndex("institutions_slug_idx").on(t.slug)
}));

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  institutionId: uuid("institution_id").notNull().references(() => institutions.id),
  name: varchar("name", { length: 140 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  avatarUrl: text("avatar_url"),
  role: userRoleEnum("role").notNull(),
  phone: varchar("phone", { length: 30 }),
  bio: text("bio"),
  status: varchar("status", { length: 30 }).default("active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
}, (t) => ({
  emailIdx: uniqueIndex("users_email_idx").on(t.email),
  institutionIdx: index("users_institution_idx").on(t.institutionId)
}));

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: varchar("ip_address", { length: 100 }),
  userAgent: text("user_agent")
}, (t) => ({
  tokenIdx: uniqueIndex("sessions_token_idx").on(t.token),
  userIdx: index("sessions_user_idx").on(t.userId)
}));

export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: varchar("account_id", { length: 255 }).notNull(),
  providerId: varchar("provider_id", { length: 255 }).notNull(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
}, (t) => ({
  providerAccountIdx: uniqueIndex("accounts_provider_account_idx").on(t.providerId, t.accountId),
  userIdx: index("accounts_user_idx").on(t.userId)
}));

export const verificationTokens = pgTable("verification_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
}, (t) => ({
  identifierIdx: index("verification_tokens_identifier_idx").on(t.identifier),
  valueIdx: uniqueIndex("verification_tokens_value_idx").on(t.value)
}));

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  institutionId: uuid("institution_id").notNull().references(() => institutions.id),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (t) => ({
  institutionIdx: index("categories_institution_idx").on(t.institutionId),
  slugIdx: uniqueIndex("categories_slug_idx").on(t.institutionId, t.slug)
}));

export const tags = pgTable("tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  institutionId: uuid("institution_id").notNull().references(() => institutions.id),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull(),
  color: varchar("color", { length: 20 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (t) => ({
  institutionIdx: index("tags_institution_idx").on(t.institutionId),
  slugIdx: uniqueIndex("tags_slug_idx").on(t.institutionId, t.slug)
}));

export const files = pgTable("files", {
  id: uuid("id").defaultRandom().primaryKey(),
  bucket: varchar("bucket", { length: 80 }).notNull(),
  objectKey: text("object_key").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: varchar("mime_type", { length: 120 }).notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  checksum: varchar("checksum", { length: 128 }),
  uploadedByUserId: uuid("uploaded_by_user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const materials = pgTable("materials", {
  id: uuid("id").defaultRandom().primaryKey(),
  institutionId: uuid("institution_id").notNull().references(() => institutions.id),
  authorUserId: uuid("author_user_id").notNull().references(() => users.id),
  title: varchar("title", { length: 180 }).notNull(),
  description: text("description").notNull(),
  categoryId: uuid("category_id").notNull().references(() => categories.id),
  materialType: materialTypeEnum("material_type").notNull(),
  privacy: materialPrivacyEnum("privacy").notNull().default("institution"),
  status: materialStatusEnum("status").notNull().default("draft"),
  fileId: uuid("file_id").references(() => files.id),
  externalUrl: text("external_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true })
}, (t) => ({
  institutionIdx: index("materials_institution_idx").on(t.institutionId),
  authorIdx: index("materials_author_idx").on(t.authorUserId),
  categoryIdx: index("materials_category_idx").on(t.categoryId)
}));

export const materialTags = pgTable("material_tags", {
  materialId: uuid("material_id").notNull().references(() => materials.id, { onDelete: "cascade" }),
  tagId: uuid("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (t) => ({
  pk: primaryKey({ columns: [t.materialId, t.tagId] })
}));

export const materialShares = pgTable("material_shares", {
  id: uuid("id").defaultRandom().primaryKey(),
  materialId: uuid("material_id").notNull().references(() => materials.id, { onDelete: "cascade" }),
  sharedByUserId: uuid("shared_by_user_id").notNull().references(() => users.id),
  sharedWithUserId: uuid("shared_with_user_id").notNull().references(() => users.id),
  permission: sharePermissionEnum("permission").notNull(),
  message: text("message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (t) => ({
  materialIdx: index("material_shares_material_idx").on(t.materialId),
  sharedWithIdx: index("material_shares_shared_with_idx").on(t.sharedWithUserId)
}));

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  institutionId: uuid("institution_id").notNull().references(() => institutions.id),
  recipientUserId: uuid("recipient_user_id").notNull().references(() => users.id),
  actorUserId: uuid("actor_user_id").references(() => users.id),
  materialId: uuid("material_id").references(() => materials.id),
  type: varchar("type", { length: 60 }).notNull(),
  title: text("title").notNull(),
  body: text("body"),
  isRead: boolean("is_read").default(false).notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (t) => ({
  recipientIdx: index("notifications_recipient_idx").on(t.recipientUserId),
  readIdx: index("notifications_is_read_idx").on(t.isRead)
}));

export const materialViews = pgTable("material_views", {
  id: uuid("id").defaultRandom().primaryKey(),
  materialId: uuid("material_id").notNull().references(() => materials.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id),
  viewedAt: timestamp("viewed_at", { withTimezone: true }).defaultNow().notNull()
});

export const comments = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  materialId: uuid("material_id").notNull().references(() => materials.id, { onDelete: "cascade" }),
  authorUserId: uuid("author_user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
