"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/backend/database/db";
import { createSession } from "@/backend/auth/session";
import { getTemplate } from "@/backend/templates";
import { signupSchema } from "./schema";

export type FormState = { error?: string } | undefined;

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