import Image from "next/image";
import Link from "next/link";
import logoImg from "../../../public/Devora-w.png";

const footerLinks = [
  { label: "Serviços", href: "/servicos" },
  { label: "Produtos", href: "/produtos" },
  { label: "Projetos", href: "/projetos" },
  { label: "Contato", href: "/#contato" },
] as const;

export default function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-[#030307]">
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-14">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div>
            <Link
              href="/"
              className="mb-5 inline-block"
              aria-label="Devora Studio, página inicial"
            >
              <Image src={logoImg} alt="" width={120} height={40} />
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-neutral-400">
              Desenvolvimento, design e soluções digitais construídas com
              clareza técnica e comercial.
            </p>
          </div>

          <nav aria-label="Navegação do rodapé">
            <ul className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm text-neutral-400">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-7 text-sm text-neutral-500 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} Devora Studio. Todos os direitos
            reservados.
          </p>
          <div className="flex flex-wrap gap-5">
            <Link
              href="/privacy"
              className="transition-colors hover:text-white"
            >
              Política de Privacidade
            </Link>
            <a
              href="https://app.devorastudio.com.br"
              className="transition-colors hover:text-white"
            >
              Acesso interno
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
