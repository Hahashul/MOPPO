import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "../database/db";

const key = new TextEncoder().encode(process.env.AUTH_SECRET);
const COOKIE = "moppo_session";
const WEEK = 60 * 60 * 24 * 7;

export async function createSession(
  userId: string,
  companyId: string,
  authVersion: number
) {
  const token = await new SignJWT({ userId, companyId, authVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(key);

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: WEEK,
  });
}

export async function getSession() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key);
    const { userId, companyId, authVersion } = payload as {
      userId: string;
      companyId: string;
      authVersion: number;
    };
    const m = await prisma.membership.findUnique({
      where: { userId_companyId: { userId, companyId } },
      include: { user: true },
    });
    if (!m || !m.user.isActive || m.user.authVersion !== authVersion) return null;
    return { userId, companyId, role: m.role, user: m.user };
  } catch {
    return null;
  }
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}