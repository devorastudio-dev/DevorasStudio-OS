import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { projects } from "@/app/lib/projects";
import {
  ArrowLeftIcon,
  GlobeIcon,
  GithubLogoIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react/dist/ssr";

type ProjectPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);
  if (!project) return { title: "Projeto | Devora Studio" };
  return {
    title: `${project.title} | Devora Studio`,
    description: project.shortDescription,
    alternates: { canonical: `/projects/${project.slug}` },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);

  if (!project) return notFound();

  return (
    <main className="min-h-screen bg-[#030307]">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-100 bg-linear-to-b from-[#6B5CFF]/10 to-transparent blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6">
          {/* Back Link */}
          <Link
            href="/#portfolio"
            className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white mb-8 transition-colors group"
          >
            <ArrowLeftIcon
              size={16}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Voltar para projetos
          </Link>

          {/* Header */}
          <div className="mb-12">
            <div className="flex flex-wrap items-center gap-4 mb-6">
              {project.status === "in-development" && (
                <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium">
                  Em desenvolvimento
                </span>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              {project.title}
            </h1>

            <p className="text-xl text-neutral-400 max-w-2xl leading-relaxed">
              {project.shortDescription}
            </p>
          </div>

          {/* Main Image */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-[#1a1a24] border border-white/10 mb-12">
            <Image
              src={project.image}
              alt={project.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-linear-to-t from-[#030307] via-transparent to-transparent" />
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4">
            {project.liveUrl && project.liveUrl !== "#" && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#6B5CFF] px-6 py-3 rounded-xl font-semibold text-white hover:bg-[#5a4bc6] transition-all hover:shadow-lg hover:shadow-[#6B5CFF]/25"
              >
                <GlobeIcon size={20} />
                Ver projeto online
              </a>
            )}
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
              >
                <GithubLogoIcon size={20} />
                Ver código
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
              {/* Description */}
              <div>
                <h2 className="text-2xl font-bold mb-4">Sobre o projeto</h2>
                <p className="text-neutral-400 leading-relaxed text-lg">
                  {project.fullDescription}
                </p>
              </div>

              {/* Challenge */}
              <div>
                <h2 className="text-2xl font-bold mb-4">O desafio</h2>
                <div className="bg-[#1a1a24]/50 rounded-2xl border border-white/10 p-6">
                  <p className="text-neutral-400 leading-relaxed">
                    {project.challenge}
                  </p>
                </div>
              </div>

              {/* Solution */}
              <div>
                <h2 className="text-2xl font-bold mb-4">Nossa solução</h2>
                <div className="bg-linear-to-br from-[#6B5CFF]/10 to-[#22D3EE]/5 rounded-2xl border border-white/10 p-6">
                  <p className="text-neutral-400 leading-relaxed">
                    {project.solution}
                  </p>
                </div>
              </div>

              {/* Features */}
              <div>
                <h2 className="text-2xl font-bold mb-6">Funcionalidades</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {project.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10"
                    >
                      <CheckCircleIcon
                        size={20}
                        className="text-[#6B5CFF] mt-0.5 shrink-0"
                        weight="bold"
                      />
                      <span className="text-neutral-300 text-sm">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Tech Stack */}
              <div className="bg-[#1a1a24]/50 rounded-2xl border border-white/10 p-6 sticky top-24">
                <h3 className="text-lg font-semibold mb-6">Tecnologias</h3>

                <div className="space-y-6">
                  {project.technologies.map((tech, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-white font-medium">
                          {tech.name}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {tech.category}
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-[#6B5CFF] to-[#22D3EE] rounded-full"
                          style={{ width: `${75 + (index % 4) * 5}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Stack Tags */}
                <div className="mt-8 pt-6 border-t border-white/10">
                  <h4 className="text-sm font-medium text-neutral-400 mb-4">
                    Stack completa
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {project.stack.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1 rounded-full bg-[#6B5CFF]/10 border border-[#6B5CFF]/20 text-[#6B5CFF] text-sm"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Next Project CTA */}
      <section className="py-20 border-t border-white/10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-neutral-400 mb-4">Gostou do nosso trabalho?</p>
          <h2 className="text-3xl font-bold mb-8">
            Vamos criar algo incrível juntos?
          </h2>
          <Link
            href="/#contato"
            className="inline-flex items-center gap-2 bg-[#6B5CFF] px-8 py-4 rounded-xl font-semibold text-white hover:bg-[#5a4bc6] transition-all hover:shadow-lg hover:shadow-[#6B5CFF]/25"
          >
            Falar sobre um projeto
          </Link>
        </div>
      </section>
    </main>
  );
}
