import { redirect } from "next/navigation";
import { getSession } from "@/backend/auth/session";
import { logoutAction } from "@/backend/modules/auth/actions";
import { Button } from "@/frontend/components/ui/button";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Hello, {session.user.name}</h1>
          <p className="text-sm text-muted-foreground">Role: {session.role}</p>
        </div>
        <form action={logoutAction}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </div>
    </main>
  );
}