"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRightIcon, List, X } from "@phosphor-icons/react";
import logoImg from "../../../public/Devora-w.png";

const navItems = [
  { label: "Início", href: "/" },
  { label: "Serviços", href: "/servicos" },
  { label: "Produtos", href: "/produtos" },
  { label: "Projetos", href: "/projetos" },
  { label: "Contato", href: "/#contato" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "border-b border-white/10 bg-[#030307]/80 py-2.5 backdrop-blur-lg"
            : "bg-transparent py-3.5"
        }`}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6">
          <Link href="/" className="shrink-0">
            <Image
              src={logoImg}
              alt="Devora logo"
              height={scrolled ? 28 : 34}
              width={scrolled ? 88 : 104}
              className="transition-all duration-300"
            />
          </Link>

          <div className="hidden items-center gap-6 text-sm md:flex">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : item.href.startsWith("/#")
                    ? pathname === "/"
                    : pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`transition-colors ${
                    isActive
                      ? "text-white"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            <Link
              href="/#contato"
              className="inline-flex items-center gap-2 rounded-lg bg-[#6B5CFF] px-5 py-2.5 font-medium text-white transition-all hover:bg-[#5a4bc6] hover:shadow-lg hover:shadow-[#6B5CFF]/25"
            >
              Iniciar conversa
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
            aria-expanded={open}
            aria-controls="menu-mobile"
            className="rounded-lg p-2 text-white transition-colors hover:bg-white/10 md:hidden"
          >
            <List size={26} />
          </button>
        </nav>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="menu-mobile"
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#030307] text-white"
          >
            <div className="flex h-[72px] items-center justify-between border-b border-white/10 px-6">
              <Image src={logoImg} alt="Devora logo" height={32} width={98} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="rounded-lg p-2 transition-colors hover:bg-white/10"
              >
                <X size={26} />
              </button>
            </div>

            <motion.nav
              aria-label="Navegação móvel"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col gap-2 px-6 pt-8"
            >
              {navItems.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.15 + index * 0.05 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block border-b border-white/5 py-4 text-lg text-neutral-300 transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
