"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import { ArrowRightIcon, CheckCircleIcon } from "@phosphor-icons/react";
import { ServiceOffer } from "@/app/lib/offers";

type ServicesExplorerProps = {
  services: ServiceOffer[];
};

export default function ServicesExplorer({ services }: ServicesExplorerProps) {
  const [selectedSlug, setSelectedSlug] = useState(services[0]?.slug ?? "");
  const firstService = services[0];

  if (!firstService) return null;

  const selectedService =
    services.find((service) => service.slug === selectedSlug) ?? firstService;

  return (
    <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-3">
        {services.map((service) => {
          const Icon = service.icon;
          const isActive = service.slug === selectedService.slug;

          return (
            <button
              key={service.slug}
              onClick={() => setSelectedSlug(service.slug)}
              className={`w-full rounded-2xl border p-5 text-left transition-all ${
                isActive
                  ? "border-[#6B5CFF]/40 bg-[#6B5CFF]/10 shadow-[0_0_0_1px_rgba(107,92,255,0.2)]"
                  : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    isActive
                      ? "bg-[#6B5CFF] text-white"
                      : "bg-white/5 text-[#6B5CFF]"
                  }`}
                >
                  <Icon size={24} weight="bold" />
                </div>
                <div>
                  <p className="mb-1 text-lg font-semibold text-white">
                    {service.title}
                  </p>
                  <p className="text-sm leading-relaxed text-neutral-400">
                    {service.shortDescription}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <motion.div
        key={selectedService.slug}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-white/10 bg-[#14141d] p-8 md:p-10"
      >
        <p className="mb-3 text-sm uppercase tracking-[0.24em] text-[#6B5CFF]">
          Detalhes do serviço
        </p>
        <h3 className="mb-4 text-3xl font-bold text-white">
          {selectedService.title}
        </h3>
        <p className="mb-6 max-w-2xl text-neutral-300">
          {selectedService.fullDescription}
        </p>

        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="mb-2 text-sm font-medium text-white">Ideal para</p>
            <p className="text-sm leading-relaxed text-neutral-400">
              {selectedService.idealFor}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="mb-2 text-sm font-medium text-white">Destaques</p>
            <div className="flex flex-wrap gap-2">
              {selectedService.highlights.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-300"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-8">
          <p className="mb-4 text-sm font-medium text-white">
            O que normalmente entregamos
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {selectedService.delivery.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <CheckCircleIcon
                  size={18}
                  weight="fill"
                  className="mt-0.5 text-[#22D3EE]"
                />
                <span className="text-sm text-neutral-300">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <Link
          href="/#contato"
          className="inline-flex items-center gap-2 rounded-xl bg-[#6B5CFF] px-6 py-3 font-semibold text-white transition-all hover:bg-[#5a4bc6]"
        >
          Conversar sobre este serviço
          <ArrowRightIcon className="h-4 w-4" />
        </Link>

        <Link
          href={`/servicos/${selectedService.slug}`}
          className="ml-3 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white transition-all hover:bg-white/10"
        >
          Abrir página completa
        </Link>
      </motion.div>
    </div>
  );
}
