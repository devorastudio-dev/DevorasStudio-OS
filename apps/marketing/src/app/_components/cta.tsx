import { ContactForm } from "@/app/contact-form";

export default function CTA() {
  return (
    <section
      id="contato"
      className="relative overflow-hidden py-24 md:py-32"
      aria-labelledby="contato-title"
    >
      <div className="absolute inset-0 bg-linear-to-br from-[#6B5CFF]/10 via-[#030307] to-[#22D3EE]/5" />
      <div
        className="bg-animate-float-1 absolute right-0 top-0 h-125 w-125 rounded-full bg-[#6B5CFF]/20 blur-[80px]"
        aria-hidden="true"
      />
      <div
        className="bg-animate-float-2 absolute bottom-0 left-0 h-125 w-125 rounded-full bg-[#22D3EE]/15 blur-[80px]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div className="lg:sticky lg:top-28">
          <span className="mb-6 inline-block rounded-full border border-[#6B5CFF]/20 bg-[#6B5CFF]/10 px-4 py-2 text-sm font-medium text-[#AFA7FF]">
            Vamos conversar
          </span>
          <h2
            id="contato-title"
            className="mb-6 text-3xl font-bold leading-tight md:text-5xl"
          >
            Conte o contexto do seu{" "}
            <span className="gradient-text">projeto.</span>
          </h2>
          <p className="max-w-xl text-lg leading-relaxed text-neutral-400">
            Envie um breve resumo do desafio. Usaremos as informações somente
            para avaliar e responder ao contato.
          </p>
          <p className="mt-6 text-sm leading-relaxed text-neutral-500">
            Você não precisa chegar com a solução pronta. Comece pelo objetivo e
            pelo que precisa melhorar.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#1a1a24]/80 p-2 shadow-2xl shadow-[#6B5CFF]/10 backdrop-blur-xl md:p-4">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
