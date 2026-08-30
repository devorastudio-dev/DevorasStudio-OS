"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRightIcon,
  ChartLineUpIcon,
  CodeIcon,
  LightningIcon,
  PaletteIcon,
} from "@phosphor-icons/react";
import { fadeUp, stagger } from "@/app/lib/motion";

const proofPoints = [
  "Landing pages orientadas a conversão",
  "Sistemas sob medida para operação real",
  "Design UI/UX com mais percepção de valor",
];

const operatingModes = [
  {
    title: "Projeto sob medida",
    description:
      "Para quem precisa lançar, reposicionar ou estruturar uma solução digital do jeito certo.",
    icon: CodeIcon,
  },
  {
    title: "Manutenção contínua",
    description:
      "Para quem já tem produto no ar e quer evoluir com estabilidade, velocidade e suporte.",
    icon: LightningIcon,
  },
  {
    title: "Direção visual",
    description:
      "Para interfaces que precisam parecer mais fortes, mais claras e mais confiáveis.",
    icon: PaletteIcon,
  },
];

export default function Hero() {
  return (
    <section
      id="inicio"
      className="relative flex min-h-screen items-center overflow-hidden bg-[#030307]"
      aria-labelledby="hero-title"
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-[#6B5CFF]/18 blur-[90px] bg-animate-float-1" />
        <div className="absolute -right-28 bottom-1/4 h-96 w-96 rounded-full bg-[#22D3EE]/10 blur-[90px] bg-animate-float-2" />
        <div className="absolute left-1/2 top-1/2 h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6B5CFF]/6 blur-[120px] bg-animate-pulse" />
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(107,92,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(107,92,255,0.035)_1px,transparent_1px)] bg-size-[48px_48px] mask-[radial-gradient(ellipse_70%_58%_at_50%_0%,rgba(0,0,0,0.7)_0%,rgba(0,0,0,0)_100%)]" />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="relative z-10 mx-auto w-full max-w-7xl px-6 py-24 md:py-32"
      >
        <div className="grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <motion.div
            variants={fadeUp}
            className="min-w-0 text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.45 }}
              className="mb-8 inline-flex max-w-full items-center justify-center gap-2 rounded-full border border-[#6B5CFF]/20 bg-[#6B5CFF]/10 px-4 py-2 text-center text-sm font-medium text-[#6B5CFF]"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#6B5CFF] opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#6B5CFF]"></span>
              </span>
              Desenvolvimento, design e evolução contínua
            </motion.div>

            <h1
              id="hero-title"
              className="mb-6 text-4xl font-bold leading-[1.05] md:text-6xl xl:text-7xl"
            >
              Sua empresa não precisa
              <br />
              de mais um site.
              <br />
              <span className="gradient-text">
                Precisa de presença, clareza e conversão.
              </span>
            </h1>

            <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-neutral-400 md:text-xl lg:mx-0">
              Criamos landing pages, sites, sistemas e produtos digitais com
              direção visual mais forte, arquitetura sólida e foco real em fazer
              o negócio vender melhor e operar melhor.
            </p>

            <div className="mb-10 flex flex-wrap justify-center gap-3 lg:justify-start">
              {proofPoints.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-300"
                >
                  {item}
                </span>
              ))}
            </div>

            <motion.div
              variants={stagger}
              className="mb-12 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start"
            >
              <motion.a
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.98 }}
                href="#contato"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6B5CFF] px-8 py-4 font-semibold text-white shadow-lg shadow-[#6B5CFF]/25 transition-all hover:bg-[#5a4bc6] hover:shadow-[#6B5CFF]/35"
              >
                Conte seu desafio
                <ArrowRightIcon className="h-5 w-5" />
              </motion.a>

              <Link
                href="/projetos"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-8 py-4 font-semibold text-white transition-all hover:bg-white/10"
              >
                Ver projetos já entregues
              </Link>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
                <p className="mb-1 text-lg font-bold gradient-text">Contexto</p>
                <p className="text-sm text-neutral-400">
                  Entender o problema antes de propor tecnologia.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
                <p className="mb-1 text-lg font-bold gradient-text">Clareza</p>
                <p className="text-sm text-neutral-400">
                  Organizar escopo, escolhas e próximos passos.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
                <p className="mb-1 text-lg font-bold gradient-text">Evolução</p>
                <p className="text-sm text-neutral-400">
                  Construir uma base que possa continuar melhorando.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="relative">
            <div className="absolute inset-0 rounded-[2rem] bg-linear-to-r from-[#6B5CFF]/20 to-[#22D3EE]/10 blur-[120px]" />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#111119]/90 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] md:p-8">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500/60" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                  <div className="h-3 w-3 rounded-full bg-green-500/60" />
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-400">
                  Operação Devora
                </div>
              </div>

              <div className="mb-6 rounded-3xl border border-[#6B5CFF]/20 bg-linear-to-br from-[#6B5CFF]/12 to-transparent p-5">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#6B5CFF]/15 text-[#6B5CFF]">
                    <ChartLineUpIcon size={24} weight="bold" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">
                      Objetivo principal
                    </p>
                    <p className="text-lg font-semibold text-white">
                      Transformar visita em ação
                    </p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-neutral-300">
                  A primeira pergunta não é “qual stack usar”. É: o que essa
                  página ou sistema precisa fazer pelo negócio?
                </p>
              </div>

              <div className="space-y-4">
                {operatingModes.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="rounded-3xl border border-white/10 bg-white/5 p-5 transition-all hover:bg-white/[0.07]"
                    >
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-[#22D3EE]">
                          <Icon size={22} weight="bold" />
                        </div>
                        <p className="text-lg font-semibold text-white">
                          {item.title}
                        </p>
                      </div>
                      <p className="text-sm leading-relaxed text-neutral-400">
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex h-10 w-6 justify-center rounded-full border-2 border-white/20 pt-2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="h-1.5 w-1.5 rounded-full bg-[#6B5CFF]"
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
