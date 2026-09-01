import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, Card, Input, Label, Textarea } from "@devora/ui";
import { requireProposalsAccess } from "../../../../lib/proposals/access";
import {
  createTemplateVersion,
  saveTemplateSection,
  saveProposalTemplate,
} from "../../../../lib/proposals/actions";
import { createProposalsDb } from "../../../../lib/proposals/db";
export default async function TemplateDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await requireProposalsAccess();
  const s = await createProposalsDb();
  const [
    { data: rawTemplate },
    { data: rawSections },
    { data: rawItems },
    { data: rawVersions },
  ] = await Promise.all([
    s
      .from("proposal_templates")
      .select("*")
      .eq("organization_id", access.organization.id)
      .eq("id", id)
      .maybeSingle(),
    s
      .from("proposal_template_sections")
      .select("*")
      .eq("template_id", id)
      .order("position"),
    s
      .from("proposal_template_items")
      .select("*")
      .eq("template_id", id)
      .order("position"),
    s
      .from("proposal_template_versions")
      .select("version_number,created_at")
      .eq("template_id", id)
      .order("version_number", { ascending: false }),
  ]);
  const t = rawTemplate as {
    id: string;
    name: string;
    description: string | null;
    is_active: boolean;
  } | null;
  const sections = (rawSections ?? []) as Array<{
    id: string;
    position: number;
    title: string;
    is_visible: boolean;
    section_type: string;
    content: string;
  }>;
  const items = (rawItems ?? []) as Array<{ id: string }>;
  const versions = (rawVersions ?? []) as Array<{
    version_number: number;
    created_at: string;
  }>;
  if (!t) notFound();
  return (
    <>
      <header className="crm-page-header">
        <div>
          <p className="crm-eyebrow">Modelo</p>
          <h1>{t.name}</h1>
        </div>
        <Link href="/proposals/templates">Voltar</Link>
      </header>
      <Card>
        <form action={saveProposalTemplate} className="crm-form">
          <input type="hidden" name="id" value={id} />
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" defaultValue={t.name} required />
          </div>
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={t.description ?? ""}
            />
          </div>
          <label>
            <input type="checkbox" name="active" defaultChecked={t.is_active} />{" "}
            Ativo
          </label>
          <Button>Salvar</Button>
        </form>
      </Card>
      <Card>
        <h2>Conteúdo estruturado</h2>
        <p>
          {sections?.length ?? 0} seções · {items?.length ?? 0} itens. A edição
          detalhada usa a mesma estrutura segura das propostas.
        </p>
        {sections.map((v) => (
          <details key={v.id}>
            <summary>
              {v.position}. {v.title} · {v.is_visible ? "Visível" : "Oculta"}
            </summary>
            <form action={saveTemplateSection} className="crm-form">
              <input type="hidden" name="templateId" value={id} />
              <input type="hidden" name="sectionId" value={v.id} />
              <input type="hidden" name="sectionType" value={v.section_type} />
              <Label htmlFor={`tt-${v.id}`}>Título</Label>
              <Input
                id={`tt-${v.id}`}
                name="title"
                defaultValue={v.title}
                required
              />
              <Label htmlFor={`tc-${v.id}`}>Conteúdo</Label>
              <Textarea
                id={`tc-${v.id}`}
                name="content"
                defaultValue={v.content}
              />
              <label>
                <input
                  type="checkbox"
                  name="visible"
                  defaultChecked={v.is_visible}
                />{" "}
                Visível
              </label>
              <Button>Salvar seção</Button>
            </form>
          </details>
        ))}
      </Card>
      <Card>
        <h2>Versões do modelo</h2>
        <form action={createTemplateVersion}>
          <input type="hidden" name="templateId" value={id} />
          <input type="hidden" name="requestKey" value={crypto.randomUUID()} />
          <Button>Criar versão imutável</Button>
        </form>
        {versions?.map((v) => (
          <p key={v.version_number}>
            Versão {v.version_number} ·{" "}
            {new Date(v.created_at).toLocaleString("pt-BR")}
          </p>
        ))}
      </Card>
    </>
  );
}
