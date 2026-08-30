import { Alert, Card } from "@devora/ui";
import { requireCrmAccess } from "../../../../lib/crm/access";
import { createCompany } from "../../../../lib/crm/actions";
import { CompanyForm } from "../../_components/forms";
export default async function NewCompany({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireCrmAccess("crm.write");
  const query = await searchParams;
  return (
    <>
      <header className="crm-page-header">
        <div>
          <p className="crm-eyebrow">Empresas</p>
          <h1>Nova empresa</h1>
        </div>
      </header>
      {query.error ? (
        <Alert variant="error">Revise os campos e tente novamente.</Alert>
      ) : null}
      <Card>
        <CompanyForm action={createCompany} />
      </Card>
    </>
  );
}
