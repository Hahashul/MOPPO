import { SignupForm } from "@/frontend/features/auth/SignupForm";
import { templateList } from "@/backend/templates";

export default function SignupPage() {
  const templates = templateList.map((t) => ({ id: t.id, label: t.label }));
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome to Moppo</h1>
        <p className="text-sm text-muted-foreground">Set up your business in a minute.</p>
      </div>
      <SignupForm templates={templates} />
    </main>
  );
}