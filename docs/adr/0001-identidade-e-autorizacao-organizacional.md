# ADR 0001: identidade e autorização organizacional

- Status: aceito
- Data: 2026-08-29

## Contexto

Perfis internos precisam acompanhar usuários do Supabase Auth, vínculos precisam ser removidos sem deixar dados órfãos e a política de membros não pode consultar a própria tabela sob RLS recursivamente.

## Decisão

1. `profiles.id` referencia `auth.users.id` com `ON DELETE CASCADE`; `organization_members.user_id` e `organization_members.organization_id` também usam cascata. A exclusão administrativa de uma identidade remove seu perfil e seus vínculos, mas não remove a organização.
2. Um trigger `after insert` em `auth.users` cria o perfil. A função é `security definer` porque precisa atravessar schemas e privilégios, fica no schema não exposto `private`, fixa `search_path` vazio e copia somente `full_name` e `avatar_url`. Falhas nela podem bloquear a criação de usuários e devem ser monitoradas.
3. `private.is_active_organization_member` é uma função `security definer` mínima usada apenas em políticas de leitura. Ela fica fora dos schemas expostos pela Data API, consulta o usuário de `auth.uid()`, não aceita identidade fornecida pelo cliente, usa nomes qualificados e tem execução concedida somente a `authenticated`.

## Consequências

- A remoção de usuário é destrutiva para perfil e vínculos e deve permanecer uma operação administrativa deliberada.
- Criar um usuário não cria organização nem associação automaticamente.
- Membros ativos veem a lista de membros de sua organização, mas somente o próprio perfil completo. A exposição futura de dados de colegas exigirá uma política específica.
- A autorização atual distingue apenas vínculo ativo; papéis e permissões serão modelados na B5 sem coluna de papel provisória.
