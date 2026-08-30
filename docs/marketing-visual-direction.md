# Direção visual do marketing

## Decisão

A landing do Devora Studio usa uma direção escura e tecnológica, com roxo como cor principal, ciano como acento, superfícies discretas e hierarquia tipográfica ampla. A referência autorizada foi o repositório histórico `devorastudio-dev/Portifolio`, consultado somente para leitura durante a C1.1.

O código, a arquitetura, o conteúdo e a segurança da landing atual continuam sendo a fonte da verdade. A referência antiga não deve ser copiada integralmente.

## Elementos adaptados

- paleta escura com roxo e ciano;
- gradientes tipográficos e luzes atmosféricas discretas;
- grade de fundo, cartões escuros e painel visual no hero;
- marca geométrica recriada em CSS para funcionar em qualquer densidade;
- ritmo amplo entre seções e chamadas para a ação.

Nenhum arquivo binário foi copiado. O logotipo raster histórico foi inspecionado, mas não reutilizado porque incorpora fundo preto e não oferece a flexibilidade necessária.

## Elementos deliberadamente excluídos

Cases, imagens de projetos, depoimentos, produtos, métricas, prazos, garantias, preços, contatos, endereços e redes sociais do repositório antigo não foram reutilizados. Esses dados exigem confirmação editorial antes de qualquer publicação.

Animações contínuas, bibliotecas de movimento, efeitos de desfoque excessivos e dependências visuais adicionais também foram descartados. A implementação atual prioriza CSS, Server Components, foco visível, contraste e `prefers-reduced-motion`.

## Manutenção

- preserve um único `h1` e a ordem semântica dos títulos;
- mantenha textos e links comerciais limitados ao que estiver confirmado;
- valide mudanças em 320, 375, 768, 1024 e 1440 px;
- não acople o marketing ao dashboard nem exponha configuração server-side;
- mantenha o formulário, sua Server Action e as proteções descritas em `docs/lead-capture.md`.
