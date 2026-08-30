import { Button, Input, Label, Textarea } from "@devora/ui";
import type { ReactNode } from "react";
import {
  CRM_SOURCES,
  CRM_TRIAGE,
  sourceLabels,
  triageLabels,
} from "../../../lib/crm/constants";
type Option = { id: string; label: string };
const Field = ({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) => (
  <div className="crm-field">
    <Label htmlFor={id}>{label}</Label>
    {children}
  </div>
);
export function LeadCreateForm({
  action,
  members,
  companies,
  contacts,
}: {
  action: (data: FormData) => void | Promise<void>;
  members: Option[];
  companies: Option[];
  contacts: Option[];
}) {
  return (
    <form action={action} className="crm-form">
      <Field id="fullName" label="Nome completo">
        <Input
          id="fullName"
          name="fullName"
          required
          minLength={2}
          maxLength={120}
        />
      </Field>
      <Field id="email" label="E-mail">
        <Input id="email" name="email" type="email" required />
      </Field>
      <Field id="phone" label="Telefone">
        <Input id="phone" name="phone" />
      </Field>
      <Field id="companyText" label="Empresa informada">
        <Input id="companyText" name="companyText" />
      </Field>
      <Field id="serviceInterest" label="Interesse">
        <select id="serviceInterest" name="serviceInterest" required>
          <option value="digital_presence">Presença digital</option>
          <option value="business_systems">Sistemas</option>
          <option value="automation">Automação</option>
          <option value="other">Outro</option>
        </select>
      </Field>
      <Field id="source" label="Origem">
        <select id="source" name="source" required>
          {CRM_SOURCES.filter((v) => v !== "website").map((v) => (
            <option key={v} value={v}>
              {sourceLabels[v]}
            </option>
          ))}
        </select>
      </Field>
      <Field id="sourceDetail" label="Detalhe da origem (somente Outro)">
        <Input id="sourceDetail" name="sourceDetail" maxLength={120} />
      </Field>
      <Field id="assignedMembershipId" label="Responsável">
        <Select
          id="assignedMembershipId"
          name="assignedMembershipId"
          options={members}
        />
      </Field>
      <Field id="companyId" label="Empresa vinculada">
        <Select id="companyId" name="companyId" options={companies} />
      </Field>
      <Field id="contactId" label="Contato vinculado">
        <Select id="contactId" name="contactId" options={contacts} />
      </Field>
      <Field id="message" label="Contexto">
        <Textarea
          id="message"
          name="message"
          required
          minLength={20}
          maxLength={2000}
        />
      </Field>
      <Button type="submit">Cadastrar lead</Button>
    </form>
  );
}
function Select({
  id,
  name,
  options,
  defaultValue,
}: {
  id: string;
  name: string;
  options: Option[];
  defaultValue?: string | null;
}) {
  return (
    <select id={id} name={name} defaultValue={defaultValue ?? ""}>
      <option value="">Não definido</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
export function LeadUpdateForm({
  action,
  lead,
  members,
  companies,
  contacts,
}: {
  action: (data: FormData) => void | Promise<void>;
  lead: {
    id: string;
    version: number;
    triage_status: string;
    disqualification_reason: string | null;
    assigned_membership_id: string | null;
    company_id: string | null;
    contact_id: string | null;
    archived_at: string | null;
  };
  members: Option[];
  companies: Option[];
  contacts: Option[];
}) {
  return (
    <form action={action} className="crm-form">
      <input type="hidden" name="id" value={lead.id} />
      <input type="hidden" name="version" value={lead.version} />
      <Field id="triageStatus" label="Triagem">
        <select
          id="triageStatus"
          name="triageStatus"
          defaultValue={lead.triage_status}
        >
          {CRM_TRIAGE.map((v) => (
            <option key={v} value={v}>
              {triageLabels[v]}
            </option>
          ))}
        </select>
      </Field>
      <Field id="disqualificationReason" label="Motivo da desqualificação">
        <Textarea
          id="disqualificationReason"
          name="disqualificationReason"
          maxLength={500}
          defaultValue={lead.disqualification_reason ?? ""}
        />
      </Field>
      <Field id="assignedMembershipId" label="Responsável">
        <Select
          id="assignedMembershipId"
          name="assignedMembershipId"
          options={members}
          defaultValue={lead.assigned_membership_id}
        />
      </Field>
      <Field id="companyId" label="Empresa">
        <Select
          id="companyId"
          name="companyId"
          options={companies}
          defaultValue={lead.company_id}
        />
      </Field>
      <Field id="contactId" label="Contato">
        <Select
          id="contactId"
          name="contactId"
          options={contacts}
          defaultValue={lead.contact_id}
        />
      </Field>
      <label className="crm-check">
        <input
          type="checkbox"
          name="archived"
          value="true"
          defaultChecked={Boolean(lead.archived_at)}
        />{" "}
        Arquivado
      </label>
      <Button type="submit">Salvar alterações</Button>
    </form>
  );
}
export function CompanyForm({
  action,
  value,
}: {
  action: (data: FormData) => void | Promise<void>;
  value?: {
    id: string;
    display_name: string;
    website: string | null;
    email: string | null;
    phone: string | null;
    source: string | null;
    source_detail: string | null;
    notes: string | null;
    state: string;
  };
}) {
  return (
    <form action={action} className="crm-form">
      {value ? <input type="hidden" name="id" value={value.id} /> : null}
      <Field id="displayName" label="Nome da empresa">
        <Input
          id="displayName"
          name="displayName"
          required
          defaultValue={value?.display_name}
        />
      </Field>
      <Field id="website" label="Site">
        <Input
          id="website"
          name="website"
          type="url"
          defaultValue={value?.website ?? ""}
        />
      </Field>
      <Field id="email" label="E-mail geral">
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={value?.email ?? ""}
        />
      </Field>
      <Field id="phone" label="Telefone">
        <Input id="phone" name="phone" defaultValue={value?.phone ?? ""} />
      </Field>
      <Field id="source" label="Origem">
        <select id="source" name="source" defaultValue={value?.source ?? ""}>
          <option value="">Não informada</option>
          {CRM_SOURCES.map((v) => (
            <option key={v} value={v}>
              {sourceLabels[v]}
            </option>
          ))}
        </select>
      </Field>
      <Field id="sourceDetail" label="Detalhe da origem">
        <Input
          id="sourceDetail"
          name="sourceDetail"
          defaultValue={value?.source_detail ?? ""}
        />
      </Field>
      <Field id="notes" label="Observação comercial">
        <Textarea
          id="notes"
          name="notes"
          maxLength={1000}
          defaultValue={value?.notes ?? ""}
        />
      </Field>
      {value ? (
        <Field id="state" label="Estado">
          <select id="state" name="state" defaultValue={value.state}>
            <option value="active">Ativa</option>
            <option value="archived">Arquivada</option>
          </select>
        </Field>
      ) : null}
      <Button type="submit">Salvar empresa</Button>
    </form>
  );
}
export function ContactForm({
  action,
  companies,
  value,
}: {
  action: (data: FormData) => void | Promise<void>;
  companies: Option[];
  value?: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    job_title: string | null;
    company_id: string | null;
    is_primary: boolean;
    state: string;
  };
}) {
  return (
    <form action={action} className="crm-form">
      {value ? <input type="hidden" name="id" value={value.id} /> : null}
      <Field id="fullName" label="Nome">
        <Input
          id="fullName"
          name="fullName"
          required
          defaultValue={value?.full_name}
        />
      </Field>
      <Field id="email" label="E-mail">
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={value?.email ?? ""}
        />
      </Field>
      <Field id="phone" label="Telefone">
        <Input id="phone" name="phone" defaultValue={value?.phone ?? ""} />
      </Field>
      <Field id="jobTitle" label="Cargo ou função">
        <Input
          id="jobTitle"
          name="jobTitle"
          defaultValue={value?.job_title ?? ""}
        />
      </Field>
      <Field id="companyId" label="Empresa">
        <Select
          id="companyId"
          name="companyId"
          options={companies}
          defaultValue={value?.company_id}
        />
      </Field>
      <label className="crm-check">
        <input
          type="checkbox"
          name="isPrimary"
          defaultChecked={value?.is_primary}
        />{" "}
        Contato principal
      </label>
      {value ? (
        <Field id="state" label="Estado">
          <select id="state" name="state" defaultValue={value.state}>
            <option value="active">Ativo</option>
            <option value="archived">Arquivado</option>
          </select>
        </Field>
      ) : null}
      <Button type="submit">Salvar contato</Button>
    </form>
  );
}
