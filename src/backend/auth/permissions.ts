import type { Role } from "@prisma/client";
import { getSession } from "./session";

export async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("You are not signed in.");
  return session;
}

export async function requireRole(allowed: Role[]) {
  const session = await requireSession();
  if (!allowed.includes(session.role)) {
    throw new Error("You do not have permission to do this.");
  }
  return session;
}