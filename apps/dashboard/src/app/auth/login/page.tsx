import { redirect } from "next/navigation";

import { getDashboardAccess } from "../../../lib/auth/access";
import { safeNextPath } from "../../../lib/auth/validation";
import { AuthFormShell } from "../auth-form-shell";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ error?: string; next?: string }> }>) {
  const [{ error, next }, { access, user }] = await Promise.all([
    searchParams,
    getDashboardAccess(),
  ]);

  if (access) redirect("/");
  if (user) redirect("/auth/access-pending");

  return (
    <AuthFormShell
      description="Acesso restrito a pessoas convidadas pela Devora Studio."
      title="Entrar no Devora OS"
    >
      <LoginForm
        initialMessage={
          error === "invalid-link"
            ? "O link de acesso e invalido ou expirou."
            : undefined
        }
        nextPath={safeNextPath(next)}
      />
    </AuthFormShell>
  );
}
