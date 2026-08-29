import { redirect } from "next/navigation";

import {
  destinationPath,
  getInternalAuthState,
} from "../../../../lib/auth/access";
import { safeNextPath } from "../../../../lib/auth/validation";
import { logoutAction } from "../../actions";
import { AuthFormShell } from "../../auth-form-shell";
import { MfaChallengeForm } from "./mfa-challenge-form";

export const dynamic = "force-dynamic";

export default async function MfaChallengePage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ next?: string }> }>) {
  const [{ next }, state] = await Promise.all([
    searchParams,
    getInternalAuthState(),
  ]);
  if (state.destination !== "mfa-challenge")
    redirect(destinationPath(state.destination));
  const factor = state.factors[0];
  if (!factor) redirect("/auth/mfa/enroll");
  return (
    <AuthFormShell
      description="Confirme sua identidade com o código atual do seu aplicativo autenticador."
      title="Verificação em duas etapas"
    >
      <MfaChallengeForm
        factorId={factor.id}
        logoutAction={logoutAction}
        nextPath={safeNextPath(next)}
      />
    </AuthFormShell>
  );
}
