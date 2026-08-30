import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/app/_components/navbar";
import Footer from "@/app/_components/footer";
import { getProductBySlug, productOffers } from "@/app/lib/offers";

type ProductDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return productOffers.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return {
      title: "Produto | Devora Studio",
    };
  }

  return {
    title: `${product.name} | Produtos Devora`,
    description: product.description,
    alternates: { canonical: `/produtos/${product.slug}` },
  };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) return notFound();

  const relatedProducts = productOffers
    .filter((item) => item.slug !== product.slug)
    .slice(0, 3);
  const Icon = product.icon;
  const isActive = product.status === "ativo";

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
            <Link
              href="/produtos"
              className="mb-8 inline-flex text-sm text-neutral-400 transition-colors hover:text-white"
            >
              ← Voltar para produtos
            </Link>

            <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
              <div>
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#6B5CFF]/10 text-[#6B5CFF]">
                  <Icon size={32} weight="bold" />
                </div>
                <div className="mb-5 flex flex-wrap gap-3">
                  <span
                    className={`rounded-full px-4 py-2 text-sm font-medium ${
                      isActive
                        ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                        : "border border-white/10 bg-white/5 text-neutral-300"
                    }`}
                  >
                    {isActive ? "Disponível" : "Em breve"}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-300">
                    {product.pricing}
                  </span>
                </div>
                <h1 className="mb-5 text-4xl font-bold leading-tight md:text-6xl">
                  {product.name}
                </h1>
                <p className="max-w-2xl text-lg leading-relaxed text-neutral-300">
                  {product.description}
                </p>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
                <p className="mb-3 text-sm uppercase tracking-[0.2em] text-neutral-500">
                  Para quem é
                </p>
                <p className="mb-6 text-neutral-300">{product.audience}</p>

                <div className="mb-8 flex flex-wrap gap-2">
                  {product.features.map((item) => (
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
                  {isActive
                    ? "Solicitar demonstração"
                    : "Acompanhar lançamento"}
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
                  Visão do produto
                </p>
                <h2 className="mb-6 text-3xl font-semibold text-white md:text-4xl">
                  O que esse produto organiza no dia a dia
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {product.features.map((item) => (
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
                  Posicionamento
                </p>
                <h2 className="mb-4 text-3xl font-semibold text-white">
                  Produto pensado como negócio, não só como sistema.
                </h2>
                <p className="mb-6 text-sm leading-relaxed text-neutral-200">
                  A proposta aqui é unir operação, experiência e recorrência em
                  uma oferta que faça sentido comercialmente para quem assina.
                </p>
                <div className="space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-neutral-100">
                    Mais previsibilidade de receita
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-neutral-100">
                    Adoção mais simples para o cliente final
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-neutral-100">
                    Evolução contínua baseada em uso real
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-16">
              <p className="mb-5 text-sm uppercase tracking-[0.2em] text-neutral-500">
                Outros produtos
              </p>
              <div className="grid gap-6 md:grid-cols-3">
                {relatedProducts.map((item) => {
                  const RelatedIcon = item.icon;

                  return (
                    <Link
                      key={item.slug}
                      href={`/produtos/${item.slug}`}
                      className="rounded-3xl border border-white/10 bg-white/5 p-6 transition-all hover:border-[#6B5CFF]/30 hover:bg-white/[0.07]"
                    >
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#6B5CFF]/10 text-[#6B5CFF]">
                        <RelatedIcon size={24} weight="bold" />
                      </div>
                      <p className="mb-2 text-lg font-semibold text-white">
                        {item.name}
                      </p>
                      <p className="text-sm text-neutral-400">{item.summary}</p>
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
