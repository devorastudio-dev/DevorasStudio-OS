import { Button, Input, Label } from "@devora/ui";
import {
  CRM_SOURCES,
  CRM_TRIAGE,
  sourceLabels,
  triageLabels,
} from "../../../lib/crm/constants";
export function CrmFilters({
  kind,
  defaults,
}: {
  kind: "leads" | "companies" | "contacts";
  defaults: Record<string, string | undefined>;
}) {
  return (
    <form className="crm-filters">
      <div>
        <Label htmlFor="q">Buscar</Label>
        <Input
          id="q"
          name="q"
          defaultValue={defaults.q}
          placeholder="Nome, e-mail ou telefone"
        />
      </div>
      {kind === "leads" ? (
        <>
          <div>
            <Label htmlFor="triage">Triagem</Label>
            <select
              id="triage"
              name="triage"
              defaultValue={defaults.triage ?? ""}
            >
              <option value="">Todas</option>
              {CRM_TRIAGE.map((v) => (
                <option key={v} value={v}>
                  {triageLabels[v]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="source">Origem</Label>
            <select
              id="source"
              name="source"
              defaultValue={defaults.source ?? ""}
            >
              <option value="">Todas</option>
              {CRM_SOURCES.map((v) => (
                <option key={v} value={v}>
                  {sourceLabels[v]}
                </option>
              ))}
            </select>
          </div>
        </>
      ) : (
        <div>
          <Label htmlFor="state">Estado</Label>
          <select id="state" name="state" defaultValue={defaults.state ?? ""}>
            <option value="">Todos</option>
            <option value="active">Ativos</option>
            <option value="archived">Arquivados</option>
          </select>
        </div>
      )}
      <Button type="submit">Filtrar</Button>
    </form>
  );
}
