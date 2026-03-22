export type UserRole = "teacher" | "manager" | "specialist";
export type MaterialPrivacy = "private" | "institution" | "public";
export type SharePermission = "view" | "edit";

export interface ApiSession {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  expiresAt: string;
}
