"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PlusIcon } from "@phosphor-icons/react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "Quanto tempo leva para desenvolver um projeto?",
    answer:
      "O prazo depende do escopo, das integrações e das validações necessárias. Depois de entender o contexto, propomos etapas e um cronograma compatível com o projeto.",
  },
  {
    question: "Como funciona o processo de desenvolvimento?",
    answer:
      "Começamos pelo entendimento do problema, definimos prioridades e arquitetura, desenvolvemos em etapas e validamos a entrega antes da publicação. O formato de acompanhamento é combinado para cada projeto.",
  },
  {
    question: "Vocês oferecem suporte após a entrega?",
    answer:
      "A necessidade de suporte e evolução é definida no escopo. Quando faz sentido, podemos combinar uma etapa de estabilização ou um acompanhamento recorrente.",
  },
  {
    question: "Quais tecnologias vocês utilizam?",
    answer:
      "A tecnologia é escolhida conforme o problema, a operação e a manutenção esperada. Usamos ferramentas atuais e explicamos as decisões relevantes na proposta técnica.",
  },
  {
    question: "Quanto custa desenvolver um software?",
    answer:
      "O investimento depende do escopo, da complexidade e do modelo de acompanhamento. O formulário desta página inicia a conversa para que possamos preparar uma proposta adequada.",
  },
  {
    question: "Vocês trabalham com projetos de qualquer tamanho?",
    answer:
      "Sim. Atendemos desde landing pages e sites institucionais até sistemas empresariais, produtos SaaS, PDV e ERP. O escopo muda, mas o cuidado com arquitetura, usabilidade e performance continua o mesmo.",
  },
  {
    question: "Como vocês garantem a qualidade do código?",
    answer:
      "Os critérios de qualidade são definidos conforme o risco da solução e podem incluir revisão, tipagem, testes e verificações automatizadas. A manutenção futura também orienta as decisões de arquitetura.",
  },
  {
    question: "Vocês fazem integrações com outros sistemas?",
    answer:
      "Integrações podem fazer parte do projeto quando as ferramentas envolvidas oferecem APIs e condições técnicas adequadas. A viabilidade é confirmada durante o levantamento.",
  },
];

function FAQAccordion({
  question,
  answer,
  isOpen,
  onClick,
  index,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="group"
    >
      <button
        onClick={onClick}
        className="w-full py-5 flex items-center justify-between text-left focus:outline-none border-b border-white/10 hover:border-[#6B5CFF]/30 transition-colors"
      >
        <div className="flex items-center gap-4">
          <span className="text-[#6B5CFF] text-sm font-mono">0{index + 1}</span>
          <span className="text-lg font-medium text-white group-hover:text-[#6B5CFF] transition-colors pr-4">
            {question}
          </span>
        </div>
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-[#6B5CFF] shrink-0"
        >
          <PlusIcon className="w-6 h-6" />
        </motion.span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="py-6 pl-12">
              <p className="text-neutral-400 leading-relaxed">{answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="relative py-32 bg-[#030307]">
      {/* CSS-only Background Effects (GPU optimized) */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-[#6B5CFF]/5 rounded-full blur-[80px] bg-animate-pulse" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-4xl mx-auto px-6"
      >
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="inline-block px-4 py-2 rounded-full bg-[#6B5CFF]/10 border border-[#6B5CFF]/20 text-[#6B5CFF] text-sm font-medium mb-6"
          >
            Dúvidas frequentes
          </motion.span>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Perguntas <span className="gradient-text">Frequentes</span>
          </h2>
          <p className="text-lg text-neutral-400 max-w-xl mx-auto leading-relaxed">
            Tire suas dúvidas sobre nosso processo de desenvolvimento e encontre
            as respostas que você procura.
          </p>
        </div>

        <div className="bg-[#1a1a24]/50 rounded-2xl border border-white/10 p-2 md:p-4">
          {faqs.map((faq, index) => (
            <FAQAccordion
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onClick={() => handleToggle(index)}
              index={index}
            />
          ))}
        </div>

        {/* CTA at bottom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <p className="text-neutral-400 mb-4">
            Não encontrou o que procurava?
          </p>
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="#contato"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
          >
            Enviar uma mensagem
          </motion.a>
        </motion.div>
      </motion.div>
    </section>
  );
}
