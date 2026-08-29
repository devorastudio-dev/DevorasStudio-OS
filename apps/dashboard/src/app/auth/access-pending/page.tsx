import { Alert, Button } from "@devora/ui";
import { redirect } from "next/navigation";

import {
  destinationPath,
  getInternalAuthState,
} from "../../../lib/auth/access";
import { logoutAction } from "../actions";
import { AuthFormShell } from "../auth-form-shell";

export const dynamic = "force-dynamic";

export default async function AccessPendingPage() {
  const authState = await getInternalAuthState();

  if (authState.destination !== "access-pending") {
    redirect(destinationPath(authState.destination));
  }

  return (
    <AuthFormShell
      description="Sua identidade foi confirmada, mas o acesso interno não está ativo."
      title="Acesso indisponível"
    >
      <Alert variant="warning">
        Solicite a uma pessoa autorizada que confira seu convite ou vínculo. O
        sistema não informa o status interno da associação nesta tela.
      </Alert>
      <form action={logoutAction}>
        <Button className="w-full" type="submit" variant="secondary">
          Sair
        </Button>
      </form>
    </AuthFormShell>
  );
}
