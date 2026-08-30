import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/app/_components/navbar";
import Footer from "@/app/_components/footer";
import { getProjectsGroupedByCategory, projects } from "@/app/lib/projects";

export const metadata: Metadata = {
  title: "Projetos | Devora Studio",
  alternates: { canonical: "/projetos" },
  description:
    "Conheça os projetos já desenvolvidos pela Devora Studio em landing pages, sites institucionais, sistemas web, SaaS e e-commerce.",
};

export default function ProjectsPage() {
  const groupedProjects = getProjectsGroupedByCategory();

  return (
    <div className="min-h-screen bg-[#030307]">
      <Navbar />

      <main>
        <section className="relative overflow-hidden border-b border-white/5 pt-28 pb-20 md:pt-32 md:pb-24">
          <div className="absolute inset-0">
            <div className="absolute left-0 top-10 h-72 w-72 rounded-full bg-[#6B5CFF]/10 blur-[90px]" />
            <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-[#22D3EE]/10 blur-[90px]" />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-6">
            <span className="mb-6 inline-block rounded-full border border-[#6B5CFF]/20 bg-[#6B5CFF]/10 px-4 py-2 text-sm font-medium text-[#6B5CFF]">
              Nosso portfólio
            </span>
            <h1 className="mb-6 max-w-4xl text-4xl font-bold leading-tight md:text-6xl">
              Projetos que mostram como transformamos{" "}
              <span className="gradient-text">
                necessidade em produto digital
              </span>
            </h1>
            <p className="max-w-3xl text-lg leading-relaxed text-neutral-400">
              Aqui você encontra os trabalhos já desenvolvidos pela Devora em
              diferentes contextos: landing pages, sites institucionais,
              agendamentos, e-commerce, sistemas e produtos SaaS.
            </p>
          </div>
        </section>

        <section className="py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-10 flex flex-wrap gap-3">
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-300">
                {projects.length} projetos no portfólio
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-300">
                Sites, sistemas e SaaS
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-300">
                Casos concluídos e em evolução
              </span>
            </div>

            <div className="space-y-16">
              {groupedProjects.map(
                ({ category, projects: categoryProjects }) => (
                  <section key={category}>
                    <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                      <div>
                        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-neutral-500">
                          Categoria
                        </p>
                        <h2 className="text-3xl font-semibold text-white md:text-4xl">
                          {category}
                        </h2>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-300">
                        {categoryProjects.length} projeto
                        {categoryProjects.length > 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                      {categoryProjects.map((project) => (
                        <Link
                          key={project.slug}
                          href={`/projects/${project.slug}`}
                          className="group overflow-hidden rounded-3xl border border-white/10 bg-[#1a1a24]/50 transition-all hover:border-[#6B5CFF]/30 hover:bg-[#1a1a24]/70"
                        >
                          <div className="relative h-56 overflow-hidden">
                            <Image
                              src={project.image}
                              alt={project.title}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                              className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-[#030307] via-transparent to-transparent" />

                            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                              <span className="rounded-full border border-white/10 bg-black/50 px-3 py-1 text-xs text-white backdrop-blur-sm">
                                {project.year}
                              </span>
                              {project.status === "in-development" && (
                                <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs text-amber-300 backdrop-blur-sm">
                                  Em desenvolvimento
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="p-6">
                            <h3 className="mb-2 text-xl font-semibold text-white transition-colors group-hover:text-[#6B5CFF]">
                              {project.title}
                            </h3>
                            <p className="mb-4 text-sm leading-relaxed text-neutral-400">
                              {project.shortDescription}
                            </p>

                            <div className="flex flex-wrap gap-2">
                              {project.stack.slice(0, 4).map((tech) => (
                                <span
                                  key={tech}
                                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-300"
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                ),
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
