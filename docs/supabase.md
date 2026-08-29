# Supabase: ambiente e migrações

Esta configuração cobre a infraestrutura da Fase 0 e o núcleo de organizações e perfis. Ainda não existem fluxos de autenticação nem outras entidades de negócio.

O núcleo de organizações, perfis, membros e suas políticas RLS está documentado em [`database-core.md`](database-core.md).

Convites, login, recuperação e proteção do dashboard estão documentados em [`authentication.md`](authentication.md).

## Requisitos e instalação

- Node.js 24 LTS e npm 11;
- Docker Desktop ou outro runtime compatível com a Docker API, em execução;
- portas locais definidas em `supabase/config.toml` disponíveis.

Instale tudo pelo lockfile. A CLI é uma dependência do projeto; não é necessário instalá-la globalmente.

```sh
npm ci
```

Crie `apps/dashboard/.env.local` a partir de `apps/dashboard/.env.example`. Obtenha os valores locais com `npm run supabase:status` depois de iniciar os serviços. Não compartilhe os valores pelo chat nem os inclua em commits.

## Comandos locais

| Comando                                              | Finalidade                                                           |
| ---------------------------------------------------- | -------------------------------------------------------------------- |
| `npm run supabase:start`                             | Inicia a stack local no Docker.                                      |
| `npm run supabase:stop`                              | Para a stack local sem apagar o banco.                               |
| `npm run supabase:status`                            | Exibe o estado e as credenciais locais. Trate a saída como sensível. |
| `npm run supabase:db:reset`                          | Recria somente o banco local a partir das migrações.                 |
| `npm run supabase:migration:new -- nome_da_migracao` | Cria uma migração SQL versionada.                                    |
| `npm run supabase:migration:up`                      | Aplica migrações pendentes somente no banco local.                   |
| `npm run supabase:db:diff`                           | Compara o banco local com o histórico de migrações.                  |
| `npm run supabase:db:lint`                           | Procura erros no schema `public` local.                              |
| `npm run supabase:db:test`                           | Executa testes pgTAP locais existentes.                              |
| `npm run supabase:types`                             | Gera tipos do schema `public` local para o dashboard.                |

O diretório `supabase/migrations` é a fonte da verdade do schema. Crie uma migração para cada alteração, revise o SQL e valide com reset, lint, testes e diff. Evite editar o schema remoto manualmente. Não há migração ou seed inicial porque nenhuma extensão, função ou entidade é necessária nesta etapa.

O arquivo `database.types.ts` é gerado pela CLI a partir do schema atualmente vazio. Gere-o novamente após cada alteração de schema; nunca mantenha tipos de tabelas manualmente.

## Variáveis e segredos

Somente `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` podem chegar ao navegador. A chave publicável identifica o projeto e sua segurança depende de RLS; toda tabela futura exposta pela Data API deverá ter RLS habilitada antes de uso.

Chaves secretas, a chave legada `service_role`, senha do banco, access tokens da CLI e outros segredos jamais podem usar o prefixo `NEXT_PUBLIC_`, aparecer em código, logs ou Git. Os arquivos `.env*` locais são ignorados, enquanto `.env.example` permanece versionado com valores fictícios.

## Criar e vincular o projeto de produção

Esta etapa é manual e deve ser feita pela proprietária, sem enviar credenciais a terceiros:

1. Acesse o painel do Supabase e autentique-se.
2. Crie uma organização ou selecione uma existente.
3. Crie um projeto com nome coerente, como `devora-os`.
4. Escolha a região mais próxima da operação. Para operação no Brasil, avalie **South America (São Paulo)** e confirme custo e disponibilidade no painel antes de criar.
5. Gere uma senha forte e única para o banco e guarde-a em um gerenciador de senhas.
6. Ative MFA nas configurações da conta Supabase.
7. Pelas opções de conexão do projeto, localize a Project URL e a chave **Publishable** (`sb_publishable_...`). Não use Secret nem `service_role` no dashboard.
8. Copie `apps/dashboard/.env.example` para `.env.local` e preencha os dois valores localmente, sem compartilhá-los.
9. No terminal local, autentique e vincule a CLI:

   ```sh
   npx supabase login
   npx supabase link --project-ref <project-ref>
   ```

10. Revise o plano e só depois aplique migrações:

    ```sh
    npm run supabase:db:push:dry-run
    npm run supabase:db:push
    ```

11. Gere os tipos a partir do projeto vinculado:

    ```sh
    npm run supabase:types:remote
    ```

12. Execute `git status`, revise `git diff` e procure segredos antes de preparar qualquer commit.

Ambientes local e remoto possuem bancos e credenciais distintos. Confirme sempre o alvo antes de comandos com `--linked`; nunca execute reset no projeto remoto.

## Erros comuns

- **Docker indisponível:** abra o Docker Desktop, aguarde o engine ficar pronto e tente `npm run supabase:start` novamente.
- **Porta ocupada:** encerre apenas o processo conhecido ou ajuste as portas de desenvolvimento em `supabase/config.toml` de forma coordenada.
- **Stack não iniciada:** `status`, reset, lint, testes, diff e geração local de tipos exigem `supabase:start` primeiro.
- **Projeto não vinculado:** execute `npx supabase login` e `npx supabase link --project-ref <project-ref>` antes dos comandos remotos.
- **Variável inválida:** confira os nomes no `.env.example`; o validador nunca inclui os valores na mensagem de erro.
