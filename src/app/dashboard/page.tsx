import { redirect } from "next/navigation";
import { getSession } from "@/backend/auth/session";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/signup");
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Hello, {session.user.name}</h1>
      <p className="text-muted-foreground">Role: {session.role}</p>
    </main>
  );
}