import { redirect } from "next/navigation";

import {
  destinationPath,
  getInternalAuthState,
} from "../../../../lib/auth/access";
import { safeNextPath } from "../../../../lib/auth/validation";
import { AuthFormShell } from "../../auth-form-shell";
import { MfaEnrollForm } from "./mfa-enroll-form";

export const dynamic = "force-dynamic";

export default async function MfaEnrollPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ additional?: string; next?: string }>;
}>) {
  const [{ additional, next }, state] = await Promise.all([
    searchParams,
    getInternalAuthState(),
  ]);
  if (!state.user || state.membership !== "active")
    redirect(destinationPath(state.destination));
  const addingFactor = additional === "1" && state.currentLevel === "aal2";
  if (state.factors.length > 0 && !addingFactor)
    redirect(destinationPath(state.destination));

  return (
    <AuthFormShell
      description="Use qualquer aplicativo autenticador compatível com TOTP."
      title="Configurar autenticação em duas etapas"
    >
      <MfaEnrollForm nextPath={safeNextPath(next)} />
    </AuthFormShell>
  );
}
