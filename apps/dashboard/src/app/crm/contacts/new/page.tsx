import { Alert, Card } from "@devora/ui";
import { requireCrmAccess } from "../../../../lib/crm/access";
import { createClient } from "../../../../lib/supabase/server";
import { createContact } from "../../../../lib/crm/actions";
import { ContactForm } from "../../_components/forms";
export default async function NewContact({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const access = await requireCrmAccess("crm.write");
  const supabase = await createClient();
  const { data } = await supabase
    .from("crm_companies")
    .select("id,display_name")
    .eq("organization_id", access.organization.id)
    .eq("state", "active")
    .order("display_name");
  const query = await searchParams;
  return (
    <>
      <header className="crm-page-header">
        <div>
          <p className="crm-eyebrow">Contatos</p>
          <h1>Novo contato</h1>
        </div>
      </header>
      {query.error ? (
        <Alert variant="error">Revise os campos e tente novamente.</Alert>
      ) : null}
      <Card>
        <ContactForm
          action={createContact}
          companies={(data ?? []).map((v) => ({
            id: v.id,
            label: v.display_name,
          }))}
        />
      </Card>
    </>
  );
}
