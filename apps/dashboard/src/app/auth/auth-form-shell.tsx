import { Card } from "@devora/ui";
import { ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";

export function AuthFormShell({
  children,
  description,
  title,
}: Readonly<{
  children: ReactNode;
  description: string;
  title: string;
}>) {
  return (
    <main className="auth-layout">
      <section className="auth-intro" aria-label="Devora OS">
        <span className="app-brand-mark">D</span>
        <div>
          <p>DEVORA OS</p>
          <h2>
            Operação organizada.
            <br />
            Decisões mais claras.
          </h2>
          <span>
            <ShieldCheck size={18} aria-hidden /> Acesso interno protegido por
            MFA
          </span>
        </div>
      </section>
      <Card className="auth-card space-y-6">
        <header className="space-y-2">
          <p className="text-sm font-bold text-brand-700">
            Devora Studio · Acesso interno
          </p>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-text-muted">{description}</p>
        </header>
        {children}
      </Card>
    </main>
  );
}
