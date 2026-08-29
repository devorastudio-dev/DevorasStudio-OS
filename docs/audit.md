# Auditoria basica

`public.audit_logs` preserva eventos criticos de autenticacao, MFA e administracao. Auditoria nao substitui logs tecnicos da aplicacao, Vercel, Supabase Auth ou PostgreSQL: ela responde quem realizou qual acao, em qual organizacao, quando e com qual resultado.

## Modelo e acesso

Cada registro possui `action`, `outcome`, organizacao e ator quando conhecidos, entidade opcional, metadata sanitizada, `request_id` opcional e `created_at` definido pelo banco. Nao existe `updated_at`, soft delete, `UPDATE` ou `DELETE` pela aplicacao.

Somente membro ativo, em AAL2, com `audit.read` consulta eventos da propria organizacao. Na matriz B5 vigente, apenas Administrador possui essa permissao; Socio, Colaborador e Financeiro nao possuem. A interface protegida fica em `/admin/audit`, pagina 25 registros por vez, limita paginas e periodos a 90 dias e filtra por data, acao, resultado, ator e entidade.

## Catalogo atual

- autenticacao: login, logout, recuperacao, convite e acesso negado;
- MFA: inicio/conclusao do enrollment, desafio e adicao/remocao de fator;
- membros: convite, ativacao, suspensao e reativacao;
- acesso: atribuicao/remocao de papel, negacao e bootstrap do Administrador.

Eventos de funcionalidades inexistentes nao sao gravados. `role.created`, `role.updated` e `role.deleted` ficam adiados porque ainda nao ha gestao de papeis customizados. Propostas, contratos, financeiro, CRM e integracoes terao catalogos proprios quando existirem.

Metadata aceita apenas contexto enumerado e minimo, como capacidade, papel, modo e origem. Senhas, e-mail completo, TOTP, QR Code, tokens, cookies, sessao, chaves, corpo de requisicao e user-agent integral sao proibidos. O banco limita metadata a 4 KiB e rejeita chaves sensiveis conhecidas.

## Insercao e investigacao

O navegador nao insere diretamente na tabela. `record_audit_event` fixa o ator por `auth.uid()` e resolve a organizacao pelo vinculo ativo; para falha de login e recuperacao anonima, organizacao e ator permanecem nulos. `record_administrative_audit` e exclusiva do papel PostgreSQL `service_role`, aceita somente tres eventos administrativos e e usada pelos scripts locais. O trigger de atribuicao de papel garante atomicidade com a alteracao.

Para investigar, filtre primeiro por periodo e acao em `/admin/audit`; use `request_id`, quando presente, para correlacionar com logs tecnicos sanitizados. Ausencia inesperada exige conferir o resultado da operacao, grants da funcao, RLS, stack do Supabase e logs tecnicos. Nunca insira, edite ou apague auditoria manualmente para “corrigir” o historico. Em incidente, preserve evidencias, restrinja acesso, registre a linha do tempo e encaminhe a revisao autorizada.

Ao adicionar evento novo:

1. inclua-o no check SQL e no catalogo TypeScript;
2. defina ator, entidade, resultado e metadata permitida;
3. escolha uma unica fonte e grave sucesso somente depois do resultado real;
4. adicione pgTAP para RLS/abuso e Vitest para contratos ou filtros;
5. regenere tipos e execute reset, lint do banco, testes, diff e qualidade do monorepo.

## Retencao e privacidade

A politica operacional inicial sugerida e reter eventos por 12 meses, sujeita a revisao juridica e operacional. Incidentes, obrigacoes contratuais ou investigacoes podem justificar prazo maior. Futuramente, arquivamento e exclusao devem ser globais, aprovados e rastreaveis; nunca se apaga seletivamente para esconder uma acao. Nao ha exclusao automatica nem particionamento nesta fase.

Falhas de auditoria bloqueiam alteracoes criticas de acesso quando fazem parte da mesma transacao. Eventos de Auth atravessam sistemas diferentes e sao registrados depois do resultado; indisponibilidade secundaria retorna mensagem segura e deve ser investigada sem expor detalhes ao usuario.

Limites atuais: eventos anonimos podem gerar ruido controlado, `request_id` ainda depende do fluxo que o disponibilizar, nao ha exportacao, alertas, graficos, SIEM, Sentry ou retencao automatica.
