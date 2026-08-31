# Devora OS

Plataforma operacional interna da Devora Studio. Monorepo, CI, Supabase versionado, organizações com RLS, autenticação por convite, MFA TOTP, papéis, auditoria, landing, CRM base, pipeline, atividades e tarefas comerciais já estão implementados. Propostas, contratos, projetos, financeiro e produtos SaaS continuam planejados.

A VIZEX é uma operação independente e não pertence a este repositório, seus ambientes ou seus dados.

## Arquitetura

```text
apps/marketing   site público (Next.js, porta 3000)
apps/dashboard   painel interno (Next.js, porta 3001)
packages/ui      componentes e tokens compartilhados
packages/config  configurações compartilhadas
supabase/        configuração local, migrações e testes pgTAP
docs/            decisões e procedimentos detalhados
```

Marketing e dashboard são projetos Vercel independentes no mesmo monorepo. O dashboard usa clientes Supabase por requisição, cookies SSR, guards server-side e RLS PostgreSQL. O proxy apenas renova a sessão.

## Tecnologias instaladas

- Next.js 16, React 19, TypeScript estrito e Tailwind CSS;
- Turborepo e npm Workspaces;
- Supabase JS, Supabase SSR e Supabase CLI;
- Zod, Vitest, Testing Library, pgTAP, ESLint e Prettier;
- GitHub Actions e Vercel.

Consulte o lockfile para versões exatas. Tecnologias citadas no escopo, mas ainda não instaladas, não fazem parte da implementação atual.

## Pré-requisitos

- Git;
- Node.js 24 LTS e npm 11;
- Docker Desktop para o Supabase local;
- acesso autorizado aos projetos Supabase e Vercel para operações remotas.

A CLI do Supabase é dependência do projeto; não é necessária instalação global.

## Instalação local

```sh
git clone <repositorio-autorizado>
cd devora-os
npm ci
```

No Windows PowerShell:

```powershell
Copy-Item apps/dashboard/.env.example apps/dashboard/.env.local
```

Em shells Unix:

```sh
cp apps/dashboard/.env.example apps/dashboard/.env.local
```

Preencha o arquivo localmente, sem compartilhar valores. Depois:

```sh
npm run supabase:start
npm run supabase:db:reset
npm run supabase:types
npm run dev
```

- Marketing: `http://localhost:3000`;
- Dashboard: `http://localhost:3001`;
- Supabase Studio e Mailpit: consulte `npm run supabase:status` e trate a saída como sensível.

O reset é exclusivamente local. Para executar apenas uma aplicação, use `npm run dev --workspace @devora/marketing` ou `npm run dev --workspace @devora/dashboard`.

## Variáveis de ambiente

| Nome                                   | Aplicação         | Exposição                | Obrigatória          | Finalidade                                      | Ambientes                                         |
| -------------------------------------- | ----------------- | ------------------------ | -------------------- | ----------------------------------------------- | ------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | dashboard         | pública                  | sim                  | URL da API Supabase                             | local, preview, produção                          |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | dashboard         | pública                  | sim                  | chave Publishable para cliente e SSR            | local, preview, produção                          |
| `APP_URL`                              | dashboard         | server-side, não secreta | sim em produção      | origem canônica dos callbacks                   | local, preview, produção                          |
| `SUPABASE_SECRET_KEY`                  | script de convite | secreta administrativa   | somente para convite | criar convite e vínculo por operação autorizada | máquina administrativa; normalmente não no deploy |

Variáveis `NEXT_PUBLIC_*` chegam ao navegador. Nunca dê esse prefixo a uma Secret key, senha ou token. `.env.local` não pode ser commitado; `.env.example` contém somente placeholders. Se o convite continuar sendo uma operação local, a Vercel não precisa de `SUPABASE_SECRET_KEY`.

## Scripts

| Comando                                                                                | Uso                                     |
| -------------------------------------------------------------------------------------- | --------------------------------------- |
| `npm run dev`                                                                          | inicia os workspaces em desenvolvimento |
| `npm run build`                                                                        | build completo                          |
| `npm run lint`                                                                         | ESLint                                  |
| `npm run typecheck`                                                                    | TypeScript sem emissão                  |
| `npm test`                                                                             | testes Vitest existentes                |
| `npm run format:check`                                                                 | confere Prettier                        |
| `npm run format`                                                                       | aplica Prettier                         |
| `npm run auth:invite -- --email <email> --organization-id <uuid> --full-name "<nome>"` | convite administrativo                  |
| `npm run auth:roles -- <comando> --organization-id <uuid> ...`                         | bootstrap e manutenção segura de papéis |
| `npm run supabase:start` / `supabase:stop` / `supabase:status`                         | controla a stack local                  |
| `npm run supabase:migration:new -- <nome>`                                             | cria migração                           |
| `npm run supabase:migration:up`                                                        | aplica migrações pendentes localmente   |
| `npm run supabase:db:reset`                                                            | recria somente o banco local            |
| `npm run supabase:db:lint`                                                             | lint do schema local                    |
| `npm run supabase:db:test`                                                             | testes pgTAP e RLS                      |
| `npm run supabase:db:diff`                                                             | detecta drift local                     |
| `npm run supabase:types`                                                               | gera tipos do schema local              |
| `npm run supabase:types:remote`                                                        | gera tipos do projeto vinculado         |
| `npm run supabase:db:push:dry-run`                                                     | revisa migrações remotas                |
| `npm run supabase:db:push`                                                             | aplica migrações ao projeto vinculado   |

## Banco e migrações

Migrações em `supabase/migrations/` são a fonte da verdade. Não ajuste produção manualmente sem criar uma migração equivalente.

```sh
npm run supabase:migration:new -- nome_descritivo
npm run supabase:db:reset
npm run supabase:db:lint
npm run supabase:db:test
npm run supabase:db:diff
npm run supabase:types
```

Revise o tipo gerado e execute as verificações. Antes de uma mudança remota relevante, confirme o projeto vinculado, verifique backup/PITR conforme o plano contratado e execute o dry-run. `supabase:db:reset` nunca deve ser adaptado para o remoto.

## Autenticação e MFA

- cadastro público permanece desabilitado;
- uma pessoa autorizada cria o convite pelo script administrativo;
- o link confirma a identidade, permite definir senha e ativa o vínculo preparado;
- login e recuperação retornam mensagens genéricas;
- membros convidados, suspensos ou sem vínculo ativo ficam sem acesso interno;
- membros ativos sem TOTP vão para `/auth/mfa/enroll`;
- membros com TOTP em AAL1 vão para `/auth/mfa/challenge`;
- somente AAL2 acessa dashboard, dados organizacionais e `/account/security`.

AAL1 significa que senha ou primeiro fator foi validado. AAL2 significa que o TOTP também foi validado nesta sessão. Guards server-side e RLS exigem AAL2; o middleware não substitui autorização.

O último fator obrigatório não pode ser removido pela aplicação. Se o autenticador for perdido, verifique a identidade fora do sistema, use ferramenta administrativa autorizada do Supabase, remova o fator, revogue sessões quando apropriado e exija novo enrollment. Não existem códigos de recuperação próprios.

Suspender um membro exige operação administrativa e revogação das sessões. Consulte [autenticação](docs/authentication.md) para convite, templates e recuperação.

Papéis e permissões são consultados no banco e nunca confiados ao navegador. A matriz inicial possui Administrador, Sócio, Colaborador e Financeiro. O primeiro Administrador deve ser atribuído explicitamente:

```sh
npm run auth:roles -- bootstrap \
  --organization-id <organization-uuid> \
  --user-id <user-uuid> \
  --confirm BOOTSTRAP
```

Use `list`, `assign`, `remove` e `effective` conforme o [guia de papéis e permissões](docs/access-control.md). O último Administrador ativo não pode ser removido ou suspenso.

## Deploy na Vercel

Crie ou mantenha dois projetos ligados ao mesmo repositório:

| Projeto   | Root Directory   | Domínio                   |
| --------- | ---------------- | ------------------------- |
| marketing | `apps/marketing` | `devorastudio.com.br`     |
| dashboard | `apps/dashboard` | `app.devorastudio.com.br` |

O framework é detectado como Next.js. Cadastre variáveis separadamente em Development, Preview e Production; previews devem apontar apenas para ambientes aprovados. Deploys ocorrem pelo Git e precisam concluir o build. Para rollback, promova/restaure um deployment anterior pela Vercel sem reescrever o histórico Git.

Configure o domínio pela interface atual da Vercel e pelo provedor DNS; não copie valores DNS antigos deste documento. Não existe `vercel.json` versionado atualmente.

## Supabase remoto

No projeto remoto:

1. mantenha cadastro público desativado e o provedor de e-mail habilitado para convidados;
2. use `https://app.devorastudio.com.br` como Site URL do dashboard;
3. autorize exatamente `/auth/confirm`, `/auth/callback` e `/auth/update-password` nas origens necessárias;
4. mantenha também os callbacks locais documentados para desenvolvimento;
5. habilite enrollment e verification de MFA TOTP;
6. revise senha mínima, validade de OTP, templates de convite/recuperação e SMTP;
7. evite wildcard global e não habilite Phone/WebAuthn sem nova tarefa;
8. vincule a CLI com `npx supabase login` e `npx supabase link --project-ref <project-ref>`;
9. faça dry-run antes de aplicar migrações e gere novamente os tipos.

O menu do painel pode mudar; confirme os nomes na documentação oficial. Nenhuma configuração remota é automatizada por este repositório.

## Landing e captação de leads

O workspace `apps/marketing` publica a landing, a política em `/privacy` e o formulário de contato. Configure `apps/marketing/.env.local` a partir do exemplo próprio. O envio ocorre somente no servidor pela RPC restrita; a chave administrativa nunca é usada.

Migração, permissões, controles contra repetição, operação e pendências estão no [guia de captação de leads](docs/lead-capture.md). Antes do deployment, confirme a organização `devora-studio`, aplique a migração pelo fluxo autorizado e configure `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` no projeto Vercel do marketing.

## CRM base

Usuários AAL2 com `crm.read` acessam `/crm`, leads, empresas e contatos. `crm.write` libera cadastro manual, triagem, vínculos e arquivamento lógico. Consultas são paginadas no servidor e RLS mantém o isolamento por tenant. Consulte [CRM base](docs/crm-base.md) para modelo, origens, operação, auditoria e limitações.

## Pipeline comercial

O dashboard expõe `/crm/pipeline` para membros AAL2 com `crm.read`. A conversão de leads e as mutações de oportunidades exigem `crm.write`, passam por RPCs transacionais e registram histórico e auditoria. Consulte [Pipeline comercial e oportunidades](docs/crm-pipeline.md) para operação, segurança, rollout e limitações.

## Atividades e tarefas comerciais

Interações realizadas são atividades; ações futuras são tarefas com prazo e responsável. A próxima ação de um lead ou oportunidade é derivada da tarefa pendente mais próxima. A visão `/crm/tasks` apresenta vencimentos e alertas operacionais. Consulte [Atividades, tarefas e próxima ação](docs/crm-activities-tasks.md).

O detalhe de uma oportunidade ganha permite conversão explícita e idempotente em cliente. `/crm/clients` mantém a base convertida, enquanto `/crm` consolida pipeline, conversão, tarefas e ausência de próxima ação diretamente no banco. Consulte [Conversão em cliente e dashboard comercial](docs/crm-clients-dashboard.md).

## Propostas

O módulo `/proposals` mantém catálogo de serviços, rascunhos e itens estruturados com snapshots comerciais, numeração humana concorrente e totais calculados no PostgreSQL. A D1 não produz PDF, envio ou aceite. Consulte [Fundação de propostas](docs/proposals-foundation.md).

## CI

Em pushes e pull requests para `main`, `.github/workflows/ci.yml` usa Node 24, `npm ci` e cache npm; verifica formatação, lint, tipos, Supabase local, reset, DB lint, pgTAP, Vitest e build. Qualquer falha interrompe o job.

## Manutenção recorrente

### A cada alteração

- conferir `git status` e revisar os diffs;
- criar migração e regenerar tipos quando o schema mudar;
- executar verificações proporcionais e criar commit pequeno;
- nunca preparar ou enviar segredos.

### Semanalmente

- revisar falhas da CI e Vercel;
- revisar logs de Auth/Supabase sem copiar dados sensíveis;
- verificar convites pendentes;
- tratar dependências somente diante de alerta ou tarefa planejada.

### Mensalmente

- revisar usuários, vínculos ativos/suspensos e fatores perdidos;
- conferir backups, uso e limites de Supabase/Vercel;
- revisar dependências desatualizadas em lote próprio;
- testar recuperação de acesso em ambiente seguro.

### Antes de produção

```sh
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run supabase:db:lint
npm run supabase:db:test
npm run supabase:db:diff
```

Além disso, revise migrações, segredos, fluxo de convite/login/MFA e o dry-run remoto.

## Atualização de dependências

Atualize em lotes pequenos, consulte changelogs e não misture upgrade grande com funcionalidade. Reinstale pelo lockfile e execute toda a suíte. O aviso de suporte da versão atual do ESLint é uma tarefa separada e não deve ser corrigido junto com MFA.

## Solução de problemas

| Problema                     | Diagnóstico seguro                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------------------- |
| Portas 3000/3001 ocupadas    | identifique o processo; encerre somente o processo conhecido ou altere a porta coordenadamente |
| Docker/Supabase indisponível | abra o Docker Desktop, aguarde o engine e rode `npm run supabase:status`                       |
| Callback não permitido       | compare origem e caminho exatos com a allowlist do Supabase                                    |
| Convite expirado             | confirme o vínculo pendente e reenvie pelo fluxo administrativo, sem expor tokens              |
| Acesso pendente              | confira o único vínculo e seu status por ferramenta administrativa                             |
| Sessão AAL1                  | conclua `/auth/mfa/challenge`; sem fator, use `/auth/mfa/enroll`                               |
| MFA perdido                  | aplique o procedimento administrativo de identidade, remoção e revogação de sessão             |
| Tipos desatualizados         | gere tipos do alvo correto, revise o diff e rode typecheck                                     |
| Schema drift                 | não aceite mudanças cegamente; investigue o diff e converta a decisão em migração              |
| Build Vercel falha           | reproduza com `npm ci && npm run build` e confira variáveis do ambiente correto                |
| Variável ausente             | compare apenas os nomes com `.env.example`; não imprima valores                                |
| E-mail não chega             | confira limite, SMTP, template, spam e logs de Auth sem revelar link/token                     |

Evite reset, exclusão de dados ou alteração remota como tentativa genérica de correção.

## Segurança

- RLS e validação server-side são obrigatórias; interface oculta não autoriza nada;
- áreas internas exigem MFA/AAL2;
- aplique menor privilégio e clientes por requisição;
- nunca use Secret/service role no navegador;
- mantenha ambientes locais fora do Git, revise logs e rotacione segredos comprometidos;
- seeds e testes usam somente dados fictícios;
- faça revisão de segredos antes de cada push.

## Git e contribuição

Use branches e pull requests, Conventional Commits em mudanças pequenas e revise `git diff`/`git diff --staged` antes do push. Não use `reset --hard`, `clean`, rebase ou outras operações destrutivas para resolver problemas comuns. Registre decisões arquiteturais relevantes em `docs/adr/`. A VIZEX permanece fora deste repositório.

## Documentação complementar

- [Supabase local e remoto](docs/supabase.md)
- [Autenticação, convite e MFA](docs/authentication.md)
- [Papéis, matriz e bootstrap](docs/access-control.md)
- [Auditoria básica e retenção](docs/audit.md)
- [CRM base: leads, empresas e contatos](docs/crm-base.md)
- [Pipeline comercial e oportunidades](docs/crm-pipeline.md)
- [Atividades, tarefas e próxima ação](docs/crm-activities-tasks.md)
- [Conversão em cliente e dashboard comercial](docs/crm-clients-dashboard.md)
- [Fundação de propostas](docs/proposals-foundation.md)
- [Matriz consolidada de RLS](docs/rls-security.md)
- [Núcleo de organizações e RLS](docs/database-core.md)
- [ADR de identidade e autorização](docs/adr/0001-identidade-e-autorizacao-organizacional.md)
- [Componentes compartilhados](packages/ui/README.md)
- [Escopo funcional e técnico](Devora-OS-Escopo-Tecnico.md)
