# Pipeline comercial e oportunidades

## Escopo da C3

O pipeline transforma um lead do CRM em uma oportunidade comercial e acompanha sua evolução até ganho, perda ou reabertura. Ele não implementa atividades, propostas, contratos, projetos ou financeiro. A etapa `Proposta` representa apenas um estado do funil; não cria uma proposta formal.

## Modelo de dados

- `pipeline_stages`: etapas ordenadas por organização, com categoria `open`, `won` ou `lost`;
- `opportunities`: oportunidade vinculada ao tenant e, quando convertida, ao lead, empresa e contato de origem;
- `opportunity_stage_history`: histórico append-only de criação e movimentações.

Cada organização recebe oito etapas iniciais: Novo, Contato iniciado, Qualificado, Reunião agendada, Proposta, Negociação, Ganho e Perdido. A personalização do funil não faz parte desta entrega.

Existe no máximo uma oportunidade por lead de origem. Repetir a conversão retorna a oportunidade existente, sem duplicar o registro ou o histórico. Valores estimados usam `numeric(14,2)` e não são usados para reconhecimento financeiro.

## Acesso e segurança

- `crm.read`, vínculo ativo e sessão AAL2 permitem consultar etapas, oportunidades e histórico;
- `crm.write`, vínculo ativo e sessão AAL2 permitem converter, atualizar, atribuir, arquivar e mover oportunidades pelas RPCs;
- `anon` não possui acesso;
- clientes autenticados não recebem escrita direta nas três tabelas;
- tenant, etapa, lead e responsável são validados novamente no banco;
- o histórico não pode ser alterado ou removido pelo cliente;
- toda mutação usa controle otimista de versão e grava auditoria na mesma transação.

As RPCs públicas são `create_opportunity_from_lead`, `move_opportunity` e `update_opportunity`. Elas derivam a organização da sessão; o navegador não escolhe o tenant.

## Operação

1. Abra `/crm/leads/<id>` e converta um lead ainda não arquivado.
2. Consulte `/crm/pipeline` para filtrar o quadro por etapa, estado ou responsável.
3. Abra uma oportunidade para editar título, valor e responsável ou arquivá-la.
4. Use o formulário de movimentação para trocar a etapa. Uma perda exige motivo; `Outro` exige complemento.
5. Uma oportunidade fechada pode voltar para etapa aberta; o evento é registrado como reabertura.

A interface usa formulários acessíveis como alternativa completa a drag-and-drop. Os cards não dependem de arrastar para serem movimentados.

## Migração, testes e tipos

A fonte da verdade é `supabase/migrations/20260830193000_commercial_pipeline.sql`. Para validar localmente:

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

Os testes pgTAP cobrem isolamento por tenant, AAL, permissões de leitura/escrita, idempotência, movimentação, perda, reabertura, atribuição, histórico e `search_path` seguro.

## Aplicação remota

Antes de produção, confirme o projeto Supabase vinculado e um backup/PITR compatível com o ambiente. Faça apenas a revisão primeiro:

```sh
npm run supabase:db:push:dry-run
```

Depois de aprovação explícita, aplique a migração pelo procedimento operacional do repositório. Em seguida, gere os tipos do alvo correto, publique o dashboard e faça smoke test com contas fictícias que representem `crm.read`, `crm.write` e ausência de permissão. Não execute reset no banco remoto.

## Auditoria e limitações

São catalogados eventos de criação, atualização, atribuição, mudança de etapa, ganho, perda, reabertura e arquivamento. Metadados guardam somente identificadores e estados técnicos; nomes, mensagens e outros dados pessoais não são copiados para a auditoria.

Limitações deliberadas da C3:

- etapas não são personalizáveis pela interface;
- não há drag-and-drop;
- o quadro mostra as 200 oportunidades atualizadas mais recentemente;
- não há probabilidade, forecast ou moeda configurável;
- não há módulo de propostas nem automações de atividades;
- papéis continuam usando as capacidades existentes `crm.read` e `crm.write`.
