"use client";

import { motion } from "motion/react";
import {
  ShareIcon,
  FlagPennantIcon,
  CodeIcon,
  RocketIcon,
} from "@phosphor-icons/react";

const STEPS = [
  {
    icon: ShareIcon,
    title: "Entendimento",
    desc: "Alinhamos objetivos, público e necessidades reais do seu negócio.",
    color: "#6B5CFF",
  },
  {
    icon: FlagPennantIcon,
    title: "Planejamento",
    desc: "Definimos arquitetura, stack tecnológica e cronograma detalhado.",
    color: "#22D3EE",
  },
  {
    icon: CodeIcon,
    title: "Desenvolvimento",
    desc: "Código limpo, testes automatizados e entregas contínuas.",
    color: "#A78BFA",
  },
  {
    icon: RocketIcon,
    title: "Entrega",
    desc: "Publicação acompanhada de documentação e orientações de operação.",
    color: "#F472B6",
  },
];

export default function Process() {
  return (
    <section id="processo" className="relative py-24 md:py-32 bg-[#030307]">
      {/* CSS-only Background Effects (GPU optimized) */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-[#22D3EE]/5 rounded-full blur-[80px] bg-animate-pulse" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="inline-block px-4 py-2 rounded-full bg-[#6B5CFF]/10 border border-[#6B5CFF]/20 text-[#6B5CFF] text-sm font-medium mb-6"
          >
            Como trabalhamos
          </motion.span>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Nosso <span className="gradient-text">Processo</span>
          </h2>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Um caminho organizado para transformar contexto, decisões e
            implementação em uma entrega sustentável.
          </p>
        </motion.div>

        {/* Process Steps - Timeline Style */}
        <div className="relative">
          {/* Connecting Line */}
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-linear-to-r from-[#6B5CFF]/20 via-[#22D3EE]/20 to-[#6B5CFF]/20 hidden md:block" />

          <div className="grid md:grid-cols-4 gap-8">
            {STEPS.map((step, index) => {
              const Icon = step.icon;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  className="relative"
                >
                  {/* Step Card */}
                  <div className="group relative bg-[#1a1a24]/50 rounded-2xl border border-white/10 p-8 h-full card-hover">
                    {/* Step Number */}
                    <div className="absolute -top-4 left-8">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold border border-white/10"
                        style={{ backgroundColor: step.color }}
                      >
                        {index + 1}
                      </div>
                    </div>

                    {/* Icon */}
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-all duration-300"
                      style={{
                        backgroundColor: `${step.color}15`,
                        color: step.color,
                      }}
                    >
                      <Icon size={28} weight="bold" />
                    </div>

                    <h3 className="text-xl font-semibold mb-3 text-white">
                      {step.title}
                    </h3>
                    <p className="text-sm text-neutral-400 leading-relaxed">
                      {step.desc}
                    </p>

                    {/* Hover Glow */}
                    <div
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at center, ${step.color}10 0%, transparent 70%)`,
                      }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="text-center mt-16"
        >
          <p className="text-neutral-400 mb-4">
            Pronto para iniciar seu projeto?
          </p>
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="#contato"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold bg-[#6B5CFF] text-white hover:bg-[#5a4bc6] transition-all hover:shadow-lg hover:shadow-[#6B5CFF]/25"
          >
            Falar sobre um projeto
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
