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
npm run build
```

Para corrigir a formatação dos arquivos suportados:

```sh
npm run format
```

Ainda não há uma suíte de testes ou um script `test`. A CI deverá passar a executar esse script quando testes reais forem adicionados ao projeto.
