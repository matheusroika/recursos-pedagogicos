import "dotenv/config";
import { createHash, randomUUID, scryptSync } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db, pool } from "./client";
import {
  accounts,
  categories,
  institutions,
  materialShares,
  materials,
  materialTags,
  notifications,
  tags,
  users
} from "./schema";

const INSTITUTION_NAME = "Instituto Criativo";

function slugify(v: string) {
  return v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function hashBetterAuthPassword(password: string) {
  const salt = createHash("sha256").update(randomUUID()).digest("hex").slice(0, 32);
  const key = scryptSync(password.normalize("NFKC"), salt, 64, {
    N: 16384,
    r: 16,
    p: 1,
    maxmem: 128 * 16384 * 16 * 2
  });
  return `${salt}:${key.toString("hex")}`;
}

async function main() {
  const [existingInstitution] = await db.select().from(institutions).where(eq(institutions.slug, "instituto-criativo")).limit(1);

  const institutionId = existingInstitution?.id ?? randomUUID();

  if (!existingInstitution) {
    await db.insert(institutions).values({ id: institutionId, name: INSTITUTION_NAME, slug: "instituto-criativo" });
  }

  const seededUsers = [
    { name: "Matheus de Lima Roika", email: "matheus@instituto-criativo.org", role: "teacher" as const },
    { name: "Carla Menezes", email: "carla@instituto-criativo.org", role: "teacher" as const },
    { name: "Bruno Lima", email: "bruno@instituto-criativo.org", role: "manager" as const },
    { name: "Fernanda Costa", email: "fernanda@instituto-criativo.org", role: "specialist" as const }
  ];

  const passwordHash = hashBetterAuthPassword("12345678");
  for (const seedUser of seededUsers) {
    const [exists] = await db.select().from(users).where(eq(users.email, seedUser.email)).limit(1);
    const userId = exists?.id ?? randomUUID();

    if (!exists) {
      await db.insert(users).values({
        id: userId,
        institutionId,
        name: seedUser.name,
        email: seedUser.email,
        emailVerified: true,
        role: seedUser.role,
        status: "active"
      });
    }

    const [credentialAccount] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.userId, userId), eq(accounts.providerId, "credential")))
      .limit(1);

    if (!credentialAccount) {
      await db.insert(accounts).values({
        id: randomUUID(),
        userId,
        providerId: "credential",
        accountId: userId,
        password: passwordHash
      });
    } else {
      await db.update(accounts).set({ password: passwordHash, updatedAt: new Date() }).where(eq(accounts.id, credentialAccount.id));
    }
  }

  const categoriesSeed = ["Linguagem", "Matematica", "Desenvolvimento", "Planejamento", "Socioemocional"];
  for (const name of categoriesSeed) {
    const slug = slugify(name);
    const [exists] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.institutionId, institutionId), eq(categories.slug, slug)))
      .limit(1);
    if (!exists) {
      await db.insert(categories).values({ id: randomUUID(), institutionId, name, slug });
    }
  }

  const tagsSeed = ["inclusao", "leitura", "alfabetizacao", "rotina", "autonomia", "adaptacao", "logica"];
  for (const name of tagsSeed) {
    const slug = slugify(name);
    const [exists] = await db.select().from(tags).where(and(eq(tags.institutionId, institutionId), eq(tags.slug, slug))).limit(1);
    if (!exists) {
      await db.insert(tags).values({ id: randomUUID(), institutionId, name, slug, color: "#3b82f6" });
    }
  }

  const [author] = await db.select().from(users).where(eq(users.email, "matheus@instituto-criativo.org")).limit(1);
  const [categoryLing] = await db.select().from(categories).where(and(eq(categories.institutionId, institutionId), eq(categories.slug, "linguagem"))).limit(1);

  if (author && categoryLing) {
    const [existsMaterial] = await db.select().from(materials).where(eq(materials.title, "Jogo de Letras")).limit(1);
    if (!existsMaterial) {
      const materialId = randomUUID();
      await db.insert(materials).values({
        id: materialId,
        institutionId,
        authorUserId: author.id,
        title: "Jogo de Letras",
        description: "Material para apoio a alfabetizacao inclusiva",
        categoryId: categoryLing.id,
        materialType: "pdf",
        privacy: "institution",
        status: "published",
        publishedAt: new Date()
      });

      const tagRows = await db.select().from(tags).where(eq(tags.institutionId, institutionId));
      const selectedTags = tagRows.filter((t) => ["inclusao", "leitura"].includes(t.slug));
      for (const tag of selectedTags) {
        await db.insert(materialTags).values({ materialId, tagId: tag.id });
      }

      const [recipient] = await db.select().from(users).where(eq(users.email, "carla@instituto-criativo.org")).limit(1);
      if (recipient) {
        await db.insert(materialShares).values({
          id: randomUUID(),
          materialId,
          sharedByUserId: author.id,
          sharedWithUserId: recipient.id,
          permission: "view",
          message: "Compartilhando para revisao"
        });

        await db.insert(notifications).values({
          id: randomUUID(),
          institutionId,
          recipientUserId: recipient.id,
          actorUserId: author.id,
          materialId,
          type: "share",
          title: "Novo compartilhamento de material",
          body: "Matheus compartilhou 'Jogo de Letras' com voce",
          isRead: false
        });
      }
    }
  }

  const digest = createHash("sha256").update(String(Date.now())).digest("hex").slice(0, 8);
  console.log(`Seed concluido (${digest}). Login padrao: matheus@instituto-criativo.org / 12345678`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
