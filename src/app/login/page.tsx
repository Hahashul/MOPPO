import { redirect } from "next/navigation";
import { getSession } from "@/backend/auth/session";
import { LoginForm } from "@/frontend/features/auth/LoginForm";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to Moppo.</p>
      </div>
      <LoginForm />
    </main>
  );
}