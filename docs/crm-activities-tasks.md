# Atividades, tarefas e próxima ação do CRM

## Conceitos

Uma **atividade** registra uma interação que já aconteceu. Os tipos estáveis são `call`, `whatsapp`, `email`, `meeting`, `instagram`, `note` e `other`; os canais são apenas registros manuais e não enviam mensagens. Uma **tarefa** representa uma ação futura e possui prazo e responsável obrigatórios.

A próxima ação não é duplicada em outra tabela: ela é a tarefa `pending` com menor `due_at` relacionada ao lead ou à oportunidade. Tarefas `completed` e `cancelled` deixam de ser consideradas imediatamente. Leads ativos não arquivados e oportunidades abertas sem tarefa pendente aparecem como alertas operacionais, não como erro do sistema.

## Modelo e integridade

- `crm_activities`: resumo, descrição opcional, tipo, ocorrência, responsável e vínculo obrigatório com lead ou oportunidade;
- `crm_tasks`: título, descrição opcional, prazo, responsável, status, conclusão/cancelamento, versão e vínculos comerciais;
- status de tarefa: `pending`, `completed` e `cancelled`;
- FKs compostas impedem relações entre tenants;
- contato e empresa, quando informados juntos, precisam ser coerentes;
- oportunidade precisa ser coerente com lead, empresa e contato informados;
- não há exclusão física nem criação automática para registros existentes.

Atividades podem ser registradas nos detalhes de lead e oportunidade. Tarefas podem ser criadas nos detalhes de lead, oportunidade, empresa e contato. Reabertura é explícita e limpa os dados de conclusão/cancelamento.

## Datas e vencimentos

O banco armazena `timestamptz` em UTC. Entradas `datetime-local` são interpretadas no fuso operacional `America/Sao_Paulo`, e a interface formata todas as datas nesse fuso. Classificação de vencida, hoje ou futura é calculada no servidor; regras críticas não dependem do relógio do navegador.

## Rotas e interface

- `/crm/tasks`: lista paginada, indicadores e filtros por status, vencimento e responsável;
- `/crm/leads/[id]`: atividade, tarefas, próxima ação e timeline limitada;
- `/crm/opportunities/[id]`: atividade, tarefas e histórico real do pipeline;
- `/crm/companies/[id]` e `/crm/contacts/[id]`: criação e acompanhamento de tarefas.

Cada timeline busca no máximo 20 atividades e 20 tarefas. A lista geral pagina 20 tarefas. Formulários possuem labels, campos nativos de data/hora, feedback pelo status da Server Action e botões explícitos para concluir, cancelar ou reabrir. Não há drag-and-drop, calendário, notificações ou integrações externas.

## Segurança, RLS e auditoria

Leitura exige vínculo `active`, AAL2, tenant correto e `crm.read`. Escritas exigem também `crm.write` e passam exclusivamente pelas RPCs `create_crm_activity`, `create_crm_task` e `transition_crm_task`; clientes autenticados não recebem DML direto. `anon`, AAL1, convidados, suspensos e membros sem permissão falham fechados.

Auditoria registra somente ação, entidade, ator e metadata técnica mínima. Título, descrição, e-mail, telefone, mensagem e payload não entram em `audit_logs`. A timeline comercial usa entidades do domínio e não reutiliza logs técnicos.

## Validação local

```sh
npm run supabase:db:reset
npm run supabase:db:lint
npm run supabase:db:test
npm run supabase:db:diff
npm run supabase:types
npm run lint --workspace @devora/dashboard
npm run typecheck --workspace @devora/dashboard
npm test --workspace @devora/dashboard
npm run build --workspace @devora/dashboard
```

Os testes usam somente UUIDs e endereços `example.invalid`. Para diagnóstico, confirme primeiro sessão AAL2, vínculo, capacidades, tenant das entidades e versão da tarefa. Não registre payloads comerciais ao investigar falhas.

## Limitações

- não há edição do conteúdo de atividade;
- tarefa pode ser criada e ter seu estado alterado, mas edição de título/prazo fica para refinamento posterior;
- indicadores “sem próxima ação” consideram até 1.000 registros por consulta nesta primeira operação;
- filtros de entidade são oferecidos pelos detalhes relacionados; a lista geral evita PII em query params;
- não há prioridade, recorrência, automação, cadência, calendário externo ou tarefa de projeto.
