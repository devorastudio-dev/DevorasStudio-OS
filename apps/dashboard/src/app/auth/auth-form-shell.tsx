import { Card } from "@devora/ui";
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
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md space-y-6">
        <header className="space-y-2">
          <p className="text-sm font-bold text-brand-700">Devora Studio</p>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-text-muted">{description}</p>
        </header>
        {children}
      </Card>
    </main>
  );
}
