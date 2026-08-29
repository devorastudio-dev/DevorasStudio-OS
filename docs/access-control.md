# Papéis e permissões

O Devora OS usa papéis por organização e permissões explícitas consultadas no estado atual do banco. Não há papel em JWT, e-mail ou metadado do navegador. Toda permissão efetiva exige vínculo `active` e sessão AAL2.

## Modelo

- `permissions`: catálogo global de capacidades;
- `roles`: papéis pertencentes a uma organização;
- `role_permissions`: matriz entre papel e capacidade;
- `organization_member_roles`: atribuições entre vínculo e papel, com integridade de mesma organização.

Os quatro papéis iniciais são de sistema. A interface atual permite atribuí-los e removê-los, mas não renomeá-los, apagá-los ou editar livremente o catálogo.

## Matriz inicial

| Permissão                            | Administrador | Sócio | Colaborador | Financeiro |
| ------------------------------------ | :-----------: | :---: | :---------: | :--------: |
| `organization.read`                  |       ✓       |   ✓   |      ✓      |     ✓      |
| `organization.update`                |       ✓       |       |             |            |
| `members.read`                       |       ✓       |   ✓   |      ✓      |            |
| `members.invite`                     |       ✓       |   ✓   |             |            |
| `members.manage`                     |       ✓       |       |             |            |
| `roles.read`                         |       ✓       |   ✓   |             |            |
| `roles.manage`                       |       ✓       |       |             |            |
| `crm.read`, `crm.write`              |       ✓       |   ✓   |      ✓      |            |
| `clients.read`                       |       ✓       |   ✓   |      ✓      |     ✓      |
| `clients.write`                      |       ✓       |   ✓   |      ✓      |            |
| `proposals.read`, `proposals.create` |       ✓       |   ✓   |      ✓      |            |
| `proposals.approve`                  |       ✓       |   ✓   |             |            |
| `projects.read`, `projects.write`    |       ✓       |   ✓   |      ✓      |            |
| `financial.read`, `financial.write`  |       ✓       |   ✓   |             |     ✓      |
| `products.read`                      |       ✓       |   ✓   |      ✓      |            |
| `products.write`                     |       ✓       |   ✓   |             |            |
| `audit.read`                         |       ✓       |       |             |            |

Permissões de módulos futuros existem para estabilizar o contrato, mas ainda não criam tabelas, rotas ou acesso funcional. Regras por registro atribuído serão definidas junto de cada módulo; não são simuladas nesta fase.

## Significado das capacidades

- `organization.*`: leitura ou alteração das configurações organizacionais;
- `members.read`, `members.invite`, `members.manage`: consulta, convite e administração de vínculos;
- `roles.read`, `roles.manage`: consulta da matriz e atribuição/remoção de papéis;
- `crm.*`, `clients.*`, `projects.*`, `financial.*`, `products.*`: capacidades reservadas aos módulos correspondentes;
- `proposals.read`, `proposals.create`, `proposals.approve`: separação entre consulta, criação e aprovação;
- `audit.read`: consulta da auditoria futura.

## Bootstrap do primeiro Administrador

A migração cria a matriz, mas não promove membros. Um membro ativo sem papel não recebe acesso privilegiado e verá o estado seguro de acesso indisponível.

Em uma máquina administrativa com `SUPABASE_SECRET_KEY` somente no `.env.local`:

```sh
npm run auth:roles -- bootstrap \
  --organization-id <organization-uuid> \
  --user-id <user-uuid> \
  --confirm BOOTSTRAP
```

A operação é idempotente e falha se a organização já possuir Administrador. Confirme os UUIDs por canal autorizado; não use e-mail como identidade de autorização.

## Operações administrativas

```sh
# Listar identificadores e status mínimos
npm run auth:roles -- list --organization-id <organization-uuid>

# Atribuir
npm run auth:roles -- assign --organization-id <organization-uuid> \
  --user-id <user-uuid> --role colaborador --confirm APPLY

# Consultar matriz efetiva
npm run auth:roles -- effective --organization-id <organization-uuid> \
  --user-id <user-uuid>

# Remover
npm run auth:roles -- remove --organization-id <organization-uuid> \
  --user-id <user-uuid> --role colaborador --confirm APPLY
```

Papéis aceitos: `administrador`, `socio`, `colaborador` e `financeiro`. A página `/admin/members` oferece atribuição mínima a operadores com `roles.read` e `roles.manage`; autoalteração é bloqueada.

## Proteções

- `has_permission` e `has_role` consultam o banco, vínculo ativo e AAL2;
- funções `security definer` possuem `search_path` vazio e grants mínimos;
- RLS não permite leitura anônima ou escrita direta pelo navegador;
- constraints compostas impedem atribuições entre organizações;
- RPCs rejeitam autoalteração e revalidam a permissão a cada ação;
- membro convidado ou suspenso não possui permissão efetiva;
- o último Administrador ativo não pode perder o papel nem ser suspenso;
- alterações de papel não reduzem o AAL da sessão, e consultas seguintes usam o estado novo do banco.

MFA continua obrigatório para todos os membros ativos. Uma política diferente por papel poderá ser discutida futuramente, mas Administrador, Sócio e ações de acesso sempre deverão permanecer em AAL2.

## Suspensão e recuperação

Antes de suspender alguém, confirme que existe outro Administrador ativo e teste seu acesso AAL2. Depois da suspensão, revogue as sessões do usuário por ferramenta administrativa autorizada. Não tente remover proteções por SQL improvisado.

Se a organização ficar sem papel por uma migração incompleta, use o bootstrap autorizado. Não adicione políticas temporárias permissivas e não promova todos os membros.

## Limitações atuais

- não há CRUD de papéis personalizados;
- não há convite pela interface;
- não há auditoria persistente das mudanças;
- permissões dos módulos futuros ainda não são consumidas por módulos inexistentes;
- regras de acesso por registro serão implementadas com CRM, clientes e projetos.
