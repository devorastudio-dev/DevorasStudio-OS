import Link from "next/link";
import { Alert, Card } from "@devora/ui";
import { notFound } from "next/navigation";
import { requireCrmAccess } from "../../../../lib/crm/access";
import { createClient } from "../../../../lib/supabase/server";
export default async function ClientDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ converted?: string }>;
}) {
  const access = await requireCrmAccess();
  const { id } = await params;
  const supabase = await createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("organization_id", access.organization.id)
    .eq("id", id)
    .maybeSingle();
  if (!client) notFound();
  const [
    company,
    contact,
    lead,
    sourceOpportunity,
    relations,
    activities,
    tasks,
  ] = await Promise.all([
    client.company_id
      ? supabase
          .from("crm_companies")
          .select("id,display_name,email,phone")
          .eq("id", client.company_id)
          .single()
      : Promise.resolve({ data: null }),
    client.primary_contact_id
      ? supabase
          .from("crm_contacts")
          .select("id,full_name,email,phone")
          .eq("id", client.primary_contact_id)
          .single()
      : Promise.resolve({ data: null }),
    client.source_lead_id
      ? supabase
          .from("leads")
          .select("id,full_name,source")
          .eq("id", client.source_lead_id)
          .single()
      : Promise.resolve({ data: null }),
    supabase
      .from("opportunities")
      .select("id,title,estimated_value")
      .eq("id", client.source_opportunity_id)
      .single(),
    supabase
      .from("client_opportunities")
      .select("opportunity_id,linked_at")
      .eq("organization_id", access.organization.id)
      .eq("client_id", id)
      .order("linked_at", { ascending: false }),
    supabase
      .from("crm_activities")
      .select("id,title,activity_type,occurred_at")
      .eq("organization_id", access.organization.id)
      .or(
        [
          `opportunity_id.eq.${client.source_opportunity_id}`,
          client.company_id ? `company_id.eq.${client.company_id}` : null,
          client.primary_contact_id
            ? `contact_id.eq.${client.primary_contact_id}`
            : null,
          client.source_lead_id ? `lead_id.eq.${client.source_lead_id}` : null,
        ]
          .filter(Boolean)
          .join(","),
      )
      .order("occurred_at", { ascending: false })
      .limit(20),
    supabase
      .from("crm_tasks")
      .select("id,title,status,due_at")
      .eq("organization_id", access.organization.id)
      .or(
        [
          `opportunity_id.eq.${client.source_opportunity_id}`,
          client.company_id ? `company_id.eq.${client.company_id}` : null,
          client.primary_contact_id
            ? `contact_id.eq.${client.primary_contact_id}`
            : null,
          client.source_lead_id ? `lead_id.eq.${client.source_lead_id}` : null,
        ]
          .filter(Boolean)
          .join(","),
      )
      .order("due_at")
      .limit(20),
  ]);
  const opportunityIds = (relations.data ?? []).map((v) => v.opportunity_id);
  const { data: opportunities } = opportunityIds.length
    ? await supabase
        .from("opportunities")
        .select("id,title,estimated_value,closed_at")
        .in("id", opportunityIds)
    : { data: [] };
  const title =
    company.data?.display_name ??
    contact.data?.full_name ??
    lead.data?.full_name ??
    "Cliente";
  const query = await searchParams;
  return (
    <>
      <header className="crm-page-header">
        <div>
          <p className="crm-eyebrow">Cliente</p>
          <h1>{title}</h1>
          <p>
            Convertido em{" "}
            {new Date(client.converted_at).toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="crm-inline-links">
          <Link href={`/proposals/new?client=${id}`}>Nova proposta</Link>
          <Link href="/crm/clients">Voltar aos clientes</Link>
        </div>
      </header>
      {query.converted ? (
        <Alert variant="success">Cliente confirmado com sucesso.</Alert>
      ) : null}
      <div className="crm-detail-grid">
        <Card>
          <h2>Relacionamento</h2>
          <dl className="crm-details">
            <dt>Empresa</dt>
            <dd>
              {company.data ? (
                <Link href={`/crm/companies/${company.data.id}`}>
                  {company.data.display_name}
                </Link>
              ) : (
                "Cliente pessoa física"
              )}
            </dd>
            <dt>Contato principal</dt>
            <dd>
              {contact.data ? (
                <Link href={`/crm/contacts/${contact.data.id}`}>
                  {contact.data.full_name}
                </Link>
              ) : (
                "Não vinculado"
              )}
            </dd>
            <dt>Responsável</dt>
            <dd>
              {client.assigned_membership_id
                ? `Membro ${client.assigned_membership_id.slice(0, 8)}`
                : "Sem responsável"}
            </dd>
            <dt>Lead de origem</dt>
            <dd>
              {lead.data ? (
                <Link href={`/crm/leads/${lead.data.id}`}>
                  {lead.data.full_name}
                </Link>
              ) : (
                "Sem lead"
              )}
            </dd>
            <dt>Oportunidade de origem</dt>
            <dd>
              <Link href={`/crm/opportunities/${sourceOpportunity.data?.id}`}>
                {sourceOpportunity.data?.title}
              </Link>
            </dd>
          </dl>
        </Card>
        <Card>
          <h2>Oportunidades</h2>
          {opportunities?.length ? (
            <ul className="pipeline-history">
              {opportunities.map((v) => (
                <li key={v.id}>
                  <Link href={`/crm/opportunities/${v.id}`}>{v.title}</Link>
                  <span>
                    {v.closed_at
                      ? new Date(v.closed_at).toLocaleDateString("pt-BR")
                      : "Em aberto"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p>Nenhuma oportunidade vinculada.</p>
          )}
        </Card>
      </div>
      <section className="crm-grid">
        <Card>
          <h2>Histórico de atividades</h2>
          {activities.data?.length ? (
            <ul className="pipeline-history">
              {activities.data.map((v) => (
                <li key={v.id}>
                  <strong>{v.title}</strong>
                  <span>{new Date(v.occurred_at).toLocaleString("pt-BR")}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>Sem atividades relacionadas.</p>
          )}
        </Card>
        <Card>
          <h2>Tarefas relacionadas</h2>
          {tasks.data?.length ? (
            <ul className="pipeline-history">
              {tasks.data.map((v) => (
                <li key={v.id}>
                  <strong>{v.title}</strong>
                  <span>
                    {v.status} · {new Date(v.due_at).toLocaleString("pt-BR")}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p>Sem tarefas relacionadas.</p>
          )}
        </Card>
      </section>
    </>
  );
}
