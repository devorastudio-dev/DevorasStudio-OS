import Link from "next/link";
import { Card } from "@devora/ui";
import { requireCrmAccess } from "../../lib/crm/access";
import { createClient } from "../../lib/supabase/server";

export const dynamic = "force-dynamic";
export default async function CrmOverview() {
  const access = await requireCrmAccess();
  const supabase = await createClient();
  const [newLeads, review, qualified, unassigned, companies, contacts] =
    await Promise.all([
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", access.organization.id)
        .eq("triage_status", "new")
        .is("archived_at", null),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", access.organization.id)
        .eq("triage_status", "in_review")
        .is("archived_at", null),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", access.organization.id)
        .eq("triage_status", "qualified")
        .is("archived_at", null),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", access.organization.id)
        .is("assigned_membership_id", null)
        .is("archived_at", null),
      supabase
        .from("crm_companies")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", access.organization.id)
        .eq("state", "active"),
      supabase
        .from("crm_contacts")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", access.organization.id)
        .eq("state", "active"),
    ]);
  const metrics = [
    ["Novos leads", newLeads.count],
    ["Em triagem", review.count],
    ["Qualificados", qualified.count],
    ["Sem responsável", unassigned.count],
    ["Empresas ativas", companies.count],
    ["Contatos ativos", contacts.count],
  ];
  return (
    <>
      <header className="crm-page-header">
        <div>
          <p className="crm-eyebrow">Visão geral</p>
          <h1>Painel comercial</h1>
          <p>Indicadores atuais da organização, calculados no servidor.</p>
        </div>
      </header>
      <section aria-label="Indicadores do CRM" className="crm-metrics">
        {metrics.map(([label, value]) => (
          <Card key={label}>
            <span>{label}</span>
            <strong>{value ?? 0}</strong>
          </Card>
        ))}
      </section>
      <section className="crm-grid">
        <Card>
          <h2>Triagem de leads</h2>
          <p>
            Revise novas entradas, atribua responsáveis e registre a
            qualificação.
          </p>
          <Link href="/crm/leads">Abrir leads</Link>
        </Card>
        <Card>
          <h2>Base comercial</h2>
          <p>
            Organize empresas e contatos sem confundi-los com o tenant do
            sistema.
          </p>
          <div className="crm-inline-links">
            <Link href="/crm/companies">Empresas</Link>
            <Link href="/crm/contacts">Contatos</Link>
          </div>
        </Card>
      </section>
    </>
  );
}
