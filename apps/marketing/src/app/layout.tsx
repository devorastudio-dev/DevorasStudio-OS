import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://devorastudio.com.br"),
  title: {
    default: "Devora Studio — Soluções digitais",
    template: "%s | Devora Studio",
  },
  description:
    "Soluções digitais para organizar, construir e evoluir negócios.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Devora Studio — Soluções digitais",
    description: "Tecnologia útil, construída com clareza e propósito.",
    url: "/",
    siteName: "Devora Studio",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
