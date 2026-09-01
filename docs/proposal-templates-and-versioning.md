# Templates e versionamento de propostas

O D3 adiciona modelos reutilizáveis por organização e versões imutáveis de modelos e propostas. A proposta continua sendo um rascunho independente: ao escolher um modelo, seções e itens são copiados em uma única transação e mudanças posteriores no modelo não a alteram.

## Snapshots

`proposal_template_versions` e `proposal_versions` guardam documentos JSONB autocontidos. Cada versão recebe um número sequencial sob lock da entidade e uma chave de requisição única, evitando colisões concorrentes e duplicação por reenvio. Versões de proposta congelam dados comerciais, cliente apresentado, dados institucionais, seções, itens, totais e referência ao modelo de origem.

As tabelas de versões concedem somente `SELECT` ao papel autenticado. Inserções acontecem exclusivamente pelas funções `security definer`; não há RPC para atualizar ou excluir snapshots.

## Segurança e operação

Todas as tabelas usam RLS baseada em `proposals.read`; mutações exigem `proposals.write` e uma associação interna válida, incluindo AAL2 pelo fluxo já existente. Eventos relevantes são gravados em `audit_logs` sem armazenar o conteúdo completo do documento.

Rotas: `/proposals/templates`, `/proposals/new`, `/proposals/[id]/versions` e `/proposals/[id]/versions/[version]`.

A migration é aditiva. Validação local: `npm run supabase:start`, `npm run supabase:db:reset`, `npm run supabase:db:lint`, `npm run supabase:db:test` e `npm run supabase:types`.
