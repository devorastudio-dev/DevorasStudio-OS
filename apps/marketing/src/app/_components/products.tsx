"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { productOffers } from "@/app/lib/offers";

export default function Products() {
  const featuredProduct = productOffers[0];
  const nextProducts = productOffers.slice(1);

  if (!featuredProduct) return null;

  return (
    <section
      id="produtos"
      className="relative bg-[#030307] py-24 md:py-32"
      aria-labelledby="produtos-title"
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/3 top-0 h-80 w-80 rounded-full bg-[#22D3EE]/10 blur-[90px] bg-animate-float-2" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#6B5CFF]/10 blur-[90px] bg-animate-float-1" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <span className="mb-6 inline-block rounded-full border border-[#22D3EE]/20 bg-[#22D3EE]/10 px-4 py-2 text-sm font-medium text-[#22D3EE]">
            Produtos digitais
          </span>
          <h2
            id="produtos-title"
            className="mb-6 text-4xl font-bold md:text-5xl"
          >
            Produto próprio com{" "}
            <span className="gradient-text">receita recorrente</span>
          </h2>
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-neutral-400">
            Além dos projetos sob medida, também construímos produtos próprios
            em assinatura para nichos com dor operacional real.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr]"
        >
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#1a1a24]/70 p-8 md:p-10">
            <div className="absolute inset-0 bg-linear-to-br from-[#6B5CFF]/10 via-transparent to-[#22D3EE]/10" />

            <div className="relative">
              <div className="mb-6 flex flex-wrap gap-3">
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">
                  Ativo
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-neutral-300">
                  {featuredProduct.pricing}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-neutral-300">
                  Produto próprio Devora
                </span>
              </div>

              <h3 className="mb-3 text-3xl font-semibold text-white">
                {featuredProduct.name}
              </h3>
              <p className="mb-4 text-lg text-neutral-300">
                {featuredProduct.summary}
              </p>
              <p className="mb-3 max-w-2xl text-neutral-400">
                {featuredProduct.description}
              </p>
              <p className="mb-8 text-sm text-neutral-500">
                Ideal para: {featuredProduct.audience}
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                {featuredProduct.features.map((feature) => (
                  <span
                    key={feature}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-neutral-300"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-[#111119] p-6">
              <p className="mb-5 text-sm uppercase tracking-[0.2em] text-neutral-500">
                Na esteira
              </p>
              <div className="space-y-4">
                {nextProducts.map((product) => {
                  const Icon = product.icon;

                  return (
                    <Link
                      key={product.slug}
                      href={`/produtos/${product.slug}`}
                      className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#6B5CFF]/10 text-[#6B5CFF]">
                        <Icon size={24} weight="bold" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {product.name}
                        </p>
                        <p className="text-xs text-neutral-400">
                          {product.summary}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-[#6B5CFF]/20 bg-[#6B5CFF]/10 p-6">
              <p className="mb-2 text-sm font-medium text-[#C9C4FF]">
                Linha de produtos própria
              </p>
              <p className="mb-5 text-sm leading-relaxed text-neutral-300">
                Hoje já oferecemos assinatura do SaaS para barbearias e estamos
                preparando novos produtos recorrentes para ampliar o portfólio.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/produtos"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#6B5CFF] px-5 py-3 font-semibold text-white transition-all hover:bg-[#5a4bc6]"
                >
                  Ver página completa
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
                <Link
                  href="/#contato"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition-all hover:bg-white/10"
                >
                  Solicitar demonstração
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
