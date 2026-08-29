import { Button, Card } from "@devora/ui";

import { requireDashboardAccess } from "../lib/auth/access";
import { logoutAction } from "./auth/actions";

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  const access = await requireDashboardAccess();

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <Card className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-2">
          <p className="text-sm font-bold text-brand-700">Sessão autenticada</p>
          <h1 className="text-3xl font-bold">Devora OS</h1>
          <p className="text-text-muted">
            Olá, {access.profileName ?? "pessoa convidada"}.
          </p>
        </header>
        <section aria-labelledby="organization-title" className="space-y-2">
          <h2 className="text-lg font-bold" id="organization-title">
            Organização ativa
          </h2>
          <p>{access.organization.name}</p>
        </section>
        <form action={logoutAction}>
          <Button type="submit" variant="secondary">
            Sair
          </Button>
        </form>
      </Card>
    </main>
  );
}
