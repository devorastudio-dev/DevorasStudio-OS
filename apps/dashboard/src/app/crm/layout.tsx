import Link from "next/link";
import type { ReactNode } from "react";
import { requireCrmAccess } from "../../lib/crm/access";
import { hasPermission } from "../../lib/auth/permissions";
import { logoutAction } from "../auth/actions";

export default async function CrmLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const access = await requireCrmAccess();
  const canWrite = await hasPermission("crm.write", access.organization.id);
  return (
    <div className="crm-shell">
      <a className="skip-link" href="#crm-content">
        Pular para o conteúdo
      </a>
      <aside className="crm-sidebar">
        <Link className="crm-brand" href="/">
          DEVORA <span>OS</span>
        </Link>
        <nav aria-label="Navegação do CRM">
          <Link href="/crm">Visão geral</Link>
          <Link href="/crm/leads">Leads</Link>
          <Link href="/crm/pipeline">Pipeline</Link>
          <Link href="/crm/clients">Clientes</Link>
          <Link href="/crm/tasks">Tarefas</Link>
          <Link href="/crm/companies">Empresas</Link>
          <Link href="/crm/contacts">Contatos</Link>
        </nav>
        <div className="crm-sidebar-footer">
          <span>{access.organization.name}</span>
          <form action={logoutAction}>
            <button type="submit">Sair</button>
          </form>
        </div>
      </aside>
      <div className="crm-workspace">
        <header className="crm-topbar">
          <div>
            <strong>CRM</strong>
            <span>Operação comercial</span>
          </div>
          {canWrite ? (
            <Link className="crm-primary-link" href="/crm/leads/new">
              Novo lead
            </Link>
          ) : null}
        </header>
        <main id="crm-content" className="crm-content">
          {children}
        </main>
      </div>
    </div>
  );
}
