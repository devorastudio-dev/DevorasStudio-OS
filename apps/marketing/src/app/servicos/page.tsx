import type { Metadata } from "next";
import ClientComponent from "./ClientComponent";

export const metadata: Metadata = {
  title: "Serviços | Devora Studio",
  description:
    "Conheça os serviços da Devora Studio: landing pages, sites institucionais, sistemas sob medida, design UI/UX, manutenção contínua e integrações.",
  alternates: { canonical: "/servicos" },
};

export default function Page() {
  return <ClientComponent />;
}
