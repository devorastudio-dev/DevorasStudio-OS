import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://devorastudio.com.br"),
  title: "Devora Studio | Soluções digitais",
  description:
    "Soluções digitais para apresentar, organizar e evoluir negócios.",
  alternates: { canonical: "/" },
  authors: [{ name: "Devora Studio" }],
  openGraph: {
    title: "Devora Studio | Soluções digitais",
    description: "Tecnologia útil, construída com clareza e propósito.",
    url: "/",
    siteName: "Devora Studio",
    type: "website",
    locale: "pt_BR",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="overflow-x-hidden bg-[#030307] antialiased">
        {children}
      </body>
    </html>
  );
}
