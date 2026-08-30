import Navbar from "@/app/_components/navbar";
import Hero from "@/app/_components/hero";
import Services from "@/app/_components/services";
import Portfolio from "@/app/_components/portfolio";
import Products from "@/app/_components/products";
import Process from "@/app/_components/process";
import CTA from "@/app/_components/cta";
import FAQ from "@/app/_components/faq";
import Footer from "@/app/_components/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#030307]">
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Navbar />

      <main id="conteudo">
        {/* HERO */}
        <Hero />

        {/* SERVIÇOS */}
        <Services />

        {/* PORTFÓLIO */}
        <Portfolio />

        {/* PRODUTOS */}
        <Products />

        {/* PROCESSO */}
        <Process />

        {/* CTA FINAL */}
        <CTA />

        {/* FAQ */}
        <FAQ />
      </main>

      <Footer />
    </div>
  );
}
