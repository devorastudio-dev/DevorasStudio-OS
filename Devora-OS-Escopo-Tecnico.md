# Devora OS — Escopo funcional e técnico

**Status:** planejamento inicial  
**Responsáveis:** fundadores da Devora Studio  
**Tipo de produto:** plataforma operacional interna da agência  
**Estratégia:** desenvolvimento incremental, priorizando uso real rapidamente  
**Nome provisório:** Devora OS

---

## 1. Resumo executivo

O Devora OS será a plataforma operacional da Devora Studio. O sistema reunirá captação de leads, CRM, propostas, contratos, projetos, planos de manutenção, financeiro e indicadores dos produtos SaaS pertencentes à Devora.

A plataforma terá duas superfícies inicialmente:

1. uma landing page pública da Devora Studio, que apresentará serviços e receberá contatos de potenciais clientes;
2. um painel interno privado, protegido por autenticação, MFA, papéis, permissões, Row Level Security (RLS) e auditoria.

A VIZEX não fará parte do Devora OS. Ela é uma marca e operação de ecommerce separada, com infraestrutura, dados, usuários e gestão próprios.

O sistema deverá aceitar leads cadastrados manualmente e leads originados pelo formulário da landing page. A arquitetura ficará preparada para integrações e automações futuras de captação, sem implementar robôs de prospecção no MVP.

O Devora OS começará como ferramenta interna de uma única organização. O modelo de dados terá `organization_id` nas entidades de negócio relevantes para não impedir uma transformação futura em SaaS, mas não será construído um multitenancy comercial completo agora.

---

## 2. Objetivos do produto

### 2.1 Objetivos imediatos

- Substituir controles dispersos e informações mantidas apenas pelos sócios.
- Permitir que a Devora inicie prospecção ativa com acompanhamento organizado.
- Receber automaticamente contatos enviados pela landing page.
- Registrar a origem e o histórico de cada lead.
- Evitar perda de oportunidades por falta de acompanhamento.
- Transformar leads ganhos em clientes sem recadastrar dados.
- Gerar propostas padronizadas, timbradas e exportáveis em PDF.
- Preparar a geração de contratos a partir de propostas aceitas.
- Registrar receitas, despesas e compromissos recorrentes.
- Acompanhar projetos, manutenção e produtos SaaS da Devora.

### 2.2 Objetivos de médio prazo

- Automatizar partes da captação e qualificação de leads.
- Integrar e-mails e WhatsApp de forma controlada.
- Consolidar indicadores executivos dos SaaS da Devora.
- Criar um portal do cliente para documentos, aprovações e acompanhamento.
- Integrar provedores de assinatura eletrônica quando houver justificativa financeira.

### 2.3 Não objetivos do MVP

- Construir um ERP contábil completo.
- Emitir documentos fiscais diretamente pelo sistema.
- Fazer escrituração fiscal ou contábil.
- Criar automação de scraping de Google Maps ou redes sociais.
- Realizar disparos de prospecção em massa.
- Integrar diretamente a API de assinatura Gov.br.
- Construir portal do cliente.
- Criar aplicativo móvel nativo.
- Implementar multitenancy comercial completo.
- Integrar todos os SaaS já na primeira versão.

---

## 3. Perfis de acesso

### 3.1 Papéis iniciais

#### Administrador

- Configura organização, usuários, permissões e modelos.
- Acessa todos os módulos.
- Visualiza e administra dados financeiros.
- Gerencia assinaturas visuais, documentos e integrações.
- Consulta auditoria.

#### Sócio

- Acessa CRM, comercial, projetos, produtos e financeiro.
- Cria e aprova propostas e contratos.
- Visualiza indicadores executivos.
- Não altera configurações críticas sem permissão específica.

#### Colaborador

- Acessa apenas leads, clientes e projetos atribuídos ou autorizados.
- Pode registrar atividades e atualizar tarefas.
- Não acessa financeiro global por padrão.
- Não administra usuários ou integrações.

#### Financeiro

- Acessa receitas, despesas, recorrências e anexos financeiros.
- Não acessa configurações administrativas ou segredos de integração.

### 3.2 Regras

- Nenhuma conta interna poderá ser criada livremente pela tela pública.
- Usuários internos serão convidados por administrador.
- MFA será obrigatório para administradores e sócios; recomendado para todos.
- A autorização deverá ser verificada no servidor e no banco, não apenas escondida na interface.
- Permissões críticas deverão ser explícitas, como `financial.read`, `proposal.approve` e `users.manage`.

---

## 4. Arquitetura de aplicações

### 4.1 Estrutura recomendada

```text
devora-os/
├── apps/
│   ├── marketing/          # landing page pública
│   └── dashboard/          # aplicação interna autenticada
├── packages/
│   ├── ui/                 # componentes compartilhados realmente reutilizados
│   ├── config/             # configurações compartilhadas
│   └── contracts/          # tipos/esquemas de integração quando necessários
├── supabase/
│   ├── migrations/         # schema, funções, triggers e políticas RLS
│   ├── seed.sql            # dados mínimos de desenvolvimento
│   └── tests/              # testes de banco e políticas
├── docs/
│   ├── adr/                # decisões de arquitetura
│   ├── product/            # regras e fluxos
│   └── security/           # modelo de ameaças e procedimentos
└── .github/workflows/      # CI
```

Não criar pacotes adicionais até existir reutilização real. Domínios podem começar organizados dentro de `apps/dashboard/src/features` e ser extraídos somente quando necessário.

### 4.2 Domínios sugeridos

- Landing pública: `devorastudio.com.br`
- Painel interno: `app.devorastudio.com.br`
- Portal do cliente futuro: `clientes.devorastudio.com.br`

Landing e painel podem ser implantados separadamente, embora permaneçam no mesmo monorepo.

---

## 5. Tecnologias recomendadas

### 5.1 Base

| Área | Tecnologia | Motivo |
|---|---|---|
| Monorepo | Turborepo + npm Workspaces | Reaproveitar experiência existente e separar aplicações |
| Frontend/full-stack | Next.js App Router | Server Components, rotas, formulários e APIs no mesmo ecossistema |
| Linguagem | TypeScript em modo estrito | Segurança de tipos e melhor assistência pelo Codex |
| Interface | React + Tailwind CSS | Velocidade e consistência |
| Componentes | shadcn/ui ou Radix Primitives com componentes próprios | Acessibilidade e rapidez sem prender o design |
| Validação | Zod | Mesmo contrato de validação no formulário, servidor e integrações |
| Formulários | React Hook Form quando a interação exigir estado complexo | Evitar código manual repetitivo |
| Banco | PostgreSQL gerenciado pelo Supabase | Banco relacional, RLS, Auth e Storage integrados |
| Autenticação | Supabase Auth | MFA, sessões e integração com RLS |
| Arquivos | Supabase Storage em buckets privados | Propostas, contratos, comprovantes e demonstrações |
| PDF | `@react-pdf/renderer` | Geração determinística no servidor sem navegador headless |
| Deploy | Vercel para as aplicações + Supabase para dados | Entrega rápida e infraestrutura gerenciada |
| Testes unitários | Vitest | Regras de domínio e utilitários |
| Testes de interface | React Testing Library | Comportamentos críticos de componentes |
| Testes end-to-end | Playwright | Fluxos reais de login, lead, proposta e financeiro |
| Qualidade | ESLint + Prettier + TypeScript | Padronização e falhas antecipadas |
| CI | GitHub Actions | Verificação automática em pull requests |
| Monitoramento | Sentry ou alternativa equivalente, após o fluxo principal | Erros de frontend e servidor |

### 5.2 Decisão sobre ORM

Para o MVP, usar Supabase SDK, SQL versionado e tipos gerados pelo Supabase. Não adicionar Prisma inicialmente.

Justificativa: o requisito de RLS é central. Usar o token autenticado do usuário com o cliente Supabase torna as políticas do PostgreSQL parte efetiva do controle de acesso. Uma conexão administrativa de ORM pode contornar RLS se for usada indevidamente. Se no futuro houver rotinas complexas exclusivamente server-side, a adoção de um query builder poderá ser registrada em ADR.

### 5.3 Diretrizes de versões

- Usar versões estáveis e fixadas no lockfile.
- Não copiar números de versão deste documento; confirmar a versão estável no momento da instalação.
- Fazer atualizações em lotes pequenos e com testes.
- Não habilitar recursos experimentais sem uma ADR.

---

## 6. Módulo Landing Page

### 6.1 Funcionalidades públicas

- Página inicial.
- Apresentação da Devora Studio.
- Serviços oferecidos.
- Processo de trabalho.
- Portfólio/cases cadastráveis futuramente.
- Planos de manutenção, quando definidos comercialmente.
- Perguntas frequentes.
- CTA para orçamento.
- Formulário de contato.
- Links para redes sociais e WhatsApp.
- Política de privacidade.
- Termos de uso, se aplicável.
- Se possível, manter o design semelhante ao da landing page atual que está no repositorio: https://github.com/devorastudio-dev/Portifolio

### 6.2 Formulário de lead

Campos mínimos:

- Nome do contato.
- Empresa ou negócio.
- E-mail.
- Telefone/WhatsApp.
- Serviço de interesse.
- Mensagem/necessidade.
- Como conheceu a Devora.
- Aceite da política de privacidade.

Campos automáticos:

- URL de entrada.
- Referrer.
- `utm_source`.
- `utm_medium`.
- `utm_campaign`.
- `utm_content`.
- `utm_term`.
- Data e hora.
- Identificador técnico antifraude minimizado.

### 6.3 Proteções do formulário

- Validação no servidor.
- Rate limiting por origem e janela de tempo.
- CAPTCHA/Turnstile ou mecanismo equivalente quando necessário.
- Honeypot invisível.
- Limite de tamanho em todos os campos.
- Sanitização de conteúdo exibido.
- Respostas genéricas que não revelem dados internos.
- Idempotência para evitar submissões repetidas.
- Registro de eventos de abuso sem armazenar dados excessivos.

### 6.4 Processamento

1. Usuário envia formulário.
2. Servidor valida os dados.
3. Proteções contra spam são verificadas.
4. Sistema procura duplicidade por e-mail e telefone normalizados.
5. Um novo lead é criado ou uma nova interação é anexada ao existente.
6. A origem e a atribuição são registradas.
7. O painel mostra uma notificação interna.
8. Opcionalmente, é enviado e-mail transacional de confirmação.

O navegador público nunca receberá credenciais administrativas nem escreverá diretamente em tabelas internas.

---

## 7. Módulo de captação e CRM

### 7.1 Cadastro manual

- Criar lead individualmente.
- Salvar rascunho.
- Editar dados.
- Registrar empresa, contatos e canais.
- Adicionar notas e tags.
- Informar origem manual.
- Vincular responsável.
- Registrar consentimentos ou oposição de contato quando aplicável.

### 7.2 Preparação para automação futura

Criar uma interface lógica única chamada `LeadIngestionService`. Ela deverá receber dados de:

- formulário público;
- cadastro manual;
- importação CSV futura;
- webhooks futuros;
- conectores de captação futuros.

Todas as entradas deverão produzir um registro de ingestão com:

- provedor/origem;
- identificador externo, quando houver;
- payload normalizado;
- hash de idempotência;
- data de processamento;
- resultado;
- motivo de rejeição;
- lead criado ou atualizado.

Não armazenar indefinidamente payloads brutos contendo dados pessoais. Definir retenção e mascaramento.

### 7.3 Empresa e contato

Uma empresa poderá possuir vários contatos. Um contato poderá ter cargo, e-mail, telefone e canais preferenciais.

Dados da empresa:

- Nome fantasia.
- Razão social, quando disponível.
- CPF/CNPJ, opcional conforme tipo.
- Segmento.
- Porte aproximado.
- Cidade/estado.
- Endereço.
- Website.
- Google Maps.
- Instagram, TikTok, Pinterest, LinkedIn e outros.
- Diagnóstico de presença digital.
- Observações.

### 7.4 Origem e atribuição

Entidades configuráveis:

- `LeadSource`: Instagram, TikTok, Pinterest, WhatsApp, Google Maps, Google, indicação, 99Freelas, landing page, prospecção ativa, evento e outros.
- `LeadMedium`: social orgânico, social pago, referência, pesquisa, mensagem, formulário e outbound.
- `Campaign`: campanha opcional.

Registrar:

- primeira origem conhecida (`first_touch`);
- última origem antes da conversão (`last_touch`);
- origem declarada pelo cliente;
- origem observada automaticamente;
- nível de confiança da atribuição;
- UTMs e referrer.

### 7.5 Pipeline

Etapas iniciais configuráveis:

1. Lead identificado.
2. Em pesquisa.
3. Pronto para contato.
4. Primeiro contato realizado.
5. Respondeu.
6. Reunião agendada.
7. Proposta em elaboração.
8. Proposta enviada.
9. Negociação.
10. Ganho.
11. Perdido.

Cada mudança deve registrar usuário, data, etapa anterior e etapa nova.

### 7.6 Atividades

- Nota.
- E-mail registrado manualmente.
- Mensagem de WhatsApp.
- Ligação.
- Reunião.
- Tarefa.
- Alteração de etapa.
- Proposta enviada.
- Arquivo anexado.

Toda oportunidade aberta deve possuir uma próxima ação opcionalmente obrigatória, com responsável e prazo.

### 7.7 Ganho, perda e conversão

- Lead ganho poderá ser convertido em cliente.
- Conversão reutilizará empresa e contatos.
- Motivos de perda serão configuráveis.
- Não apagar oportunidades perdidas.
- Permitir reabertura com histórico.
- Calcular tempo em cada etapa e tempo até conversão.

---

## 8. Módulo de clientes

- Cadastro de pessoa física ou jurídica.
- CPF ou CNPJ conforme tipo.
- Múltiplos contatos.
- Endereços.
- Dados de cobrança.
- Projetos vinculados.
- Propostas e contratos vinculados.
- Receitas e inadimplência.
- Planos de manutenção.
- Arquivos privados.
- Histórico completo.
- Status: potencial, ativo, inativo ou bloqueado.

O sistema deve aceitar a própria Devora atuando inicialmente por CPF. A configuração do prestador deverá ser versionada para permitir futura alteração para CNPJ sem modificar documentos históricos.

---

## 9. Propostas e orçamentos

### 9.1 Fluxo

1. Selecionar oportunidade ou cliente.
2. Se não existir, cadastrar cliente no próprio fluxo.
3. Selecionar modelo de proposta.
4. Preencher automaticamente os tokens.
5. Editar seções permitidas.
6. Adicionar itens, valores e condições.
7. Anexar demonstrações opcionais.
8. Visualizar prévia.
9. Gerar versão em PDF.
10. Marcar como enviada.
11. Registrar resposta.
12. Em caso de aceite, gerar contrato ou projeto.

### 9.2 Modelos

O MVP utilizará modelos estruturados por blocos, não um editor de documentos completamente livre.

Blocos permitidos:

- título;
- texto;
- dados do cliente;
- escopo;
- lista de entregáveis;
- cronograma;
- tabela de itens;
- investimento;
- condições de pagamento;
- validade;
- observações;
- assinatura visual do responsável;
- rodapé.

Cada bloco poderá ser obrigatório, opcional, reordenável ou bloqueado.

### 9.3 Tokens

Exemplos:

```text
{{client.name}}
{{client.legal_name}}
{{client.document}}
{{client.address}}
{{contact.name}}
{{proposal.number}}
{{proposal.date}}
{{proposal.valid_until}}
{{proposal.total}}
{{author.name}}
{{author.role}}
{{author.signature}}
{{provider.name}}
{{provider.document}}
```

Não usar reconhecimento por IA como mecanismo primário para descobrir campos. Tokens explícitos são previsíveis, auditáveis e testáveis.

### 9.4 Numeração e estados

- Numeração sequencial por organização e ano, por exemplo `DEV-2026-0001`.
- Estados: rascunho, pronta, enviada, visualizada futuramente, aceita, recusada, expirada e cancelada.
- Somente rascunhos podem ser alterados diretamente.
- Alteração depois do envio gera nova versão.

### 9.5 Versionamento

Ao gerar uma versão:

- criar snapshot imutável dos dados;
- armazenar JSON renderizado;
- gerar PDF;
- calcular hash do PDF;
- registrar autor e data;
- preservar versões anteriores.

### 9.6 Anexos e demonstrações

- Aceitar PDF, imagens e formatos permitidos explicitamente.
- Definir limite por arquivo e por proposta.
- Armazenar em bucket privado.
- Usar URLs assinadas e temporárias.
- Validar extensão, MIME type e tamanho.
- Preparar ponto de integração para verificação antimalware futura.

### 9.7 Assinatura visual

- Cada sócio autorizado poderá cadastrar nome, cargo e imagem de assinatura.
- A imagem ficará em armazenamento privado.
- Apenas usuários autorizados poderão aplicá-la.
- O uso será registrado em auditoria.
- A assinatura visual não será tratada como assinatura eletrônica do contrato.

---

## 10. Contratos

### 10.1 Estratégia

Oferecer dois modelos:

- termo simplificado de prestação de serviços;
- contrato completo para projetos de maior risco ou recorrência.

A proposta aceita poderá compor o contrato como anexo de escopo.

### 10.2 Dados

- Contratante pessoa física ou jurídica.
- Contratada pessoa física inicialmente, com CPF.
- Assistência do responsável legal enquanto uma signatária for menor e não emancipada.
- Representantes e signatários.
- Proposta de origem.
- Projeto e plano de manutenção relacionados.
- Vigência.
- Valor e condições.
- Versões e anexos.

### 10.3 Fluxo inicial de assinatura

1. Gerar contrato em PDF.
2. Baixar o arquivo.
3. Assinar externamente pelo Gov.br ou método aceito pelas partes.
4. Enviar o mesmo arquivo para os demais signatários.
5. Anexar o PDF final ao Devora OS.
6. Calcular hash e bloquear substituição silenciosa.
7. Registrar datas, signatários e status.

O sistema não afirmará ter validado juridicamente uma assinatura. Poderá registrar que o documento foi anexado como assinado e guardar evidências.

### 10.4 Estados

- Rascunho.
- Aguardando assinatura da Devora.
- Aguardando assinatura do cliente.
- Assinado.
- Vigente.
- Encerrado.
- Rescindido.
- Substituído por aditivo.

---

## 11. Projetos

### 11.1 Criação

- Criar manualmente ou a partir de proposta aceita.
- Reutilizar cliente, contatos, escopo, valor e responsáveis.
- Gerar código do projeto.

### 11.2 Informações

- Nome.
- Cliente.
- Tipo de serviço.
- Responsáveis.
- Status.
- Datas prevista e real.
- Escopo contratado.
- Entregáveis.
- Links de repositório e deploy.
- Documentos.
- Valor contratado.
- Custo estimado e realizado.

### 11.3 Etapas e tarefas

- Marcos do projeto.
- Tarefas com responsável e prazo.
- Prioridade.
- Dependências simples.
- Comentários.
- Anexos.
- Checklist.
- Registro de conclusão.

Não tentar competir com Jira, ClickUp ou Linear no MVP. Implementar apenas o necessário para acompanhar projetos pequenos da Devora.

### 11.4 Mudança de escopo

- Registrar solicitação.
- Descrever impacto em prazo e preço.
- Aprovar ou recusar.
- Gerar orçamento complementar quando necessário.
- Manter vínculo com projeto e contrato.

---

## 12. Planos de manutenção recorrente

- Cliente e projeto de origem.
- Nome do plano.
- Serviços incluídos.
- Franquia de horas.
- Valor periódico.
- Periodicidade.
- Vigência e renovação.
- Data de reajuste.
- SLA.
- Horas consumidas.
- Chamados/solicitações.
- Status: proposta, ativo, pausado, cancelado ou encerrado.
- Geração de previsões financeiras recorrentes.

Planos de manutenção pertencem à operação de serviços da agência, não ao catálogo de SaaS.

---

## 13. Financeiro

### 13.1 Princípios

- O módulo é gerencial, não contábil ou fiscal.
- Separar previsão de realização.
- Preservar histórico de alterações.
- Relacionar movimentações a cliente, projeto, contrato, produto ou fornecedor.

### 13.2 Contas

- Caixa.
- Conta bancária.
- Carteira digital.
- Outras contas configuráveis.

### 13.3 Receitas

- Projeto.
- Parcela de contrato.
- Serviço avulso.
- Plano de manutenção.
- Assinatura de SaaS.
- Outras receitas.

### 13.4 Despesas

- Hospedagem.
- Domínios.
- APIs.
- Ferramentas e software.
- E-mail empresarial.
- Marketing.
- Contabilidade.
- Tributos.
- Freelancer.
- Equipamentos.
- Pró-labore/retirada, quando aplicável.
- Reembolso.
- Outras despesas.

### 13.5 Campos de movimentação

- Tipo: entrada ou saída.
- Descrição.
- Categoria e subcategoria.
- Valor previsto.
- Valor realizado.
- Data de competência.
- Vencimento.
- Data de pagamento/recebimento.
- Status: previsto, pendente, parcial, pago, recebido, vencido, cancelado.
- Conta.
- Forma de pagamento.
- Número da parcela.
- Recorrência.
- Cliente/fornecedor.
- Projeto/produto.
- Comprovante.
- Observações.

### 13.6 Recorrências

Uma recorrência é uma regra geradora de previsões, não uma movimentação eternamente editada.

- Periodicidade mensal, trimestral, semestral, anual ou personalizada.
- Data inicial e final opcional.
- Próxima geração.
- Valor padrão.
- Histórico de alterações.
- Pausa e cancelamento.

Alterar o valor futuro não modifica competências passadas.

### 13.7 Dashboards

- Saldo por conta.
- Entradas e saídas do mês.
- Previsto versus realizado.
- Contas a receber.
- Contas a pagar.
- Valores vencidos.
- Receita recorrente da agência.
- Resultado por cliente.
- Resultado por projeto.
- Resultado por produto.

### 13.8 Fora do escopo inicial

- Conciliação bancária automática.
- Open Finance.
- Emissão de nota fiscal.
- Cálculo de imposto.
- Contabilidade de partidas dobradas.
- Integração bancária.

---

## 14. Produtos SaaS da Devora

### 14.1 Separação de responsabilidades

O SaaS é a fonte oficial de seus dados operacionais. O Devora OS recebe somente dados executivos e financeiros consolidados.

O SaaS mantém:

- usuários;
- autenticação do produto;
- planos;
- assinaturas;
- uso;
- funcionalidades;
- operação técnica.

O Devora OS mantém ou consolida:

- cadastro do produto;
- responsáveis;
- estágio e status;
- receita recorrente;
- clientes ativos agregados;
- cancelamentos agregados;
- custos de infraestrutura;
- incidentes relevantes;
- roadmap executivo;
- resultado financeiro.

### 14.2 Integração futura

Cada produto poderá implementar um adaptador para:

- webhook assinado;
- API autenticada;
- importação CSV;
- sincronização agendada.

Requisitos:

- idempotência;
- versionamento do contrato de integração;
- segredo por produto;
- logs sem dados sensíveis desnecessários;
- retries controlados;
- dead-letter/reprocessamento;
- data da última sincronização;
- indicador de dados desatualizados.

---

## 15. Dashboards e relatórios

### 15.1 Dashboard inicial

- Leads novos.
- Leads sem próxima ação.
- Tarefas vencidas.
- Pipeline por etapa.
- Propostas aguardando resposta.
- Projetos com prazo próximo.
- Entradas e saídas do mês.
- Contas vencidas.

### 15.2 Indicadores comerciais

- Leads por origem.
- Conversão por origem.
- Conversão por etapa.
- Tempo médio até resposta.
- Tempo médio até fechamento.
- Valor do pipeline.
- Ticket médio.
- Motivos de perda.

### 15.3 Indicadores operacionais

- Projetos ativos.
- Projetos atrasados.
- Entregas próximas.
- Manutenções ativas.
- Horas consumidas por plano.

### 15.4 Indicadores financeiros

- Receita e despesa.
- Fluxo de caixa previsto.
- Receita recorrente.
- Inadimplência.
- Margem gerencial por projeto/produto.

---

## 16. Modelo de dados inicial

### 16.1 Núcleo e acesso

- `organizations`
- `profiles`
- `organization_members`
- `roles`
- `permissions`
- `role_permissions`
- `audit_logs`

### 16.2 CRM

- `companies`
- `contacts`
- `lead_sources`
- `lead_mediums`
- `campaigns`
- `leads`
- `lead_attributions`
- `lead_ingestions`
- `opportunities`
- `pipeline_stages`
- `opportunity_stage_history`
- `activities`
- `tasks`
- `tags`
- `entity_tags`

### 16.3 Comercial e documentos

- `clients`
- `services`
- `proposal_templates`
- `proposal_template_versions`
- `proposals`
- `proposal_versions`
- `proposal_items`
- `proposal_attachments`
- `contracts`
- `contract_templates`
- `contract_versions`
- `contract_signers`
- `contract_attachments`
- `provider_profiles`
- `signature_assets`

### 16.4 Projetos

- `projects`
- `project_members`
- `project_milestones`
- `project_tasks`
- `project_files`
- `scope_change_requests`
- `maintenance_plans`
- `maintenance_requests`
- `time_entries`

### 16.5 Financeiro

- `financial_accounts`
- `financial_categories`
- `parties`
- `transactions`
- `transaction_allocations`
- `recurrence_rules`
- `installment_groups`
- `financial_attachments`

### 16.6 Produtos

- `products`
- `product_metrics`
- `product_costs`
- `product_integrations`
- `integration_runs`
- `product_incidents`

### 16.7 Convenções

- IDs UUID.
- Datas em UTC no banco e apresentação no fuso configurado.
- Valores monetários em centavos inteiros ou `numeric` com regra uniforme; nunca `float`.
- `created_at`, `updated_at`, `created_by` e `updated_by` quando relevante.
- Soft delete somente onde houver necessidade real; documentos e movimentações devem usar cancelamento/versionamento.
- `organization_id` em entidades de negócio.
- Índices em chaves estrangeiras, datas de consulta, status e campos de deduplicação.
- CPF/CNPJ armazenado normalizado, exibido com máscara e protegido por permissão.

---

## 17. Segurança e privacidade

### 17.1 Autenticação

- Convite controlado para usuários internos.
- MFA TOTP obrigatório para perfis críticos.
- Verificação do nível de autenticação em ações sensíveis.
- Sessões seguras e expiração adequada.
- Revogação de sessões ao desativar membro.
- Fluxo seguro de recuperação de conta.

### 17.2 Autorização e RLS

- RLS habilitada em todas as tabelas expostas.
- Políticas testadas para leitura, criação, alteração e remoção/cancelamento.
- Nenhuma chave `service_role` no navegador.
- Operações administrativas somente em funções server-side restritas.
- Verificação de papel também no servidor.
- Testes de autorização entre usuários e organizações.

### 17.3 Arquivos

- Buckets privados separados por finalidade.
- Caminhos contendo `organization_id` e entidade.
- URLs assinadas de curta duração.
- Lista explícita de MIME types.
- Limites de tamanho.
- Nomes aleatórios no armazenamento; nome original apenas como metadado.
- Hash SHA-256 em documentos finais.
- Não sobrescrever contratos/propostas finais.

### 17.4 Auditoria

Registrar ações críticas:

- login e alterações de MFA;
- criação/desativação de usuários;
- mudança de permissões;
- visualização/exportação financeira sensível quando justificável;
- geração e cancelamento de proposta;
- aplicação de assinatura visual;
- upload/substituição de contrato;
- alteração de movimentação financeira;
- alteração de integração.

Não gravar senhas, tokens, conteúdo integral de segredos ou payloads sensíveis em logs.

### 17.5 Segredos

- Variáveis de ambiente gerenciadas pelo provedor.
- `.env.local` fora do Git.
- Chaves diferentes por ambiente.
- Rotação documentada.
- Webhooks com assinatura e proteção contra replay.

### 17.6 Privacidade

- Coletar apenas dados necessários.
- Informar finalidade no formulário.
- Registrar origem dos dados.
- Permitir registrar oposição a contatos de prospecção.
- Definir política de retenção.
- Oferecer processo para correção ou exclusão quando aplicável.
- Restringir exportações.

---

## 18. Requisitos não funcionais

### 18.1 Usabilidade

- Mobile-first, embora o painel seja otimizado também para desktop.
- Navegação por teclado.
- Contraste e foco visível.
- Labels e mensagens de erro acessíveis.
- Alvo WCAG 2.2 AA.
- Estados vazios com ação clara.
- Confirmação para ações irreversíveis.

### 18.2 Desempenho

- Paginação server-side em listas.
- Busca com debounce e índices adequados.
- Evitar carregar dashboards inteiros no cliente.
- Imagens otimizadas.
- PDFs gerados sob demanda e armazenados.

### 18.3 Confiabilidade

- Migrações versionadas.
- Backup automático do banco conforme o plano contratado.
- Procedimento testado de restauração antes de dados críticos em produção.
- Idempotência para formulário, webhooks e recorrências.
- Transações para operações financeiras compostas.

### 18.4 Observabilidade

- Logs estruturados com request ID.
- Monitoramento de erros.
- Métricas de submissão do formulário.
- Alertas para falhas de integração futuras.
- Health checks das superfícies públicas essenciais.

---

## 19. Ambientes e entrega

### 19.1 Ambientes

- Desenvolvimento local.
- Preview por pull request.
- Produção.

Criar staging separado apenas quando integrações e risco operacional justificarem o custo.

### 19.2 CI obrigatória

Em cada pull request:

1. instalação reproduzível com lockfile;
2. lint;
3. verificação de tipos;
4. testes unitários;
5. build das aplicações;
6. testes de banco/RLS quando alterados;
7. testes end-to-end críticos conforme crescimento.

### 19.3 Git

- Branch principal protegida.
- Pull requests pequenos.
- Conventional Commits opcional, se ajudar e não atrasar.
- ADR para decisões difíceis de reverter.
- Não versionar segredos, dumps de produção ou arquivos de clientes.

---

## 20. Fases de desenvolvimento

### Fase 0 — Fundação

**Objetivo:** estabelecer base segura e entregável.

- Monorepo.
- Aplicações `marketing` e `dashboard`.
- UI/tokens mínimos.
- Supabase local/remoto.
- Migrações.
- Auth por convite.
- MFA.
- Organização e membros.
- Papéis/permissões.
- RLS inicial.
- CI.
- Deploy de preview e produção.
- Auditoria básica.

**Critério de conclusão:** sócios conseguem entrar com MFA; usuário sem acesso não visualiza dados; CI e deploy funcionam.

### Fase 1 — Landing + entrada de leads

- Landing responsiva.
- Formulário público.
- Origem, UTMs e referrer.
- Validação server-side.
- Antispam e rate limiting.
- Criação automática de lead.
- Aviso no painel.
- Política de privacidade.

**Critério de conclusão:** uma submissão válida aparece uma única vez no painel com origem correta; spam e repetição são tratados.

### Fase 2 — CRM utilizável

- Cadastro manual.
- Empresas e contatos.
- Pipeline.
- Atividades.
- Tarefas e próxima ação.
- Busca, filtros e tags.
- Conversão em cliente.
- Motivos de perda.
- Dashboard comercial básico.

**Critério de conclusão:** a Devora consegue realizar uma semana de prospecção usando apenas o sistema.

### Fase 3 — Propostas

- Serviços.
- Cadastro/vínculo de cliente.
- Modelo timbrado estruturado.
- Tokens automáticos.
- Itens, valores e condições.
- Assinaturas visuais privadas.
- Anexos opcionais.
- Geração de PDF.
- Versionamento imutável.
- Estados e histórico.

**Critério de conclusão:** gerar e enviar uma proposta real sem edição externa.

### Fase 4 — Contratos simplificados

- Modelo simplificado.
- Geração a partir da proposta.
- Signatários CPF/CNPJ.
- Assistência de responsável legal quando aplicável.
- Exportação para assinatura externa.
- Upload do PDF assinado.
- Hash e versionamento.

**Critério de conclusão:** proposta aceita vira contrato e o documento assinado fica vinculado ao cliente.

### Fase 5 — Projetos e manutenção

- Projetos a partir de proposta.
- Marcos, tarefas e arquivos.
- Alterações de escopo.
- Planos de manutenção.
- Solicitações e horas.

**Critério de conclusão:** acompanhar um projeto e um plano recorrente sem ferramenta paralela obrigatória.

### Fase 6 — Financeiro gerencial

- Contas e categorias.
- Entradas e despesas.
- Parcelas.
- Recorrências.
- Comprovantes.
- Previsto versus realizado.
- Relatórios básicos.
- Vínculos com clientes, projetos e produtos.

**Critério de conclusão:** reproduzir o caixa gerencial mensal e identificar valores vencidos.

### Fase 7 — Produtos SaaS

- Cadastro de produtos.
- Custos.
- Métricas manuais inicialmente.
- Dashboard executivo.
- Contrato de integração.
- Primeira integração automatizada somente depois de validar os dados necessários.

---

## 21. Priorização MoSCoW do primeiro lançamento

### Must have

- Login interno por convite.
- MFA dos sócios.
- Papéis básicos.
- RLS.
- Landing.
- Formulário seguro.
- Cadastro manual de leads.
- Origem do lead.
- Empresas e contatos.
- Pipeline.
- Atividades e próxima ação.
- Conversão para cliente.
- Auditoria mínima.

### Should have

- Tags e filtros avançados.
- Dashboard de conversão.
- Confirmação por e-mail no formulário.
- Exportação CSV controlada.
- Modelos iniciais de serviço.

### Could have

- Kanban com drag-and-drop.
- Importação CSV.
- Templates de mensagens.
- Notificações por e-mail.

### Won't have agora

- Scraping.
- Disparo em massa.
- WhatsApp API.
- Editor de proposta estilo Word.
- Assinatura embutida.
- Portal do cliente.
- App móvel.

---

## 22. Estratégia de uso do Codex

### 22.1 Regra principal

Não pedir “construa o Devora OS inteiro”. Dividir em tarefas que caibam em um pull request verificável.

### 22.2 Ordem de trabalho recomendada

Para cada tarefa:

1. fornecer este escopo e indicar a fase atual;
2. pedir ao Codex para inspecionar o repositório e instruções locais;
3. pedir um plano curto antes de alterações grandes;
4. limitar explicitamente o que entra e o que não entra;
5. exigir migração, RLS e testes juntos quando houver tabela nova;
6. exigir lint, types, testes e build ao final;
7. revisar o diff antes de aceitar;
8. manter um pull request por capacidade vertical.

### 22.3 Tamanho ideal das tarefas

Bons exemplos:

- “Crie as tabelas `organizations`, `profiles` e `organization_members`, com migração, RLS e testes.”
- “Implemente convite e login interno com MFA obrigatório para administradores.”
- “Implemente submissão pública de lead com Zod, honeypot, idempotência e teste end-to-end.”
- “Crie a lista paginada de leads com filtros por origem, etapa e responsável.”

Exemplo ruim:

- “Faça CRM, financeiro, propostas e projetos.”

### 22.4 Prompt-base para o Codex

```text
Estamos desenvolvendo o Devora OS. Leia AGENTS.md, README, ADRs e o escopo do projeto antes de alterar arquivos.

Tarefa desta rodada:
[descrever uma única capacidade vertical]

Inclua:
[critérios objetivos]

Não inclua:
[itens explicitamente fora do escopo]

Restrições:
- preservar alterações existentes;
- manter TypeScript estrito;
- validar entradas no servidor;
- não expor segredos ao client;
- criar/atualizar RLS para cada tabela exposta;
- adicionar testes relevantes;
- evitar abstrações sem uso real;
- usar Server Components por padrão e Client Components apenas quando necessário.

Antes de implementar, inspecione o repositório e informe um plano curto. Depois implemente, execute lint, typecheck, testes e build, corrigindo erros dentro do escopo. Ao final, resuma arquivos alterados, decisões e pendências.
```

### 22.5 Guardrails para código gerado

- Não aceitar políticas RLS `using (true)` em dados internos.
- Não aceitar `service_role` em código de navegador.
- Não aceitar `any` para acelerar integrações.
- Não aceitar valores monetários como `float`.
- Não alterar versões enviadas de propostas/contratos.
- Não armazenar arquivos privados em bucket público.
- Não confiar apenas em middleware para autorização.
- Não criar abstrações genéricas sem dois usos reais.
- Não misturar VIZEX com Devora OS.

---

## 23. Backlog inicial executável

### Épico A — Repositório e qualidade

- A1. Inicializar monorepo e workspaces.
- A2. Criar apps marketing e dashboard.
- A3. Configurar TypeScript, lint, format e scripts.
- A4. Configurar CI.
- A5. Criar tokens e componentes mínimos.

### Épico B — Identidade e segurança

- B1. Configurar Supabase e migrações.
- B2. Criar organizações, perfis e membros.
- B3. Criar convite e login.
- B4. Implementar MFA.
- B5. Implementar papéis e permissões.
- B6. Criar auditoria.
- B7. Testar RLS.

### Épico C — Landing e formulário

- C1. Implementar layout e conteúdo.
- C2. Implementar formulário.
- C3. Criar endpoint seguro de ingestão.
- C4. Implementar origem e UTMs.
- C5. Implementar deduplicação e idempotência.
- C6. Implementar antispam.
- C7. Criar política de privacidade inicial.

### Épico D — CRM

- D1. Modelar empresas e contatos.
- D2. Modelar leads e oportunidades.
- D3. Criar cadastro manual.
- D4. Criar listagem e filtros.
- D5. Criar pipeline.
- D6. Criar atividades.
- D7. Criar tarefas/próxima ação.
- D8. Criar conversão em cliente.
- D9. Criar dashboard comercial.

### Épico E — Propostas

- E1. Modelar serviços e modelos.
- E2. Criar tokens.
- E3. Criar editor estruturado.
- E4. Criar itens e totais.
- E5. Criar assinatura visual segura.
- E6. Criar anexos.
- E7. Gerar PDF.
- E8. Criar snapshots e versões.
- E9. Criar fluxo de estados.

### Épico F — Contratos

- F1. Criar modelo simplificado.
- F2. Gerar a partir da proposta.
- F3. Gerenciar signatários.
- F4. Exportar PDF.
- F5. Anexar documento assinado.
- F6. Calcular hash e preservar versão.

### Épico G — Projetos e manutenção

- G1. Criar projeto por conversão.
- G2. Criar marcos e tarefas.
- G3. Criar arquivos do projeto.
- G4. Criar mudança de escopo.
- G5. Criar planos de manutenção.
- G6. Criar solicitações e horas.

### Épico H — Financeiro

- H1. Criar contas e categorias.
- H2. Criar entradas e despesas.
- H3. Criar parcelas.
- H4. Criar recorrências.
- H5. Criar comprovantes privados.
- H6. Criar dashboards.
- H7. Relacionar projetos e produtos.

### Épico I — Produtos

- I1. Cadastrar produtos SaaS.
- I2. Registrar métricas manuais.
- I3. Registrar custos.
- I4. Criar painel executivo.
- I5. Definir contrato de integração.
- I6. Implementar primeira integração.

---

## 24. Definition of Done

Uma tarefa só está concluída quando:

- regra de negócio está implementada;
- estados de carregamento, vazio e erro existem;
- validação ocorre no servidor;
- autorização e RLS foram verificadas;
- testes relevantes passam;
- lint e typecheck passam;
- build passa;
- migrações são reproduzíveis;
- acessibilidade básica foi verificada;
- logs não expõem dados sensíveis;
- documentação/ADR foi atualizada quando necessário;
- não existem segredos ou dados reais de cliente no Git.

---

## 25. Decisões pendentes antes de iniciar

Estas decisões não bloqueiam o escopo, mas devem ser resolvidas na Fase 0:

1. Domínio definitivo da Devora e subdomínio do painel.
2. Identidade visual e conteúdo mínimo da landing.
3. Quem será o primeiro administrador.
4. Endereços de e-mail comercial.
5. Lista inicial de serviços.
6. Etapas finais do pipeline.
7. Limites de arquivo.
8. Política de retenção de leads sem interação.
9. Modelo provisório de proposta e contrato simplificado.
10. Categorias financeiras iniciais.

---

## 26. Fontes técnicas principais

- [Next.js — documentação oficial](https://nextjs.org/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase MFA](https://supabase.com/docs/guides/auth/auth-mfa)
- [React PDF](https://react-pdf.org/)
- [Vercel Rate Limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting)

---

## 27. Recomendação final de corte

O primeiro lançamento público deve terminar ao fim da **Fase 2**: landing, formulário seguro e CRM utilizável. Propostas, contratos, projetos, financeiro e produtos permanecem no mesmo planejamento, mas entram em incrementos posteriores.

Esse corte permite que a Devora comece a captar e acompanhar leads rapidamente. O sistema passa a produzir valor antes de consumir meses de desenvolvimento e o uso real orienta os módulos seguintes.
