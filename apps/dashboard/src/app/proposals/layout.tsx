import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAction } from "../auth/actions";
import { hasPermission } from "../../lib/auth/permissions";
import { requireProposalsAccess } from "../../lib/proposals/access";
export default async function ProposalsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const access = await requireProposalsAccess();
  const canWrite = await hasPermission(
    "proposals.write",
    access.organization.id,
  );
  return (
    <div className="crm-shell">
      <a className="skip-link" href="#proposal-content">
        Pular para o conteúdo
      </a>
      <aside className="crm-sidebar">
        <Link className="crm-brand" href="/">
          DEVORA <span>OS</span>
        </Link>
        <nav aria-label="Navegação de propostas">
          <Link href="/crm">CRM</Link>
          <Link href="/proposals">Propostas</Link>
          <Link href="/proposals/services">Serviços</Link>
        </nav>
        <div className="crm-sidebar-footer">
          <span>{access.organization.name}</span>
          <form action={logoutAction}>
            <button>Sair</button>
          </form>
        </div>
      </aside>
      <div className="crm-workspace">
        <header className="crm-topbar">
          <div>
            <strong>Propostas</strong>
            <span>Operação comercial estruturada</span>
          </div>
          {canWrite ? (
            <Link className="crm-primary-link" href="/proposals/new">
              Nova proposta
            </Link>
          ) : null}
        </header>
        <main id="proposal-content" className="crm-content">
          {children}
        </main>
      </div>
    </div>
  );
}
