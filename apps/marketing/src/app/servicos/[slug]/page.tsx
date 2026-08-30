import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/app/_components/navbar";
import Footer from "@/app/_components/footer";
import { getServiceBySlug, serviceOffers } from "@/app/lib/offers";
import { projects } from "@/app/lib/projects";

type ServiceDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return serviceOffers.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: ServiceDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);

  if (!service) {
    return {
      title: "Serviço | Devora Studio",
    };
  }

  return {
    title: `${service.title} | Serviços Devora`,
    description: service.fullDescription,
    alternates: { canonical: `/servicos/${service.slug}` },
  };
}

export default async function ServiceDetailPage({
  params,
}: ServiceDetailPageProps) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);

  if (!service) return notFound();

  const relatedServices = serviceOffers
    .filter((item) => item.slug !== service.slug)
    .slice(0, 3);
  const exampleProjects = service.exampleProjectSlugs
    .map((projectSlug) =>
      projects.find((project) => project.slug === projectSlug),
    )
    .filter((project): project is NonNullable<typeof project> =>
      Boolean(project),
    );
  const Icon = service.icon;

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
            <Link
              href="/servicos"
              className="mb-8 inline-flex text-sm text-neutral-400 transition-colors hover:text-white"
            >
              ← Voltar para serviços
            </Link>

            <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
              <div>
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#6B5CFF]/10 text-[#6B5CFF]">
                  <Icon size={32} weight="bold" />
                </div>
                <span className="mb-5 inline-block rounded-full border border-[#6B5CFF]/20 bg-[#6B5CFF]/10 px-4 py-2 text-sm font-medium text-[#6B5CFF]">
                  Serviço Devora
                </span>
                <h1 className="mb-5 text-4xl font-bold leading-tight md:text-6xl">
                  {service.title}
                </h1>
                <p className="max-w-2xl text-lg leading-relaxed text-neutral-300">
                  {service.fullDescription}
                </p>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
                <p className="mb-3 text-sm uppercase tracking-[0.2em] text-neutral-500">
                  Ideal para
                </p>
                <p className="mb-6 text-neutral-300">{service.idealFor}</p>

                <div className="mb-8 flex flex-wrap gap-2">
                  {service.highlights.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-300"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                <Link
                  href="/#contato"
                  className="inline-flex items-center rounded-xl bg-[#6B5CFF] px-5 py-3 font-semibold text-white transition-all hover:bg-[#5a4bc6]"
                >
                  Conversar sobre este serviço
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-12 lg:grid-cols-[1fr_0.9fr]">
              <div>
                <p className="mb-4 text-sm uppercase tracking-[0.2em] text-neutral-500">
                  Escopo comum
                </p>
                <h2 className="mb-6 text-3xl font-semibold text-white md:text-4xl">
                  O que normalmente entregamos
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {service.delivery.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-neutral-300"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-[#22D3EE]/20 bg-[#22D3EE]/10 p-8">
                <p className="mb-3 text-sm uppercase tracking-[0.2em] text-[#9BEAF4]">
                  Como pensamos
                </p>
                <h2 className="mb-4 text-3xl font-semibold text-white">
                  Não é só sobre entregar tela.
                </h2>
                <p className="mb-6 text-sm leading-relaxed text-neutral-200">
                  A entrega precisa fazer sentido no comercial, no uso diário e
                  na percepção de valor da sua marca.
                </p>
                <div className="space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-neutral-100">
                    Mais clareza de proposta
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-neutral-100">
                    Melhor experiência para o usuário final
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-neutral-100">
                    Base pronta para evoluir depois da entrega
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-16">
              {exampleProjects.length > 0 && (
                <div className="mb-16">
                  <p className="mb-4 text-sm uppercase tracking-[0.2em] text-neutral-500">
                    Exemplos já entregues
                  </p>
                  <h2 className="mb-6 text-3xl font-semibold text-white md:text-4xl">
                    Cases que mostram esse serviço na prática
                  </h2>
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {exampleProjects.map((project) => (
                      <Link
                        key={project.slug}
                        href={`/projects/${project.slug}`}
                        className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5 transition-all hover:border-[#6B5CFF]/30 hover:bg-white/[0.07]"
                      >
                        <div className="relative h-48 overflow-hidden">
                          <Image
                            src={project.image}
                            alt={project.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                          <div className="absolute inset-0 bg-linear-to-t from-[#030307] via-transparent to-transparent" />
                        </div>
                        <div className="p-6">
                          <p className="mb-2 text-lg font-semibold text-white">
                            {project.title}
                          </p>
                          <p className="mb-4 text-sm leading-relaxed text-neutral-400">
                            {project.shortDescription}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {project.stack.slice(0, 3).map((tech) => (
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
                </div>
              )}

              <p className="mb-5 text-sm uppercase tracking-[0.2em] text-neutral-500">
                Outros serviços
              </p>
              <div className="grid gap-6 md:grid-cols-3">
                {relatedServices.map((item) => {
                  const RelatedIcon = item.icon;

                  return (
                    <Link
                      key={item.slug}
                      href={`/servicos/${item.slug}`}
                      className="rounded-3xl border border-white/10 bg-white/5 p-6 transition-all hover:border-[#6B5CFF]/30 hover:bg-white/[0.07]"
                    >
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#6B5CFF]/10 text-[#6B5CFF]">
                        <RelatedIcon size={24} weight="bold" />
                      </div>
                      <p className="mb-2 text-lg font-semibold text-white">
                        {item.title}
                      </p>
                      <p className="text-sm text-neutral-400">
                        {item.shortDescription}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
