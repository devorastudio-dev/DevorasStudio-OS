import { Alert, Button, Card } from "@devora/ui";
import Link from "next/link";

import {
  getInternalAuthState,
  requireDashboardAccess,
} from "../../../lib/auth/access";
import { removeMfaFactor } from "./actions";

export const dynamic = "force-dynamic";

export default async function AccountSecurityPage() {
  await requireDashboardAccess();
  const state = await getInternalAuthState();
  return (
    <main className="min-h-screen px-4 py-10">
      <Card className="mx-auto max-w-2xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold">Segurança da conta</h1>
          <p className="text-sm text-text-muted">
            MFA está ativo e esta sessão foi confirmada em AAL2.
          </p>
        </header>
        <Alert variant="warning">
          O último fator obrigatório não pode ser removido. Em caso de perda,
          siga o procedimento administrativo documentado.
        </Alert>
        <ul className="space-y-3">
          {state.factors.map((factor) => (
            <li
              className="flex items-center justify-between gap-4 rounded-lg border border-border p-3"
              key={factor.id}
            >
              <span>
                Aplicativo autenticador — {factor.friendly_name ?? "TOTP"}
              </span>
              {state.factors.length > 1 ? (
                <form action={removeMfaFactor}>
                  <input name="factorId" type="hidden" value={factor.id} />
                  <Button type="submit" variant="secondary">
                    Remover
                  </Button>
                </form>
              ) : (
                <span className="text-sm text-text-muted">
                  Fator obrigatório
                </span>
              )}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-3">
          <Link
            className="dv-button dv-button--primary dv-button--md"
            href="/auth/mfa/enroll?additional=1&next=%2Faccount%2Fsecurity"
          >
            Adicionar fator
          </Link>
          <Link className="self-center text-sm underline" href="/">
            Voltar ao dashboard
          </Link>
        </div>
      </Card>
    </main>
  );
}
