import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/backend/auth/session";
import { SignupForm } from "@/frontend/features/auth/SignupForm";

export default async function SignupPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome to Moppo</h1>
        <p className="text-sm text-muted-foreground">
          Set up your business in a minute.
        </p>
      </div>
      <SignupForm />
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-foreground underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}