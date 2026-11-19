import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/backend/auth/session";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <Link
        href="/dashboard"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to dashboard
      </Link>
      <div className="mt-4">{children}</div>
    </div>
  );
}