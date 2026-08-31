# Conversão em cliente e dashboard comercial

## Conceitos e fluxo

Cliente representa uma relação comercial confirmada; empresa e contato continuam sendo cadastros de referência. A conversão não copia nome, e-mail, telefone, CNPJ ou mensagem. Ela reutiliza empresa, contato principal, lead, responsável e oportunidade existentes.

Somente uma oportunidade na categoria won pode ser convertida. A ação é explícita no detalhe da oportunidade, exige crm.write e executa a RPC transacional convert_won_opportunity_to_client. Não há trigger de conversão automática. Repetir a mesma solicitação retorna o vínculo existente, sem duplicar cliente, histórico ou oportunidade.

Quando a empresa já possui cliente ativo, a oportunidade é ligada ao cliente existente. Sem empresa, o mesmo ocorre para um contato principal já associado a um cliente pessoa física. O lead de origem passa para converted, mas permanece armazenado com seu histórico. Uma oportunidade pertence a no máximo um cliente; um cliente pode acumular várias oportunidades em client_opportunities.

## Modelo e integridade

- clients: tenant, referências comerciais, estado, data da conversão, responsável, autoria e versão;
- client_opportunities: vínculo entre cliente e oportunidades;
- FKs compostas bloqueiam relações entre organizações;
- índices únicos parciais evitam clientes ativos duplicados pela mesma empresa ou contato;
- o lock transacional serializa conversões concorrentes da mesma relação;
- não há CNPJ obrigatório nem PII duplicada;
- não há exclusão física ou promoção de usuário.

## Rotas

- /crm: painel agregado, com períodos validados de 7, 30 e 90 dias;
- /crm/clients: busca por empresa, contato ou lead, filtros e paginação;
- /crm/clients/[id]: origem, responsável, oportunidades, atividades e tarefas;
- /crm/opportunities/[id]: conversão explícita após ganho.

## Indicadores

get_crm_dashboard calcula os dados no PostgreSQL, sem carregar listas arbitrárias no Next.js. O painel mostra leads ativos, oportunidades abertas, valor do pipeline aberto, ganhos, perdas, clientes convertidos, tarefas vencidas/hoje, entidades sem próxima ação, distribuição por etapa e motivos de perda.

Indicadores de estoque usam o estado atual. Ganhos, perdas e clientes convertidos respeitam o período escolhido. A taxa exibida é clientes convertidos no período dividido por oportunidades encerradas no período, multiplicado por 100. Quando não existem oportunidades encerradas, a taxa é zero. Datas operacionais de hoje usam America/Sao_Paulo; o banco continua armazenando timestamptz.

## Segurança e auditoria

Leitura exige associação ativa, sessão AAL2, tenant correto e crm.read. Conversão exige também crm.write. Anônimos, AAL1, convidados, suspensos e membros sem capacidade falham fechados. Tabelas concedem somente SELECT ao papel autenticado; toda escrita de conversão passa pela RPC security definer com search_path vazio.

A auditoria registra crm.client.created e crm.opportunity.converted com metadados técnicos mínimos. Não registra PII, valores comerciais, mensagens ou payloads. A conversão não concede papéis nem altera permissões.

## Validação e rollout

Com Docker e Supabase local disponíveis:

    npm run supabase:start
    npm run supabase:db:reset
    npm run supabase:db:test
    npm run supabase:db:lint
    npm run supabase:db:diff
    npm run supabase:types
    npm run format:check
    npm run lint
    npm run typecheck
    npm test
    npm run build

O teste crm_clients_dashboard.test.sql usa somente UUIDs sintéticos e endereços example.invalid. Ele cobre permissões, AAL2, conversão apenas de ganho, idempotência, reaproveitamento das relações, atualização do lead, indicadores e negação de DML direto.

Antes de publicar, revise o dry-run remoto e solicite aprovação explícita. A migração cria tabelas, índices, funções, policies e o valor converted do enum; não apaga registros existentes e não promove usuários. Não execute db push, push Git ou deploy como parte da implementação local.

## Diagnóstico

- conversão indisponível: confirme que a etapa atual é won;
- operação negada: confirme AAL2, associação ativa, tenant e crm.write;
- painel indisponível: confirme que a migração e get_crm_dashboard estão presentes;
- lista vazia: revise filtros e crm.read;
- conflito em conversão: recarregue a oportunidade; outra requisição pode ter concluído o vínculo;
- tipos divergentes: faça reset local e execute npm run supabase:types.

Esta etapa não inclui propostas, contratos, projetos, automações, financeiro, produtos SaaS ou integrações externas.
