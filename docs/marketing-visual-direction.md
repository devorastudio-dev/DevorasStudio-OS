# Direção visual e navegação do marketing

## Fonte visual

A implementação manual integrada na C1.2 é a fonte da verdade visual da landing do Devora Studio. Ela usa fundo escuro, roxo como cor principal, ciano como acento, luzes atmosféricas, imagens de projetos e animações pontuais com `motion`.

A integração preservou a composição manual e a conciliou com a arquitetura e os controles de segurança do repositório. Não substitua a Server Action, o formulário, a validação, a privacidade ou a captura de UTMs por implementações apenas visuais.

## Mapa de navegação

- `/#inicio`, `/#servicos`, `/#portfolio`, `/#produtos`, `/#processo` e `/#contato` identificam seções da landing;
- `/servicos`, `/produtos` e `/projetos` são índices públicos;
- `/servicos/[slug]`, `/produtos/[slug]` e `/projects/[slug]` são detalhes gerados a partir dos catálogos locais;
- `/privacy` descreve o tratamento dos dados do formulário;
- `https://app.devorastudio.com.br` é o único destino do dashboard e permanece fora do workspace de marketing.

Links entre rotas usam `next/link`. Links externos abrem uma nova aba somente quando isso é útil e devem manter `rel="noopener noreferrer"`. Não deixe `href="#"` como destino provisório.

## Conteúdo e publicação

Textos, cases, imagens, produtos e descrições provenientes da edição manual precisam de validação editorial da proprietária. Depoimentos, contatos, endereços, redes sociais, métricas, prazos e garantias não devem ser publicados sem confirmação verificável.

Antes de publicar uma alteração:

1. execute `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` na raiz;
2. revise a landing em 320, 375, 768, 1024 e 1440 px, incluindo menu móvel, foco por teclado e `prefers-reduced-motion`;
3. percorra os links internos, as rotas de detalhe, a privacidade e o destino do dashboard;
4. teste sucesso, falha e reenvio do formulário sem recarregar a página;
5. siga `docs/lead-capture.md` para validar a persistência e operar o fluxo de leads.

## Manutenção

- preserve um único `h1` por página e a ordem semântica dos títulos;
- mantenha a navegação por teclado, nomes acessíveis e foco visível;
- honre `prefers-reduced-motion` ao adicionar movimento;
- confirme a capitalização dos nomes dos assets, pois o deploy usa filesystem sensível a maiúsculas;
- não acople o marketing a módulos internos do dashboard nem exponha configuração server-side;
- adicione dependências somente quando forem efetivamente usadas e mantenha uma única biblioteca de movimento.
