# CRM base

## Modelo

A C2 amplia `public.leads`, criado na C1, e adiciona `public.crm_companies` e `public.crm_contacts`. `public.organizations` continua representando o tenant de autenticação; uma empresa do CRM é uma entidade comercial e nunca substitui a organização do Devora OS.

Leads preservam origem, consentimento, mensagem e UTMs da landing. A gestão interna acrescenta triagem (`new`, `in_review`, `qualified`, `disqualified`), responsável, empresa, contato, motivo de desqualificação, arquivamento e versão para detectar concorrência. Esses estados não são pipeline e não representam conversão em cliente.

As origens permitidas são `website`, `99freelas`, `instagram`, `pinterest`, `tiktok`, `whatsapp`, `google_maps`, `referral`, `outbound` e `other`. `other` exige descrição curta. Valores da C1 permanecem intactos.

## Integridade e acesso

Todas as entidades possuem `organization_id`. Triggers derivam tenant e autor da sessão em escritas autenticadas, normalizam e-mails e timestamps e impedem troca de tenant. FKs compostas impedem vínculos cross-tenant. Responsável precisa ser membro `active`; ao suspender o vínculo, as atribuições existentes são removidas para que deixem de ser efetivas. Contato e empresa precisam ser compatíveis. Existe no máximo um contato principal ativo por empresa.

RLS exige membro ativo, AAL2 e mesma organização. `crm.read` concede somente consulta; `crm.write` concede criação e alteração. Nenhuma tabela concede `DELETE` ao navegador. Arquivar preserva histórico. Na matriz atual, Administrador, Sócio e Colaborador possuem leitura e escrita; Financeiro não possui CRM.

Eventos de criação e alteração são gravados atomicamente em `audit_logs`. A metadata limita-se a IDs implícitos na entidade, mudança de triagem e presença de responsável. Mensagem, nome, e-mail, telefone, notas e UTMs não entram na auditoria.

## Interface e operação

- `/crm`: indicadores reais e atalhos;
- `/crm/leads` e `/crm/leads/[id]`: busca, filtros, paginação e triagem;
- `/crm/leads/new`: cadastro manual autenticado;
- `/crm/companies` e `/crm/companies/[id]`: empresas, vínculos e arquivamento;
- `/crm/contacts` e `/crm/contacts/[id]`: contatos, empresa opcional e arquivamento.

Listas consultam no máximo 20 registros por página no servidor. Filtros ficam na URL, mas nenhum dado pessoal é colocado nela. Falhas retornam mensagens genéricas; logs da aplicação não devem receber payloads comerciais.

Para validar localmente, inicie o Docker Desktop e execute:

```sh
npm run supabase:start
npm run supabase:db:reset
npm run supabase:db:test
npm run supabase:db:lint
npm run supabase:db:diff
npm run supabase:types
npm run test --workspace @devora/dashboard
```

Use somente dados `example.invalid`. Teste um papel autorizado, um leitor sem escrita, AAL1, convidado, suspenso e dois tenants. Antes de operação remota, revise o dry-run e obtenha autorização explícita.

## Limitações

Não existem pipeline, atividades, Kanban, conversão em cliente, propostas, projetos, financeiro, exportação ou exclusão definitiva. Possíveis duplicatas são apenas indicadas por busca; não há mesclagem automática. Retenção e eliminação definitiva dependem de decisão jurídica e operacional futura.
