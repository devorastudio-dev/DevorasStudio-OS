# Devora OS

Monorepo da plataforma operacional da Devora Studio. A base usa npm Workspaces e Turborepo para manter as aplicações `marketing` e `dashboard` independentes, com comandos de qualidade centralizados na raiz.

## Requisitos

- Node.js 24 LTS
- npm 11

## Instalação

Use o lockfile para obter uma instalação reproduzível:

```sh
npm ci
```

## Verificações de qualidade

Execute na raiz do repositório:

```sh
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
```

Para corrigir a formatação dos arquivos suportados:

```sh
npm run format
```

As demonstrações da base visual compartilhada ficam disponíveis em `/ui` nas aplicações `marketing` e `dashboard`. Consulte `packages/ui/README.md` para importar componentes e utilizar os tokens.
