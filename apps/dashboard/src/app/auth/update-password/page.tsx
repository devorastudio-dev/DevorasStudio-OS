import { redirect } from "next/navigation";

import { createClient } from "../../../lib/supabase/server";
import { AuthFormShell } from "../auth-form-shell";
import { PasswordForm } from "./password-form";

export const dynamic = "force-dynamic";

export default async function UpdatePasswordPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ mode?: string }> }>) {
  const [{ mode }, supabase] = await Promise.all([
    searchParams,
    createClient(),
  ]);
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) redirect("/auth/login?error=invalid-link");

  return (
    <AuthFormShell
      description="Defina uma senha forte para concluir o acesso."
      title="Criar nova senha"
    >
      <PasswordForm mode={mode === "invite" ? "invite" : "recovery"} />
    </AuthFormShell>
  );
}
