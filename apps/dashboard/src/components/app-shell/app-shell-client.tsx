"use client";
import * as Collapsible from "@radix-ui/react-collapsible";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Tooltip from "@radix-ui/react-tooltip";
import {
  AddressBook,
  Buildings,
  CaretDown,
  ChartLine,
  CheckSquare,
  FileText,
  House,
  Kanban,
  List,
  Package,
  ShieldCheck,
  SidebarSimple,
  SignOut,
  Users,
  X,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import { useEffect, useState } from "react";

type Permissions = {
  crmRead: boolean;
  crmWrite: boolean;
  proposalsRead: boolean;
  proposalsWrite: boolean;
  auditRead: boolean;
  rolesRead: boolean;
};
type Icon = ComponentType<{
  size?: number;
  weight?: "regular" | "fill";
  "aria-hidden"?: boolean;
}>;
type Item = { href: string; label: string; icon: Icon };
const overview: Item[] = [{ href: "/", label: "Dashboard", icon: House }];
const commercial: Item[] = [
  { href: "/crm", label: "Visão comercial", icon: ChartLine },
  { href: "/crm/leads", label: "Leads", icon: Users },
  { href: "/crm/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/crm/tasks", label: "Tarefas", icon: CheckSquare },
  { href: "/crm/clients", label: "Clientes", icon: AddressBook },
  { href: "/crm/companies", label: "Empresas", icon: Buildings },
  { href: "/crm/contacts", label: "Contatos", icon: Users },
];
const proposals: Item[] = [
  { href: "/proposals", label: "Propostas", icon: FileText },
  { href: "/proposals/services", label: "Serviços", icon: Package },
];

export function AppShellClient({
  access,
  permissions,
  logoutAction,
  children,
}: {
  access: { organizationName: string; profileName: string | null };
  permissions: Permissions;
  logoutAction: () => Promise<void>;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("devora-sidebar-collapsed") === "true";
    const frame = requestAnimationFrame(() => setCollapsed(saved));
    return () => cancelAnimationFrame(frame);
  }, []);
  function toggle() {
    setCollapsed((value) => {
      localStorage.setItem("devora-sidebar-collapsed", String(!value));
      return !value;
    });
  }
  const groups = [
    { label: "Visão geral", items: overview, show: true },
    { label: "Comercial", items: commercial, show: permissions.crmRead },
    { label: "Propostas", items: proposals, show: permissions.proposalsRead },
    {
      label: "Administração",
      items: [
        ...(permissions.auditRead
          ? [{ href: "/admin/audit", label: "Auditoria", icon: List }]
          : []),
        ...(permissions.rolesRead
          ? [{ href: "/admin/members", label: "Membros", icon: ShieldCheck }]
          : []),
      ],
      show: permissions.auditRead || permissions.rolesRead,
    },
  ];
  const navigation = (
    <nav className="app-nav" aria-label="Navegação principal">
      {groups
        .filter((g) => g.show)
        .map((group) => (
          <NavGroup
            key={group.label}
            label={group.label}
            items={group.items}
            pathname={pathname}
            collapsed={collapsed}
            onNavigate={() => setMobileOpen(false)}
          />
        ))}
    </nav>
  );
  return (
    <Tooltip.Provider delayDuration={250}>
      <div className={`app-shell${collapsed ? " is-collapsed" : ""}`}>
        <a className="skip-link" href="#main-content">
          Pular para o conteúdo
        </a>
        <aside className="app-sidebar" aria-label="Barra lateral">
          <Brand compact={collapsed} />
          <div className="app-sidebar-scroll">{navigation}</div>
          <button
            className="sidebar-toggle"
            type="button"
            onClick={toggle}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            <SidebarSimple size={20} aria-hidden />
            <span>{collapsed ? "Expandir" : "Recolher"}</span>
          </button>
          <Account
            access={access}
            logoutAction={logoutAction}
            collapsed={collapsed}
          />
        </aside>
        <div className="app-workspace">
          <header className="app-topbar">
            <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
              <Dialog.Trigger asChild>
                <button
                  className="icon-button mobile-menu-trigger"
                  aria-label="Abrir menu"
                >
                  <List size={23} aria-hidden />
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="sheet-overlay" />
                <Dialog.Content className="mobile-sheet">
                  <Dialog.Title className="sr-only">
                    Menu principal
                  </Dialog.Title>
                  <div className="mobile-sheet-header">
                    <Brand />
                    <Dialog.Close asChild>
                      <button className="icon-button" aria-label="Fechar menu">
                        <X size={22} aria-hidden />
                      </button>
                    </Dialog.Close>
                  </div>
                  {navigation}
                  <Account access={access} logoutAction={logoutAction} />
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
            <Breadcrumbs pathname={pathname} />
            <span className="topbar-organization">
              {access.organizationName}
            </span>
          </header>
          <main id="main-content" className="app-content">
            {children}
          </main>
        </div>
      </div>
    </Tooltip.Provider>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="app-brand" href="/" aria-label="Devora OS — Dashboard">
      <span className="app-brand-mark">D</span>
      {compact ? null : (
        <span>
          DEVORA <b>OS</b>
        </span>
      )}
    </Link>
  );
}
function NavGroup({
  label,
  items,
  pathname,
  collapsed,
  onNavigate,
}: {
  label: string;
  items: Item[];
  pathname: string;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const active = items.some((i) => isActive(pathname, i.href));
  return (
    <Collapsible.Root
      className="nav-group"
      defaultOpen={active || label === "Visão geral"}
    >
      <Collapsible.Trigger className="nav-group-trigger">
        <span>{collapsed ? "" : label}</span>
        {collapsed ? null : <CaretDown size={14} aria-hidden />}
      </Collapsible.Trigger>
      <Collapsible.Content>
        {items.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            active={isActive(pathname, item.href)}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
function NavItem({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: Item;
  active: boolean;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  const link = (
    <Link
      className={`nav-item${active ? " is-active" : ""}`}
      href={item.href}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
    >
      <Icon size={20} weight={active ? "fill" : "regular"} aria-hidden />
      <span>{item.label}</span>
    </Link>
  );
  return collapsed ? (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{link}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className="app-tooltip" side="right" sideOffset={8}>
          {item.label}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  ) : (
    link
  );
}
function Account({
  access,
  logoutAction,
  collapsed = false,
}: {
  access: { organizationName: string; profileName: string | null };
  logoutAction: () => Promise<void>;
  collapsed?: boolean;
}) {
  const initials = (access.profileName ?? access.organizationName)
    .split(/\s+/)
    .slice(0, 2)
    .map((v) => v[0])
    .join("")
    .toUpperCase();
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="account-trigger">
        <span className="account-avatar">{initials}</span>
        {collapsed ? null : (
          <span>
            <strong>{access.profileName ?? "Conta interna"}</strong>
            <small>{access.organizationName}</small>
          </span>
        )}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="account-menu"
          sideOffset={8}
          align="end"
        >
          <DropdownMenu.Item asChild>
            <Link href="/account/security">
              <ShieldCheck size={18} aria-hidden /> Segurança
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <form action={logoutAction}>
            <button type="submit">
              <SignOut size={18} aria-hidden /> Sair
            </button>
          </form>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
function Breadcrumbs({ pathname }: { pathname: string }) {
  const names: Record<string, string> = {
    crm: "CRM",
    leads: "Leads",
    pipeline: "Pipeline",
    tasks: "Tarefas",
    clients: "Clientes",
    companies: "Empresas",
    contacts: "Contatos",
    opportunities: "Oportunidades",
    proposals: "Propostas",
    services: "Serviços",
    admin: "Administração",
    audit: "Auditoria",
    members: "Membros",
    account: "Conta",
    security: "Segurança",
    new: "Novo",
  };
  const parts = pathname
    .split("/")
    .filter(Boolean)
    .filter((v) => !/^[-0-9a-f]{20,}$/i.test(v));
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <Link href="/">Início</Link>
      {parts.map((part, index) => (
        <span key={`${part}-${index}`}>
          <span aria-hidden>/</span>
          <span>{names[part] ?? part}</span>
        </span>
      ))}
    </nav>
  );
}
function isActive(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}
