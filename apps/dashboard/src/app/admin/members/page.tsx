import { Alert, Button, Card } from "@devora/ui";
import { redirect } from "next/navigation";

import { requireDashboardAccess } from "../../../lib/auth/access";
import { hasPermission } from "../../../lib/auth/permissions";
import { createClient } from "../../../lib/supabase/server";
import { assignRole, removeRole } from "./actions";

export const dynamic = "force-dynamic";
const roleLabels = {
  administrador: "Administrador",
  socio: "Sócio",
  colaborador: "Colaborador",
  financeiro: "Financeiro",
} as const;

export default async function MembersAdminPage() {
  const access = await requireDashboardAccess();
  if (!(await hasPermission("roles.read", access.organization.id)))
    redirect("/");
  const canManage = await hasPermission("roles.manage", access.organization.id);
  const supabase = await createClient();
  const [{ data: members, error }, { data: assignments }] = await Promise.all([
    supabase
      .from("organization_members")
      .select("id,user_id,status")
      .eq("organization_id", access.organization.id)
      .order("created_at"),
    supabase
      .from("organization_member_roles")
      .select("membership_id,roles(slug)")
      .eq("organization_id", access.organization.id),
  ]);
  if (error)
    return (
      <main className="p-6">
        <Alert variant="error">Não foi possível carregar os membros.</Alert>
      </main>
    );
  return (
    <main className="min-h-screen px-4 py-10">
      <Card className="mx-auto max-w-5xl space-y-6">
        <header>
          <h1 className="text-2xl font-bold">Membros e papéis</h1>
          <p className="text-sm text-text-muted">
            Atribuições exigem AAL2 e `roles.manage`. Não é possível alterar os
            próprios papéis.
          </p>
        </header>
        {members?.length ? (
          <ul className="space-y-4">
            {members.map((member) => {
              const slugs =
                assignments
                  ?.filter((item) => item.membership_id === member.id)
                  .map((item) => item.roles?.slug)
                  .filter(Boolean) ?? [];
              const self = member.user_id === access.user.id;
              return (
                <li
                  className="space-y-3 rounded-lg border border-border p-4"
                  key={member.id}
                >
                  <div>
                    <p className="font-semibold">
                      Membro {member.user_id.slice(0, 8)}
                    </p>
                    <p className="text-sm text-text-muted">
                      Status: {member.status} · Papéis:{" "}
                      {slugs
                        .map(
                          (slug) => roleLabels[slug as keyof typeof roleLabels],
                        )
                        .join(", ") || "nenhum"}
                    </p>
                  </div>
                  {canManage && !self ? (
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(roleLabels).map(([slug, label]) =>
                        slugs.includes(slug) ? (
                          <form action={removeRole} key={slug}>
                            <input
                              name="membershipId"
                              type="hidden"
                              value={member.id}
                            />
                            <input name="roleSlug" type="hidden" value={slug} />
                            <Button size="sm" type="submit" variant="secondary">
                              Remover {label}
                            </Button>
                          </form>
                        ) : (
                          <form action={assignRole} key={slug}>
                            <input
                              name="membershipId"
                              type="hidden"
                              value={member.id}
                            />
                            <input name="roleSlug" type="hidden" value={slug} />
                            <Button size="sm" type="submit">
                              Atribuir {label}
                            </Button>
                          </form>
                        ),
                      )}
                    </div>
                  ) : (
                    <Alert variant="warning">
                      {self
                        ? "Autoalteração bloqueada."
                        : "Você não possui permissão para alterar papéis."}
                    </Alert>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <Alert variant="warning">Nenhum membro disponível.</Alert>
        )}
      </Card>
    </main>
  );
}
