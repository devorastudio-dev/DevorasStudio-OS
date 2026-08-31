import { Alert, Button, Card, Input, Label, Textarea } from "@devora/ui";
import { hasPermission } from "../../../lib/auth/permissions";
import { saveService } from "../../../lib/proposals/actions";
import { requireProposalsAccess } from "../../../lib/proposals/access";
import {
  formatMoney,
  SERVICE_UNITS,
  unitLabels,
} from "../../../lib/proposals/validation";
import { createClient } from "../../../lib/supabase/server";
export default async function Services({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const access = await requireProposalsAccess();
  const canWrite = await hasPermission(
    "proposals.write",
    access.organization.id,
  );
  const q = await searchParams;
  const s = await createClient();
  const { data, error } = await s
    .from("services")
    .select("*")
    .eq("organization_id", access.organization.id)
    .order("is_active", { ascending: false })
    .order("name");
  return (
    <>
      <header className="crm-page-header">
        <div>
          <p className="crm-eyebrow">Configuração comercial</p>
          <h1>Catálogo de serviços</h1>
          <p>Preços são padrões; itens mantêm snapshots independentes.</p>
        </div>
      </header>
      {q.saved ? (
        <Alert variant="success">Serviço salvo.</Alert>
      ) : q.error || error ? (
        <Alert variant="error">Não foi possível concluir a operação.</Alert>
      ) : null}
      {canWrite ? (
        <Card>
          <h2>Novo serviço</h2>
          <ServiceForm />
        </Card>
      ) : null}
      <section className="crm-grid">
        {data?.length ? (
          data.map((v) => (
            <Card key={v.id}>
              <h2>{v.name}</h2>
              <p>
                {v.description ?? "Sem descrição"} ·{" "}
                {formatMoney(v.default_price)} · {unitLabels[v.default_unit]}
              </p>
              {canWrite ? (
                <ServiceForm service={v} />
              ) : (
                <p>{v.is_active ? "Ativo" : "Inativo"}</p>
              )}
            </Card>
          ))
        ) : (
          <Alert variant="warning">Nenhum serviço cadastrado.</Alert>
        )}
      </section>
    </>
  );
}
function ServiceForm({
  service,
}: {
  service?: {
    id: string;
    name: string;
    description: string | null;
    default_unit: (typeof SERVICE_UNITS)[number];
    default_price: number;
    is_active: boolean;
  };
}) {
  return (
    <form action={saveService} className="crm-form">
      <input type="hidden" name="id" value={service?.id ?? ""} />
      <div>
        <Label htmlFor={`name-${service?.id ?? "new"}`}>Nome</Label>
        <Input
          id={`name-${service?.id ?? "new"}`}
          name="name"
          defaultValue={service?.name}
          required
        />
      </div>
      <div>
        <Label htmlFor={`description-${service?.id ?? "new"}`}>Descrição</Label>
        <Textarea
          id={`description-${service?.id ?? "new"}`}
          name="description"
          defaultValue={service?.description ?? ""}
        />
      </div>
      <div>
        <Label htmlFor={`unit-${service?.id ?? "new"}`}>Unidade</Label>
        <select
          id={`unit-${service?.id ?? "new"}`}
          name="unit"
          defaultValue={service?.default_unit ?? "project"}
        >
          {SERVICE_UNITS.map((v) => (
            <option key={v} value={v}>
              {unitLabels[v]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor={`price-${service?.id ?? "new"}`}>Preço padrão</Label>
        <Input
          id={`price-${service?.id ?? "new"}`}
          name="price"
          type="number"
          min="0"
          step=".01"
          defaultValue={service?.default_price ?? 0}
        />
      </div>
      <label>
        <input
          type="checkbox"
          name="active"
          defaultChecked={service?.is_active ?? true}
        />{" "}
        Ativo
      </label>
      <Button>Salvar</Button>
    </form>
  );
}
