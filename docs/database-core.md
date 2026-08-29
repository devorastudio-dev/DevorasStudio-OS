# Núcleo de organizações e usuários

## Modelo

- `auth.users` continua sendo a fonte de autenticação, e `public.profiles` mantém somente dados internos de apresentação. Um trigger cria o perfil com o mesmo UUID, copiando apenas `full_name` e `avatar_url` quando existirem.
- `public.organizations` representa uma organização interna. Nesta fase, a organização não possui configurações comerciais, financeiras ou papéis.
- `public.organization_members` liga um perfil a uma organização. O vínculo pode estar `invited`, `active` ou `suspended`; somente `active` concede leitura da organização e de seus membros.

Excluir um usuário de `auth.users` remove seu perfil e seus vínculos por `ON DELETE CASCADE`. Excluir uma organização remove seus vínculos. As razões e os limites dessas decisões estão registrados em [`adr/0001-identidade-e-autorizacao-organizacional.md`](adr/0001-identidade-e-autorizacao-organizacional.md).

## RLS e privilégios

As três tabelas têm RLS habilitada e não possuem políticas permissivas para `anon`.

- Um usuário autenticado lê somente o próprio perfil e atualiza apenas `full_name` e `avatar_url`.
- Um membro ativo lê somente a organização da qual participa.
- Um membro ativo lê os vínculos de sua organização; membros convidados ou suspensos não recebem esse acesso.
- Clientes públicos não podem inserir, alterar ou remover organizações ou vínculos.

A função `private.is_active_organization_member` é `security definer` para consultar vínculos sem recursão de RLS. Ela fica fora dos schemas expostos pela Data API, usa `search_path` vazio, nomes qualificados e só pode ser executada pelo papel `authenticated`. Essa função não concede escrita nem aceita um usuário informado pelo navegador.

Papéis e permissões explícitas complementam essa regra: vínculo ativo e AAL2 continuam obrigatórios, e cada operação exige sua capacidade no banco.

## Bootstrap seguro

Não há seed nem organização real na migração. Depois que o primeiro usuário for criado por um fluxo administrativo confiável, uma pessoa com acesso administrativo ao banco poderá executar uma transação como esta, substituindo os placeholders localmente:

```sql
begin;

insert into public.organizations (name, slug)
values ('Devora Studio', 'devora-studio')
returning id;

insert into public.organization_members (organization_id, user_id, status)
values ('<organization-id>'::uuid, '<auth-user-id>'::uuid, 'active');

commit;
```

Esse SQL não deve ser executado pelo navegador nem receber uma chave administrativa no dashboard. O fluxo definitivo de criação do usuário e associação ficará para a B3. Não existe política temporária de autoinscrição.

## Migrações, testes e tipos

Com o Docker ativo, execute na raiz:

```sh
npm run supabase:db:reset
npm run supabase:db:lint
npm run supabase:db:test
npm run supabase:db:diff
npm run supabase:types
```

O reset recria somente o banco local e aplica todas as migrações desde o zero. Os testes pgTAP usam dados claramente fictícios dentro de uma transação revertida ao final. Após gerar os tipos, execute o Prettier no arquivo gerado e valide o monorepo.

Para o projeto remoto já vinculado, primeiro revise sem alterar o banco:

```sh
npm run supabase:db:push:dry-run
```

Somente depois de aprovação explícita aplique:

```sh
npm run supabase:db:push
```
