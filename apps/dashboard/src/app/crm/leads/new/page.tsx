import { Alert, Card } from "@devora/ui";
import { requireCrmAccess } from "../../../../lib/crm/access";
import { createClient } from "../../../../lib/supabase/server";
import { createLead } from "../../../../lib/crm/actions";
import { LeadCreateForm } from "../../_components/forms";
export default async function NewLeadPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const access = await requireCrmAccess("crm.write");
  const supabase = await createClient();
  const [members, companies, contacts] = await Promise.all([
    supabase
      .from("organization_members")
      .select("id,user_id")
      .eq("organization_id", access.organization.id)
      .eq("status", "active"),
    supabase
      .from("crm_companies")
      .select("id,display_name")
      .eq("organization_id", access.organization.id)
      .eq("state", "active")
      .order("display_name"),
    supabase
      .from("crm_contacts")
      .select("id,full_name")
      .eq("organization_id", access.organization.id)
      .eq("state", "active")
      .order("full_name"),
  ]);
  const query = await searchParams;
  return (
    <>
      <header className="crm-page-header">
        <div>
          <p className="crm-eyebrow">Leads</p>
          <h1>Novo lead manual</h1>
          <p>A organização e o autor são derivados da sessão.</p>
        </div>
      </header>
      {query.error ? (
        <Alert variant="error">Revise os campos e tente novamente.</Alert>
      ) : null}
      <Card>
        <LeadCreateForm
          action={createLead}
          members={(members.data ?? []).map((v) => ({
            id: v.id,
            label: `Membro ${v.user_id.slice(0, 8)}`,
          }))}
          companies={(companies.data ?? []).map((v) => ({
            id: v.id,
            label: v.display_name,
          }))}
          contacts={(contacts.data ?? []).map((v) => ({
            id: v.id,
            label: v.full_name,
          }))}
        />
      </Card>
    </>
  );
}
