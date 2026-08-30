"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { getFeaturedProjects } from "@/app/lib/projects";
import { ArrowUpRightIcon } from "@phosphor-icons/react";

export default function Portfolio() {
  const featuredProjects = getFeaturedProjects().slice(0, 6);

  return (
    <section id="portfolio" className="relative py-32 bg-[#030307]">
      {/* CSS-only Background Effects (GPU optimized) */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-[#6B5CFF]/5 rounded-full blur-[80px] bg-animate-pulse" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="inline-block px-4 py-2 rounded-full bg-[#6B5CFF]/10 border border-[#6B5CFF]/20 text-[#6B5CFF] text-sm font-medium mb-6"
          >
            Nosso trabalho
          </motion.span>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Projetos <span className="gradient-text">Recentes</span>
          </h2>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Cases em landing pages, agendamentos, e-commerce e sistemas web para
            mostrar como transformamos necessidade comercial em produto digital.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredProjects.map((project, index) => (
            <motion.div
              key={project.slug}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative rounded-2xl overflow-hidden bg-[#1a1a24]/50 border border-white/10"
            >
              {/* Image Container */}
              <div className="relative h-56 overflow-hidden">
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-[#1a1a24] via-transparent to-transparent z-10" />

                {/* Image */}
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-[#6B5CFF]/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileHover={{ scale: 1.1 }}
                    className="bg-white rounded-full p-4"
                  >
                    <ArrowUpRightIcon size={32} className="text-[#6B5CFF]" />
                  </motion.div>
                </div>

                {/* View Project Badge */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  className="absolute top-4 right-4 z-30"
                >
                  <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-xs text-white border border-white/10">
                    Ver projeto
                  </span>
                </motion.div>
              </div>

              {/* Content */}
              <div className="relative p-8">
                <h3 className="text-xl font-semibold mb-2 group-hover:text-[#6B5CFF] transition-colors">
                  {project.title}
                </h3>

                <p className="text-sm text-neutral-400 leading-relaxed mb-4">
                  {project.shortDescription}
                </p>

                <div className="flex flex-wrap gap-2">
                  {project.stack.map((tech) => (
                    <span
                      key={tech}
                      className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-400 group-hover:border-[#6B5CFF]/30 transition-colors"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Link */}
                <Link
                  href={`/projects/${project.slug}`}
                  className="absolute inset-0 z-30"
                >
                  <span className="sr-only">Ver detalhes do projeto</span>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All Projects CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-16"
        >
          <p className="text-neutral-400 mb-4">Quer ver mais projetos?</p>
          <Link
            href="/projetos"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
          >
            Ver todos os projetos
            <ArrowUpRightIcon className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
