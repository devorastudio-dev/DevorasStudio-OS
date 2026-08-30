import {
  Browser,
  ChartLineUp,
  Code,
  Lifebuoy,
  PaintBrush,
  Robot,
  ScissorsIcon,
  Storefront,
  UsersThreeIcon,
  Wrench,
} from "@phosphor-icons/react/dist/ssr";

export type ServiceOffer = {
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  idealFor: string;
  delivery: string[];
  highlights: string[];
  exampleProjectSlugs: string[];
  icon: typeof Code;
};

export type ProductOffer = {
  slug: string;
  name: string;
  status: "ativo" | "em-breve";
  summary: string;
  description: string;
  pricing: string;
  audience: string;
  features: string[];
  icon: typeof Code;
};

export const serviceOffers: ServiceOffer[] = [
  {
    slug: "landing-pages",
    title: "Landing Pages",
    shortDescription:
      "Páginas focadas em tráfego, captação de leads e conversão.",
    fullDescription:
      "Criamos landing pages com copy mais estratégica, design mais limpo e estrutura pensada para transformar visita em conversa, orçamento ou venda.",
    idealFor:
      "Campanhas de tráfego pago, lançamentos, captação de leads e validação de ofertas.",
    delivery: [
      "Copy orientada a ação",
      "Estrutura de seções comerciais",
      "SEO técnico básico",
      "Analytics e pixels",
    ],
    highlights: [
      "Mobile first",
      "Carregamento rápido",
      "CTA claro",
      "Integração com WhatsApp ou formulário",
    ],
    exampleProjectSlugs: [
      "landingpage-odontsmart",
      "landing-global",
      "landing-jupani",
    ],
    icon: ChartLineUp,
  },
  {
    slug: "sites-institucionais",
    title: "Sites Institucionais",
    shortDescription:
      "Sites profissionais para posicionar sua marca e gerar confiança.",
    fullDescription:
      "Desenhamos sites institucionais que ajudam sua empresa a parecer maior, mais clara e mais preparada para vender. O objetivo é unir presença forte com boa usabilidade.",
    idealFor:
      "Empresas que precisam apresentar autoridade, serviços, cases e diferenciais com mais clareza.",
    delivery: [
      "Arquitetura da informação",
      "Design sob medida",
      "Seções de prova social",
      "Estrutura pronta para expansão",
    ],
    highlights: [
      "Visual mais premium",
      "Conteúdo escaneável",
      "SEO local",
      "Responsividade",
    ],
    exampleProjectSlugs: ["royal-barber", "landing-jupani"],
    icon: Browser,
  },
  {
    slug: "sistemas-sob-medida",
    title: "Sistemas Sob Medida",
    shortDescription:
      "Painéis, fluxos internos e plataformas feitas para o seu processo.",
    fullDescription:
      "Desenvolvemos sistemas para organizar operação, atendimento, processos internos, relatórios e rotinas específicas do seu negócio.",
    idealFor:
      "Empresas que já operam no digital e querem parar de improvisar com planilhas e retrabalho.",
    delivery: [
      "Mapeamento de fluxo",
      "Painéis administrativos",
      "Permissões por usuário",
      "Base preparada para crescer",
    ],
    highlights: [
      "Arquitetura escalável",
      "Código limpo",
      "UX para uso diário",
      "Integrações futuras",
    ],
    exampleProjectSlugs: [
      "micro-saas-ajuda-se",
      "landing-jupani",
      "royal-barber",
    ],
    icon: Code,
  },
  {
    slug: "design-ui-ux",
    title: "Design UI/UX",
    shortDescription: "Interfaces mais claras, atraentes e fáceis de usar.",
    fullDescription:
      "Também atuamos na camada de design, refinando estética, hierarquia visual, usabilidade e percepção de valor do produto ou da marca.",
    idealFor:
      "Quem precisa melhorar conversão, apresentação visual ou experiência de uso do sistema/site atual.",
    delivery: [
      "Direção visual",
      "Wireframes",
      "Refino de interface",
      "Ajustes de jornada do usuário",
    ],
    highlights: [
      "Mais clareza",
      "Mais percepção de valor",
      "Menos ruído visual",
      "Experiência mais fluida",
    ],
    exampleProjectSlugs: [
      "landing-global",
      "landingpage-odontsmart",
      "loja-virtual-fiore",
    ],
    icon: PaintBrush,
  },
  {
    slug: "manutencao-continuada",
    title: "Manutenção Contínua",
    shortDescription:
      "Acompanhamento pós-entrega para manter tudo saudável e evoluindo.",
    fullDescription:
      "Não paramos na entrega. Podemos seguir com manutenção recorrente para corrigir, atualizar, otimizar e evoluir o projeto de forma contínua.",
    idealFor:
      "Empresas que precisam de suporte técnico confiável sem montar equipe própria desde o início.",
    delivery: [
      "Correções e melhorias",
      "Ajustes de performance",
      "Atualizações técnicas",
      "Pequenas evoluções mensais",
    ],
    highlights: [
      "Mais estabilidade",
      "Menos urgência",
      "Evolução constante",
      "Suporte próximo",
    ],
    exampleProjectSlugs: [
      "micro-saas-ajuda-se",
      "loja-virtual-fiore",
      "landing-jupani",
    ],
    icon: Lifebuoy,
  },
  {
    slug: "automacao-e-integracoes",
    title: "Automações e Integrações",
    shortDescription: "Conectamos ferramentas e reduzimos tarefas repetitivas.",
    fullDescription:
      "Criamos automações e integrações entre APIs, sistemas internos, WhatsApp, CRM, ERP e serviços de terceiros para economizar tempo operacional.",
    idealFor:
      "Negócios que querem eliminar retrabalho, centralizar dados ou acelerar atendimento.",
    delivery: [
      "Integrações via API",
      "Webhooks",
      "Bots e rotinas",
      "Conexão entre ferramentas",
    ],
    highlights: [
      "Menos operação manual",
      "Mais consistência",
      "Economia de tempo",
      "Processos integrados",
    ],
    exampleProjectSlugs: [
      "landing-jupani",
      "royal-barber",
      "micro-saas-ajuda-se",
    ],
    icon: Robot,
  },
];

export const productOffers: ProductOffer[] = [
  {
    slug: "gestao-barbearias",
    name: "SaaS de Gestão para Barbearias",
    status: "ativo",
    summary:
      "Produto próprio com assinatura mensal ou anual para organizar operação e agenda.",
    description:
      "Nosso SaaS para barbearias centraliza agendamentos, equipe, clientes, serviços e rotina financeira em uma solução simples de operar.",
    pricing: "Assinatura mensal e anual",
    audience:
      "Barbearias que querem profissionalizar atendimento e gestão sem depender de planilhas.",
    features: [
      "Agenda online",
      "Cadastro de clientes",
      "Controle de caixa",
      "Gestão por barbeiro",
      "Histórico de atendimentos",
    ],
    icon: ScissorsIcon,
  },
  {
    slug: "ajuda-se",
    name: "Micro SaaS Ajuda-se",
    status: "em-breve",
    summary: "Produto próprio em evolução para gestão de pequenas operações.",
    description:
      "O Ajuda-se será um micro SaaS da casa, pensado para facilitar gestão interna, organização de tarefas e rotina administrativa.",
    pricing: "Pré-lançamento",
    audience:
      "Pequenas empresas e operações enxutas que precisam de mais controle sem complexidade.",
    features: [
      "Gestão simplificada",
      "Rotinas operacionais",
      "Visão central do negócio",
      "Modelo leve de adoção",
    ],
    icon: UsersThreeIcon,
  },
  {
    slug: "pdv-assinatura",
    name: "PDV por Assinatura",
    status: "em-breve",
    summary:
      "Sistema próprio em desenvolvimento para vendas, caixa e operação comercial.",
    description:
      "Estamos preparando um produto de PDV por assinatura para empresas que precisam organizar vendas, caixa e fluxo operacional com mais simplicidade.",
    pricing: "Em breve",
    audience:
      "Negócios físicos que precisam de um ponto de venda mais moderno e acessível.",
    features: [
      "Fluxo de venda",
      "Caixa e fechamento",
      "Organização operacional",
      "Modelo recorrente",
    ],
    icon: Storefront,
  },
  {
    slug: "erp-assinatura",
    name: "ERP por Assinatura",
    status: "em-breve",
    summary:
      "Produto planejado para gestão mais ampla com visão financeira e operacional.",
    description:
      "Também estamos estruturando um ERP em modelo de assinatura para negócios que precisam integrar setores e ganhar previsibilidade operacional.",
    pricing: "Em breve",
    audience:
      "Empresas em crescimento que precisam ir além de controles soltos.",
    features: [
      "Financeiro",
      "Operação integrada",
      "Relatórios gerenciais",
      "Base para expansão",
    ],
    icon: Wrench,
  },
];

export function getServiceBySlug(slug: string) {
  return serviceOffers.find((service) => service.slug === slug);
}

export function getProductBySlug(slug: string) {
  return productOffers.find((product) => product.slug === slug);
}
