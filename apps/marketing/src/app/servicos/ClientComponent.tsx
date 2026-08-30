"use client";

import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react";
import Navbar from "@/app/_components/navbar";
import Footer from "@/app/_components/footer";
import ServicesExplorer from "@/app/_components/services-explorer";
import { serviceOffers } from "@/app/lib/offers";

export default function ClientComponent() {
  return (
    <div className="min-h-screen bg-[#030307]">
      <Navbar />

      <main>
        <section className="relative overflow-hidden border-b border-white/5 pt-28 pb-20 md:pt-32 md:pb-24">
          <div className="absolute inset-0">
            <div className="absolute left-0 top-12 h-72 w-72 rounded-full bg-[#6B5CFF]/10 blur-[90px]" />
            <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-[#22D3EE]/10 blur-[90px]" />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-6">
            <div className="max-w-3xl">
              <span className="mb-6 inline-block rounded-full border border-[#6B5CFF]/20 bg-[#6B5CFF]/10 px-4 py-2 text-sm font-medium text-[#6B5CFF]">
                Serviços Devora
              </span>
              <h1 className="mb-6 text-4xl font-bold leading-tight md:text-6xl">
                Serviços pensados para{" "}
                <span className="gradient-text">
                  vender melhor e operar melhor
                </span>
              </h1>
              <p className="mb-8 max-w-2xl text-lg leading-relaxed text-neutral-400">
                Atuamos do design ao desenvolvimento, com opção de manutenção
                contínua para quem precisa evoluir sem ficar recomeçando a cada
                ajuste.
              </p>

              <div className="flex flex-wrap gap-3">
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-300">
                  Desenvolvimento
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-300">
                  Design UI/UX
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-300">
                  Manutenção contínua
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-12 max-w-2xl">
              <p className="mb-3 text-sm uppercase tracking-[0.2em] text-neutral-500">
                Explore
              </p>
              <h2 className="mb-4 text-3xl font-semibold text-white md:text-4xl">
                Selecione um serviço e veja o escopo com mais detalhe
              </h2>
              <p className="text-neutral-400">
                Em vez de listar tudo de forma genérica, deixamos mais claro o
                que oferecemos, para quem faz sentido e como normalmente
                entregamos.
              </p>
            </div>

            <ServicesExplorer services={serviceOffers} />
          </div>
        </section>

        <section className="pb-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-14">
              <p className="mb-3 text-sm uppercase tracking-[0.2em] text-neutral-500">
                Percepção de valor
              </p>
              <h2 className="mb-4 text-3xl font-semibold text-white md:text-4xl">
                Serviço bom não é só o que funciona.
              </h2>
              <p className="max-w-2xl text-neutral-400">
                Também precisa parecer confiável, ser claro para o usuário e
                acompanhar o ritmo do negócio depois da entrega.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <p className="mb-2 text-lg font-semibold text-white">
                  Design + código
                </p>
                <p className="text-sm text-neutral-400">
                  Não entregamos só a parte técnica. Também refinamos estética,
                  hierarquia e percepção de valor.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <p className="mb-2 text-lg font-semibold text-white">
                  Projetos sob medida
                </p>
                <p className="text-sm text-neutral-400">
                  Estruturamos a solução conforme a necessidade real da
                  operação, sem encaixar tudo no mesmo molde.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <p className="mb-2 text-lg font-semibold text-white">
                  Continuidade
                </p>
                <p className="text-sm text-neutral-400">
                  Depois da entrega, também podemos seguir com manutenção e
                  evolução contínua.
                </p>
              </div>
            </div>

            <div className="mt-10">
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/produtos"
                  className="text-sm text-neutral-400 transition-colors hover:text-white"
                >
                  Conhecer os produtos próprios da Devora →
                </Link>
                <Link
                  href="/servicos/landing-pages"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10"
                >
                  Abrir um serviço em página própria
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
