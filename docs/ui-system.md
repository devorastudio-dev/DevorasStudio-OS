# Sistema de interface da Devora OS

## Inventário D2.1

As superfícies autenticadas inventariadas são: `/`, `/crm`, leads (lista, criação e detalhe), empresas (lista, criação e detalhe), contatos (lista, criação e detalhe), pipeline, oportunidade, tarefas, clientes (lista e detalhe), propostas (lista, criação, detalhe/editor e preview), catálogo de serviços, membros, auditoria, segurança e showcase de UI. As superfícies de identidade são login, recuperação, nova senha, acesso pendente, MFA enrollment e challenge. Callbacks de Auth não possuem UI.

Antes da reforma havia shells independentes em CRM e Propostas, enquanto home, administração e conta usavam containers próprios. Headers, filtros e listas repetiam classes locais; a navegação mobile ocupava espaço permanente; não havia estado ativo global, breadcrumbs, menu de conta ou dashboard operacional central.

## Shell

`AppShell` permanece Server Component e resolve permissões no servidor. `AppShellClient` concentra apenas navegação interativa: sidebar, grupos Radix Collapsible, tooltips, Sheet mobile e dropdown de conta. O estado recolhido é persistido em `localStorage` sem dado sensível e aplicado depois da hidratação.

No desktop a sidebar possui 256 px expandida e 76 px recolhida. A área central acompanha a largura; a navegação possui scroll próprio e o rodapé de conta permanece alcançável. No mobile, abaixo de 900 px, a sidebar sai completamente do fluxo e a topbar abre um Dialog/Sheet Radix com overlay, foco controlado, Escape e botão fechar.

Os grupos são Visão geral, Comercial, Propostas e Administração. Links dependem das permissões reais, e o item ativo usa fundo, peso, ícone preenchido, marcador lateral e `aria-current`, sem depender somente de cor. Breadcrumbs omitem UUIDs e reduzem segmentos no celular.

## Tokens e composição

Os tokens compartilhados permanecem em `packages/ui/src/styles.css`. O dashboard acrescenta somente tokens de composição do shell em `globals.css`: largura da sidebar, topbar, conteúdo máximo e superfícies da navegação. Espaçamento usa a escala 4/8/12/16/24/32/48; formulários têm no máximo duas colunas e voltam a uma coluna no celular. Conteúdo é limitado a 1440 px.

Tipografia usa títulos entre 26–34 px, seções de 16–18 px, corpo de 14–16 px e captions de 12–13 px. Cards têm sombra mínima e agrupam apenas dados relacionados. Botões mantêm as variantes primary, secondary, ghost e danger do pacote UI.

## Padrões

- `PageHeader`: eyebrow, título, descrição e ações contextuais;
- métricas: cards compactos, linkáveis e com ícone semântico;
- filtros: superfície compacta e responsiva;
- tabelas: cabeçalho consistente no desktop e linhas convertidas em cards no celular;
- formulários: labels persistentes, helpers, controles com foco visível e ações hierarquizadas;
- status: badges sempre com texto;
- empty/error/loading: orientação, mensagem sanitizada e ação somente quando autorizada;
- editor de proposta: navegação sticky entre Resumo, Itens, Conteúdo e Preview;
- auth/MFA: shell de identidade próprio, consistente, sem alterar Auth, cookies, AAL ou MFA.

## Dashboard

A rota `/` usa exclusivamente dados reais: `get_crm_dashboard` para CRM e consulta tenant-aware de propostas draft. Mostra leads ativos, oportunidades abertas, clientes convertidos, tarefas atrasadas e drafts. “Precisa de atenção” agrega tarefas atrasadas/de hoje e entidades sem próxima ação. Atalhos são renderizados somente com `crm.write` ou `proposals.write`.

Não há receita, MRR, financeiro, contratos ou projetos fictícios. Pipeline continua sendo valor comercial estimado, não receita.

## Iconografia e acessibilidade

Phosphor 2.1 é a única iconografia visual nova do dashboard. Ícones decorativos usam `aria-hidden`; botões de ícone possuem `aria-label`. Primitives interativas seguem o padrão Shadcn sobre Radix: Dialog/Sheet, Tooltip, Collapsible e DropdownMenu.

Meta: WCAG 2.2 AA, com skip link, foco visível, labels, `aria-current`, navegação por teclado, Escape, foco modal, contraste textual e `prefers-reduced-motion`. Tabelas densas e pipeline preservam leitura mobile sem esconder ações essenciais.

## Limites

Não há dark mode, command menu, busca global ou nova biblioteca de gráficos. A reforma não altera regras de domínio, RLS, RPCs, MFA ou autorização. Novos módulos devem reutilizar o shell e os padrões acima, evitando shells e paletas paralelas.
