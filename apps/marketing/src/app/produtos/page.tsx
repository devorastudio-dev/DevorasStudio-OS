import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/app/_components/navbar";
import Footer from "@/app/_components/footer";
import { productOffers } from "@/app/lib/offers";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Produtos | Devora Studio",
  description:
    "Conheça os produtos próprios da Devora Studio: SaaS para barbearias, micro SaaS Ajuda-se e produtos por assinatura em desenvolvimento.",
  alternates: { canonical: "/produtos" },
};

export default function ProductsPage() {
  const activeProduct = productOffers.find(
    (product) => product.status === "ativo",
  );
  const roadmapProducts = productOffers.filter(
    (product) => product.status === "em-breve",
  );

  return (
    <div className="min-h-screen bg-[#030307]">
      <Navbar />

      <main>
        <section className="relative overflow-hidden border-b border-white/5 pt-28 pb-20 md:pt-32 md:pb-24">
          <div className="absolute inset-0">
            <div className="absolute right-10 top-10 h-80 w-80 rounded-full bg-[#6B5CFF]/10 blur-[100px]" />
            <div className="absolute left-0 bottom-0 h-72 w-72 rounded-full bg-[#22D3EE]/10 blur-[90px]" />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-6">
            <div className="max-w-3xl">
              <span className="mb-6 inline-block rounded-full border border-[#22D3EE]/20 bg-[#22D3EE]/10 px-4 py-2 text-sm font-medium text-[#22D3EE]">
                Produtos próprios
              </span>
              <h1 className="mb-6 text-4xl font-bold leading-tight md:text-6xl">
                SaaS e sistemas por assinatura que nascem de{" "}
                <span className="gradient-text">dores reais de operação</span>
              </h1>
              <p className="text-lg leading-relaxed text-neutral-400">
                Além de desenvolver para clientes, a Devora também constrói
                produtos próprios. Hoje já oferecemos um SaaS para gestão de
                barbearias e temos novos produtos em esteira.
              </p>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-6">
            {activeProduct && (
              <div className="mb-16 rounded-[2rem] border border-[#6B5CFF]/20 bg-linear-to-br from-[#12121a] via-[#151522] to-[#0f1620] p-8 md:p-10">
                <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                  <div>
                    <span className="mb-4 inline-block rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                      Produto ativo
                    </span>
                    <h2 className="mb-4 text-3xl font-semibold text-white md:text-4xl">
                      {activeProduct.name}
                    </h2>
                    <p className="mb-4 max-w-2xl text-neutral-300">
                      {activeProduct.description}
                    </p>
                    <p className="mb-8 text-sm text-neutral-500">
                      Pensado para: {activeProduct.audience}
                    </p>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {activeProduct.features.map((feature) => (
                        <div
                          key={feature}
                          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-neutral-300"
                        >
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                      <p className="mb-2 text-sm uppercase tracking-[0.2em] text-neutral-500">
                        Plano mensal
                      </p>
                      <p className="mb-3 text-3xl font-semibold text-white">
                        Assinatura mensal
                      </p>
                      <p className="mb-6 text-sm leading-relaxed text-neutral-400">
                        Entrada mais simples para barbearias que querem começar
                        rápido e validar rotina com a plataforma.
                      </p>
                      <div className="rounded-2xl border border-white/10 bg-[#0f0f16] px-4 py-3 text-sm text-neutral-300">
                        Ideal para adoção gradual e operação enxuta.
                      </div>
                    </div>

                    <div className="rounded-3xl border border-[#6B5CFF]/30 bg-[#6B5CFF]/10 p-6">
                      <p className="mb-2 text-sm uppercase tracking-[0.2em] text-[#C9C4FF]">
                        Plano anual
                      </p>
                      <p className="mb-3 text-3xl font-semibold text-white">
                        Assinatura anual
                      </p>
                      <p className="mb-6 text-sm leading-relaxed text-neutral-300">
                        Melhor caminho para operações que já entenderam o valor
                        do sistema e querem previsibilidade com melhor
                        custo-benefício.
                      </p>
                      <Link
                        href="/#contato"
                        className="inline-flex items-center rounded-xl bg-[#6B5CFF] px-5 py-3 font-semibold text-white transition-all hover:bg-[#5a4bc6]"
                      >
                        Solicitar demonstração
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              {productOffers.map((product) => {
                const Icon = product.icon;
                const isActive = product.status === "ativo";

                return (
                  <div
                    key={product.slug}
                    className={`rounded-3xl border p-8 ${
                      isActive
                        ? "border-[#6B5CFF]/30 bg-linear-to-br from-[#6B5CFF]/10 to-[#22D3EE]/10"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <div className="mb-6 flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-[#6B5CFF]">
                          <Icon size={28} weight="bold" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-semibold text-white">
                            {product.name}
                          </h2>
                          <p className="text-sm text-neutral-400">
                            {product.summary}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          isActive
                            ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                            : "border border-white/10 bg-white/5 text-neutral-300"
                        }`}
                      >
                        {isActive ? "Disponível" : "Em breve"}
                      </span>
                    </div>

                    <p className="mb-4 text-neutral-300">
                      {product.description}
                    </p>
                    <p className="mb-2 text-sm text-neutral-500">
                      Modelo: {product.pricing}
                    </p>
                    <p className="mb-6 text-sm text-neutral-500">
                      Para quem: {product.audience}
                    </p>

                    <div className="mb-8 flex flex-wrap gap-2">
                      {product.features.map((feature) => (
                        <span
                          key={feature}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-300"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>

                    {isActive ? (
                      <div className="flex flex-wrap gap-3">
                        <Link
                          href={`/produtos/${product.slug}`}
                          className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition-all hover:bg-white/10"
                        >
                          Ver página do produto
                        </Link>
                        <Link
                          href="/#contato"
                          className="inline-flex items-center rounded-xl bg-[#6B5CFF] px-5 py-3 font-semibold text-white transition-all hover:bg-[#5a4bc6]"
                        >
                          Solicitar demonstração
                        </Link>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        <Link
                          href={`/produtos/${product.slug}`}
                          className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition-all hover:bg-white/10"
                        >
                          Ver página do produto
                        </Link>
                        <div className="text-sm text-neutral-400">
                          Produto em construção. Já pode entrar na conversa se
                          quiser acompanhar o lançamento.
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-16 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[2rem] border border-white/10 bg-[#111119] p-8">
                <p className="mb-3 text-sm uppercase tracking-[0.2em] text-neutral-500">
                  Roadmap de produtos
                </p>
                <h2 className="mb-4 text-3xl font-semibold text-white">
                  O que vem depois do SaaS de barbearias
                </h2>
                <p className="mb-8 text-neutral-400">
                  A linha de produtos da Devora está sendo construída para
                  atacar rotinas recorrentes de operação, atendimento e gestão.
                </p>

                <div className="space-y-4">
                  {roadmapProducts.map((product) => (
                    <div
                      key={product.slug}
                      className="rounded-2xl border border-white/10 bg-white/5 p-5"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="font-medium text-white">{product.name}</p>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-300">
                          Em breve
                        </span>
                      </div>
                      <p className="text-sm text-neutral-400">
                        {product.summary}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-6">
                <div className="rounded-[2rem] border border-[#22D3EE]/20 bg-[#22D3EE]/10 p-8">
                  <p className="mb-3 text-sm uppercase tracking-[0.2em] text-[#9BEAF4]">
                    Conversão
                  </p>
                  <h3 className="mb-4 text-2xl font-semibold text-white">
                    Quer apresentar um produto com mais cara de empresa?
                  </h3>
                  <p className="mb-6 text-sm leading-relaxed text-neutral-200">
                    A mesma lógica que usamos para construir nossos produtos
                    pode ser aplicada na apresentação do seu software, portal ou
                    assinatura.
                  </p>
                  <Link
                    href="/#contato"
                    className="inline-flex items-center rounded-xl bg-[#030307] px-5 py-3 font-semibold text-white transition-all hover:bg-black"
                  >
                    Conversar sobre produto digital
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-10">
              <Link
                href="/produtos/gestao-barbearias"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10"
              >
                Abrir um produto em página própria
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
