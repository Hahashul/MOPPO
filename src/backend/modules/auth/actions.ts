"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/backend/database/db";
import { createSession, destroySession } from "@/backend/auth/session";
import { getTemplate } from "@/backend/templates";
import { loginSchema, signupSchema } from "./schema";

export type FormState = { error?: string } | undefined;

// Used so a wrong email takes as long as a wrong password (prevents email guessing).
const DUMMY_HASH =
  "$2a$12$C6UzMDM.H6dfI/f/IKcEeO5H1S2bY7iHqJ0nQ1mK0m0k0m0k0m0k0";

export async function signupAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { name, email, password, companyName, template } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { error: "An account with this email already exists." };

  const passwordHash = await bcrypt.hash(password, 12);
  const tpl = getTemplate(template);

  const { user, company } = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { name, email, passwordHash } });
    const company = await tx.company.create({
      data: { name: companyName, template: tpl.id, settings: tpl.settings },
    });
    await tx.membership.create({
      data: { userId: user.id, companyId: company.id, role: "OWNER" },
    });
    await tx.warehouse.create({
      data: { companyId: company.id, name: "Main Store", isDefault: true },
    });
    return { user, company };
  });

  await createSession(user.id, company.id, user.authVersion);
  redirect("/dashboard");
}

export async function loginAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { memberships: { orderBy: { id: "asc" }, take: 1 } },
  });

  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok || !user.isActive || user.memberships.length === 0) {
    return { error: "Wrong email or password." };
  }

  await createSession(user.id, user.memberships[0].companyId, user.authVersion);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}