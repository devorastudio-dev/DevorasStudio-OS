"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRightIcon, ArrowUpRightIcon } from "@phosphor-icons/react";
import { serviceOffers } from "@/app/lib/offers";

const positioningBlocks = [
  {
    title: "Presença comercial",
    description:
      "Sites e páginas com mais clareza de proposta, narrativa melhor organizada e CTA mais forte.",
  },
  {
    title: "Operação digital",
    description:
      "Sistemas, fluxos internos e produtos que ajudam o time a parar de improvisar processo.",
  },
  {
    title: "Continuidade",
    description:
      "Depois da entrega, seguimos com manutenção e evolução para o produto não ficar parado.",
  },
];

export default function Services() {
  return (
    <section
      id="servicos"
      className="relative bg-[#030307] py-24 md:py-32"
      aria-labelledby="servicos-title"
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -right-32 h-96 w-96 rounded-full bg-[#6B5CFF]/10 blur-[90px] bg-animate-float-1" />
        <div className="absolute bottom-1/4 -left-32 h-96 w-96 rounded-full bg-[#22D3EE]/10 blur-[90px] bg-animate-float-2" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="mb-16 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mb-6 inline-block rounded-full border border-[#6B5CFF]/20 bg-[#6B5CFF]/10 px-4 py-2 text-sm font-medium text-[#6B5CFF]"
            >
              O que entregamos
            </motion.span>
            <h2
              id="servicos-title"
              className="mb-6 text-4xl font-bold md:text-5xl"
            >
              Da primeira impressão até a{" "}
              <span className="gradient-text">operação do dia a dia</span>
            </h2>
            <p className="max-w-xl text-lg leading-relaxed text-neutral-400">
              Não vendemos só código. Entregamos estrutura digital com intenção
              comercial, melhor leitura visual e uso mais fluido.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid gap-4 md:grid-cols-3"
          >
            {positioningBlocks.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-white/10 bg-white/5 p-5"
              >
                <p className="mb-2 text-lg font-semibold text-white">
                  {item.title}
                </p>
                <p className="text-sm leading-relaxed text-neutral-400">
                  {item.description}
                </p>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {serviceOffers.map((service, index) => {
            const Icon = service.icon;

            return (
              <motion.div
                key={service.slug}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                whileHover={{ y: -5 }}
                className="card-hover group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#15151f]/70 p-8"
              >
                <div className="absolute inset-0 bg-linear-to-br from-[#6B5CFF]/6 to-[#22D3EE]/6 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-linear-to-br from-[#6B5CFF]/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                <div className="relative z-10">
                  <div className="mb-6 flex items-start justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6B5CFF]/10 text-[#6B5CFF] transition-all duration-300 group-hover:bg-[#6B5CFF] group-hover:text-white">
                      <Icon size={28} weight="bold" />
                    </div>
                    <motion.div
                      whileHover={{ x: 5, y: -5 }}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <ArrowUpRightIcon size={24} className="text-[#6B5CFF]" />
                    </motion.div>
                  </div>

                  <h3 className="mb-3 text-xl font-semibold text-white transition-colors group-hover:text-[#6B5CFF]">
                    {service.title}
                  </h3>

                  <p className="mb-6 text-sm leading-relaxed text-neutral-400">
                    {service.shortDescription}
                  </p>

                  <div className="mb-6 flex flex-wrap gap-2">
                    {service.highlights.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-300 transition-colors group-hover:border-[#6B5CFF]/30"
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  <Link
                    href={`/servicos/${service.slug}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-[#C9C4FF] transition-colors hover:text-white"
                  >
                    Ver detalhes do serviço
                    <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/servicos"
            className="inline-flex items-center gap-2 rounded-xl bg-[#6B5CFF] px-6 py-3 font-semibold text-white transition-all hover:bg-[#5a4bc6]"
          >
            Explorar página completa de serviços
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
