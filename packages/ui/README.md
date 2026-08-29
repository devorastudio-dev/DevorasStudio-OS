# @devora/ui

Base visual compartilhada pelas aplicações do Devora OS.

## Componentes

Importe sempre pela API pública do pacote:

```tsx
import { Button, Card, Input, Label } from "@devora/ui";
```

Não importe arquivos diretamente de `src/components`. Isso mantém os consumidores independentes da organização interna do pacote.

## Tokens e Tailwind CSS

Cada aplicação importa uma única vez o CSS compartilhado em seu `globals.css`:

```css
@import "@devora/ui/styles.css";
```

Os tokens ficam disponíveis como variáveis CSS com prefixo `--dv-` e, quando aplicável, como utilitários Tailwind, por exemplo `bg-background`, `text-text-muted`, `text-error` e `rounded-devora-md`.

## Adicionando um componente

1. Confirme que o componente será usado por marketing e dashboard, ou que há reutilização concreta prevista no incremento atual.
2. Prefira HTML semântico e preserve atributos nativos, foco, teclado, estado desabilitado e `ref`.
3. Exporte o componente em `src/index.ts`.
4. Adicione testes para comportamento, acessibilidade e variantes relevantes.
5. Inclua-o nas demonstrações apenas quando isso ajudar a validar seu uso real.

Componentes específicos de uma única aplicação devem permanecer nela até existir reutilização comprovada.
