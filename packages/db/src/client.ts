import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@127.0.0.1:55478/recursos_pedagogicos";

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });

export { schema };
