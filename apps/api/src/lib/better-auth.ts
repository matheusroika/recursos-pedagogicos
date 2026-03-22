import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db, schema } from "@pkg/db";

const appOrigin = process.env.APP_ORIGIN || "http://localhost:3000";
const apiOrigin = process.env.BETTER_AUTH_URL || process.env.API_URL || "http://localhost:3001";
const sessionCookieName = process.env.SESSION_COOKIE_NAME || "rp_session";

export function getSessionCookieName() {
  return sessionCookieName;
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || "dev-only-better-auth-secret",
  baseURL: apiOrigin,
  trustedOrigins: [appOrigin, apiOrigin],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    usePlural: true,
    camelCase: true
  }),
  user: {
    modelName: "user",
    fields: {
      image: "avatarUrl"
    }
  },
  session: {
    modelName: "session"
  },
  account: {
    modelName: "account"
  },
  verification: {
    modelName: "verificationToken"
  },
  emailAndPassword: {
    enabled: true,
    disableSignUp: true
  },
  advanced: {
    database: {
      generateId: "uuid"
    },
    cookies: {
      session_token: {
        name: sessionCookieName,
        attributes: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: process.env.NODE_ENV === "production"
        }
      }
    }
  }
});

export async function callBetterAuth(path: string, init: RequestInit, incomingHeaders?: Headers) {
  const headers = new Headers(init.headers || {});

  for (const header of ["cookie", "user-agent", "x-forwarded-for", "x-real-ip", "origin"]) {
    const value = incomingHeaders?.get(header);
    if (value && !headers.has(header)) {
      headers.set(header, value);
    }
  }

  return auth.handler(new Request(`${apiOrigin}${path}`, { ...init, headers }));
}
