# Consolidação de RLS da Fundação

O banco segue negação por padrão. RLS é a barreira final de dados; guards server-side controlam navegação e mensagens; a interface apenas oculta ações que o banco também negaria.

Uma operação interna exige, conforme a tabela: identidade autenticada, associação `active`, claim AAL2, organização correspondente e permissão consultada no estado atual do banco. `invited`, `suspended`, ausência de claim, AAL inválido e papel removido falham de forma fechada.

## Matriz final

| Tabela                      | SELECT de `authenticated`                   | Escrita de `authenticated`                               | Administração confiável                |
| --------------------------- | ------------------------------------------- | -------------------------------------------------------- | -------------------------------------- |
| `profiles`                  | próprio perfil, associação ativa e AAL2     | somente `full_name` e `avatar_url`, com a mesma condição | trigger de `auth.users`                |
| `organizations`             | própria organização com `organization.read` | nenhuma                                                  | banco/Secret key autorizada            |
| `organization_members`      | própria organização com `members.read`      | nenhuma direta                                           | convite e operação administrativa      |
| `permissions`               | membro com `roles.read`                     | nenhuma                                                  | migrações                              |
| `roles`                     | própria organização com `roles.read`        | nenhuma                                                  | migrações e seed de sistema            |
| `role_permissions`          | própria organização com `roles.read`        | nenhuma                                                  | migrações                              |
| `organization_member_roles` | própria organização com `roles.read`        | nenhuma direta                                           | RPCs restritas e script administrativo |
| `audit_logs`                | própria organização com `audit.read` e AAL2 | nenhuma direta                                           | funções e trigger catalogados          |

`anon` não possui grants de tabelas internas. Não existem views, materialized views ou sequences de aplicação. RLS não é forçado: os papéis da Data API continuam sujeitos às políticas, enquanto owner e `service_role` permanecem reservados a migrações, triggers e operações administrativas deliberadas.

## Funções privilegiadas

- `private.has_active_membership`, `private.is_active_organization_member` e `private.has_permission` atravessam RLS apenas para derivar autorização da sessão e do banco.
- `accept_my_organization_invitation` usa exclusivamente `auth.uid()` e aceita somente um convite válido da própria identidade.
- `assign_member_role` e `remove_member_role` exigem AAL2, `roles.manage`, mesma organização e bloqueiam autoalteração.
- `record_audit_event` fixa ator e organização, restringe ação/outcome/metadata por classe de chamador e é a única RPC de auditoria acessível ao client.
- `record_administrative_audit` aceita catálogo reduzido e somente `service_role` pode executá-la.
- triggers privados criam perfil, papéis de sistema, timestamps, protegem o último Administrador e registram atribuições de papel atomicamente.

Todas as funções `security definer` usam `search_path` vazio, objetos qualificados e `EXECUTE` revogado de `PUBLIC`. Funções privadas só recebem grant quando uma política ou fluxo autenticado realmente precisa chamá-las.

## Checklist para nova tabela

1. Inclua `organization_id` com FK e índices alinhados às consultas reais.
2. Habilite RLS antes de conceder acesso à Data API.
3. Revogue grants padrão e conceda apenas operações necessárias.
4. Derive usuário e organização de `auth.uid()` e do vínculo atual; nunca de e-mail ou formulário.
5. Exija AAL2 e uma permissão existente, sem criar capacidade especulativa.
6. Em `UPDATE`, use `USING` e `WITH CHECK` coerentes e teste troca de organização.
7. Teste `anon`, sem vínculo, `invited`, `suspended`, AAL1, AAL2, sem papel e duas organizações.
8. Teste chamadas RPC diretas, IDs conhecidos, INSERT, UPDATE e DELETE negados.
9. Revise `search_path`, owner e ACL de toda função nova.
10. Adicione pgTAP antes de expor rota ou componente.

Fixtures devem usar duas organizações, UUIDs determinísticos e endereços `example.invalid`, sempre dentro de `begin`/`rollback`. Não use dados ou credenciais reais.

## Validação local e remota

Com Docker ativo:

```sh
npm run supabase:start
npm run supabase:db:reset
npm run supabase:db:test
npm run supabase:db:lint
npm run supabase:db:diff
```

Para investigar uma falha, identifique primeiro papel PostgreSQL, JWT/AAL, associação e grants efetivos; depois inspecione `pg_policies`, ACL da função e fixture. Nunca desabilite RLS para diagnosticar.

Antes de uma aplicação remota autorizada, execute apenas:

```sh
npm run supabase:db:push:dry-run
```

Revise o SQL, confirme o projeto vinculado e só aplique após autorização explícita. CRM, financeiro e futuras tabelas deverão repetir esta matriz; suas permissões e políticas serão definidas quando os fluxos existirem.
