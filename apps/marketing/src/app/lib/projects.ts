import { ReactNode } from "react";

const globalImg = "/global.png";
const devoraImg = "/Devora-w.png";
const lojaImg = "/fiore.png";
const odontsmartImg = "/odonto.png";
const royalBarberImg = "/royal.png";
const jupaniImg = "/jupani.png";
const nalenteImg = "/nalente.png";
const erpjupaniImg = "/erpjupani.png";
const buzllyImg = "/buzlly.png";

export type ProjectCategory =
  "Landing Pages" | "Sites Institucionais" | "Sistemas e SaaS" | "E-commerce";

export type Project = {
  description?: ReactNode;
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  challenge: string;
  solution: string;
  features: string[];
  technologies: { name: string; category: string }[];
  stack: string[];
  image: string;
  images?: string[];
  link: string;
  liveUrl?: string;
  githubUrl?: string;
  duration: string;
  year: string;
  status?: "completed" | "in-development";
  version?: string;

  // 🔥 novos campos
  category: ProjectCategory;
  results?: string[];
  highlight?: boolean;
  clientType?: "local-business" | "startup" | "ecommerce";
};

export const projects: Project[] = [
  {
    slug: "ecommerce-jupani",
    category: "E-commerce",
    title: "E-commerce para Confeitaria Ju.pani",
    shortDescription:
      "Loja online com catálogo dinâmico e pedidos automatizados via WhatsApp, focada em conversão.",

    fullDescription:
      "Desenvolvemos o e-commerce da Ju.pani com foco direto em conversão. A plataforma permite navegação por catálogo organizado, personalização de produtos e finalização rápida.\n\nO diferencial está na automatização: o sistema gera o pedido completo e envia diretamente para o WhatsApp, reduzindo fricção e acelerando vendas.",

    challenge:
      "Criar uma experiência extremamente simples, principalmente no mobile, reduzindo etapas e eliminando dúvidas no processo de compra.",

    solution:
      "Interface moderna e responsiva com fluxo otimizado. Checkout automatizado com geração de pedido e envio via WhatsApp.\n\nResultado: mais agilidade no atendimento e aumento na conversão.",

    results: [
      "Redução no tempo de atendimento",
      "Aumento na taxa de conversão",
    ],

    features: [
      "Landing page otimizada para conversão",
      "Catálogo dinâmico",
      "Personalização de produtos",
      "Checkout simplificado",
      "Envio via WhatsApp",
      "Mobile-first",
    ],

    technologies: [
      { name: "React 18", category: "Frontend" },
      { name: "Next.js 14", category: "Framework" },
      { name: "TailwindCSS", category: "Styling" },
      { name: "TypeScript", category: "Linguagem" },
    ],

    stack: ["React", "Next.js", "TailwindCSS", "TypeScript"],
    image: jupaniImg,
    link: "https://jupani.com.br",
    liveUrl: "https://jupani.com.br",
    duration: "5 dias",
    year: "2026",
    highlight: true,
    clientType: "ecommerce",
  },

  {
    slug: "erp-jupani",
    category: "Sistemas e SaaS",
    title: "ERP para Confeitaria Ju.pani",

    shortDescription:
      "Sistema de gestão completo com controle de estoque, custos e integração com e-commerce.",

    fullDescription:
      "Desenvolvemos um ERP completo para centralizar toda a operação da confeitaria.\n\nA plataforma gerencia estoque, receitas, custos e produtos com integração em tempo real ao e-commerce.",

    challenge:
      "Criar um sistema robusto, mas simples o suficiente para uso diário por pessoas não técnicas.",

    solution:
      "Painel intuitivo com automações inteligentes: cálculo de custo, atualização de estoque e sincronização com vendas.\n\nResultado: menos erros e mais controle.",

    results: ["Redução de erros operacionais", "Maior controle financeiro"],

    features: [
      "Controle de estoque",
      "Cálculo automático de custo",
      "Gestão de receitas",
      "Dashboard administrativo",
    ],

    technologies: [
      { name: "Next.js", category: "Framework" },
      { name: "Supabase", category: "Backend" },
      { name: "TypeScript", category: "Linguagem" },
    ],

    stack: ["Next.js", "Supabase", "TypeScript"],
    image: erpjupaniImg,
    link: "#",
    duration: "7 dias",
    year: "2026",
    status: "completed",
    highlight: true,
    clientType: "local-business",
  },

  {
    slug: "institucional-nalente",
    category: "Sites Institucionais",
    title: "Site Institucional Na Lente",

    shortDescription:
      "Landing page estratégica focada em posicionamento e geração de valor.",

    fullDescription:
      "Criamos um site com foco em reposicionamento de mercado.\n\nA página educa o cliente e demonstra como eventos podem gerar valor contínuo.",

    challenge:
      "Quebrar a percepção de fotografia como custo e mostrar valor estratégico.",

    solution:
      "Estrutura baseada em storytelling e conversão.\n\nResultado: comunicação mais forte e aumento de percepção de valor.",

    results: [
      "Melhor posicionamento de marca",
      "Aumento na percepção de valor",
    ],

    features: ["Copy estratégica", "Storytelling", "CTA otimizado"],

    technologies: [{ name: "Next.js", category: "Framework" }],

    stack: ["Next.js"],
    image: nalenteImg,
    link: "#",
    duration: "3 dias",
    year: "2026",
    clientType: "local-business",
    highlight: true,
  },

  {
    slug: "royal-barber",
    category: "Sites Institucionais",
    title: "Royal Barber – Agendamento Online",

    shortDescription:
      "Site com sistema de agendamento online simples e eficiente.",

    fullDescription:
      "Desenvolvemos um site com agendamento direto pelo navegador.\n\nClientes escolhem serviço e horário de forma rápida.",

    challenge: "Evitar conflitos de horário mantendo simplicidade.",

    solution:
      "Fluxo guiado com validação automática.\n\nResultado: organização e melhor experiência.",

    results: ["Redução de conflitos de agenda"],

    features: ["Agendamento online", "Integração WhatsApp"],

    technologies: [{ name: "Next.js", category: "Framework" }],

    stack: ["Next.js"],
    image: royalBarberImg,
    link: "https://royal-barber-murex.vercel.app",
    liveUrl: "https://royal-barber-murex.vercel.app",
    duration: "5 dias",
    year: "2026",
    highlight: true,
    clientType: "local-business",
  },

  {
    slug: "landingpage-odontsmart",
    category: "Landing Pages",
    title: "Landing Page OdontoSmart",

    shortDescription:
      "Landing page focada em captação de pacientes e agendamentos.",

    fullDescription:
      "Página criada para converter visitantes em pacientes.\n\nEstrutura direta com foco em ação.",

    challenge: "Gerar confiança rapidamente.",

    solution:
      "Copy direta + provas sociais.\n\nResultado: aumento de agendamentos.",

    results: ["Aumento de leads"],

    features: ["CTA forte", "Prova social"],

    technologies: [{ name: "Next.js", category: "Framework" }],

    stack: ["Next.js"],
    image: odontsmartImg,
    link: "https://odontsmart.vercel.app",
    liveUrl: "https://odontsmart.vercel.app",
    duration: "1,5 semanas",
    year: "2026",
    highlight: true,
    clientType: "local-business",
  },

  {
    slug: "landing-global",
    category: "Landing Pages",
    title: "Landing Page Globalshop",

    shortDescription: "Landing page de alta conversão para e-commerce.",

    fullDescription:
      "Página otimizada para performance e vendas.\n\nFoco em velocidade e UX.",

    challenge: "Equilibrar performance e design.",

    solution: "SSR + otimizações.\n\nResultado: aumento de conversão.",

    results: ["+40% conversão"],

    features: ["SEO otimizado", "Alta performance"],

    technologies: [{ name: "Next.js", category: "Framework" }],

    stack: ["Next.js"],
    image: globalImg,
    link: "https://global-shop-hazel.vercel.app",
    liveUrl: "https://global-shop-hazel.vercel.app",
    duration: "5 dias",
    year: "2025",
    clientType: "ecommerce",
  },

  {
    slug: "micro-saas-ajuda-se",
    category: "Sistemas e SaaS",
    title: "Micro SaaS Ajuda-se",

    shortDescription: "Sistema completo de gestão para pequenas empresas.",

    fullDescription:
      "Plataforma SaaS com módulos de clientes, financeiro e relatórios.",

    challenge: "Criar sistema completo e simples.",

    solution: "Arquitetura escalável + UX clara.",

    features: ["Dashboard", "Financeiro", "Relatórios"],

    technologies: [{ name: "Next.js", category: "Fullstack" }],

    stack: ["Next.js"],
    image: devoraImg,
    link: "#",
    duration: "~ 8 semanas",
    year: "2025",
    status: "in-development",
    clientType: "startup",
  },

  {
    slug: "loja-virtual-fiore",
    category: "E-commerce",
    title: "E-commerce de Moda – Fiore",

    shortDescription: "Loja virtual com foco em experiência e conversão.",

    fullDescription:
      "E-commerce moderno com navegação fluida e estrutura escalável.",

    challenge: "Equilibrar estética e performance.",

    solution: "UX otimizada + base escalável.",

    features: ["Catálogo", "Carrinho", "Filtros"],

    technologies: [{ name: "Next.js", category: "Framework" }],

    stack: ["Next.js"],
    image: lojaImg,
    link: "#",
    duration: "~ 6 semanas",
    year: "2026",
    status: "in-development",
    clientType: "ecommerce",
  },

  {
    slug: "saas-buzllys",
    category: "Sistemas e SaaS",
    title: "Buzllys – SaaS de Agendamento para Barbearias e Salões",

    shortDescription:
      "Sistema SaaS para agendamento e gestão de atendimentos, focado em organização, automação e aumento de produtividade.",

    fullDescription:
      "Desenvolvemos o Buzllys, uma plataforma SaaS completa para barbearias e salões de beleza que buscam profissionalizar sua gestão e automatizar o processo de agendamento.\n\nO sistema permite que clientes agendem horários online de forma rápida, enquanto o negócio gerencia serviços, profissionais e disponibilidade em tempo real.\n\nA solução foi projetada para reduzir falhas operacionais, evitar conflitos de agenda e melhorar a experiência tanto do cliente quanto da equipe.",

    challenge:
      "O principal desafio foi criar um sistema flexível o suficiente para atender diferentes rotinas — desde barbearias até salões com múltiplos profissionais e serviços variados — sem comprometer a simplicidade de uso.",

    solution:
      "Desenvolvemos um sistema com controle inteligente de agenda, permitindo configurar horários, profissionais e serviços de forma personalizada.\n\nO fluxo de agendamento foi simplificado para o cliente, enquanto o painel administrativo centraliza toda a operação.\n\nIsso garante organização, reduz falhas e melhora a eficiência do atendimento.",

    results: [
      "Redução de conflitos de horários",
      "Aumento na organização operacional",
      "Diminuição de atendimentos perdidos",
      "Melhora na experiência do cliente",
    ],

    features: [
      "Agendamento online",
      "Gestão de horários e disponibilidade",
      "Cadastro de serviços e profissionais",
      "Bloqueio automático de horários",
      "Painel administrativo completo",
      "Interface simples e intuitiva",
      "Responsivo (mobile-first)",
    ],

    technologies: [
      { name: "React 18", category: "Frontend" },
      { name: "Next.js 14", category: "Framework" },
      { name: "TypeScript", category: "Linguagem" },
      { name: "Supabase", category: "Backend & Database" },
      { name: "TailwindCSS", category: "Styling" },
    ],

    stack: ["React", "Next.js", "TypeScript", "Supabase", "TailwindCSS"],
    image: buzllyImg,
    link: "https://buzllys.com",
    liveUrl: "https://buzllys.com",
    duration: "Em desenvolvimento contínuo",
    year: "2026",
    status: "completed",
    highlight: true,
    clientType: "startup",
  },
];

//featured dinâmico
export function getFeaturedProjects() {
  return projects.filter((p) => p.highlight);
}

//agrupamento limpo
export function getProjectsGroupedByCategory() {
  const categories: ProjectCategory[] = [
    "Landing Pages",
    "Sites Institucionais",
    "Sistemas e SaaS",
    "E-commerce",
  ];

  return categories.map((category) => ({
    category,
    projects: projects.filter((p) => p.category === category),
  }));
}
