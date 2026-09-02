# PDF oficial e anexos de propostas

A D4 gera o documento comercial oficial exclusivamente de `proposal_versions.snapshot`. O preview HTML continua representando o draft e não oferece PDF oficial. Cada versão expõe um download autenticado em `/api/proposals/{proposalId}/versions/{version}/pdf`.

## PDF

`@react-pdf/renderer` roda somente no runtime Node da route e produz A4 sob demanda, sem Chromium e sem entrar no bundle do navegador. O documento usa Helvetica embutida, tokens de cor centralizados, capa, cabeçalho e rodapé fixos, seções textuais escapadas, investimento com valores congelados, área visual de assinatura e lista dos anexos da versão. Não interpreta HTML e não recalcula valores históricos.

A route exige sessão ativa, AAL2, `proposals.read`, organização derivada da sessão e versão same-tenant. A resposta usa `application/pdf`, `attachment`, filename sanitizado e `private, no-store`. A geração bem-sucedida registra apenas versão, request ID e duração; falhas registram somente código técnico sanitizado.

## Anexos privados

O bucket `proposal-attachments` é privado, limitado a 10 MiB e aceita apenas PDF, PNG e JPEG. A aplicação valida nome, MIME e tamanho no servidor, calcula SHA-256 e prepara o caminho tenant-aware pela RPC antes do upload:

```text
organization_id/proposals/proposal_id/attachment_id/filename-seguro
```

`proposal_attachments` representa anexos do draft. Ao criar uma proposal version, um trigger copia metadados, caminho e checksum para `proposal_version_attachments`. Qualquer anexo referenciado por versão deixa de ser removível, inclusive pela policy do Storage. Assim, o histórico não aponta para um arquivo operacionalmente mutável. O checksum é evidência de integridade, não assinatura digital.

Download e listagem exigem `proposals.read`; upload e remoção exigem `proposals.write`. RLS, FKs compostas e policies do Storage aplicam tenant, associação ativa e AAL2. Não há DML direto para `authenticated`. Auditoria não armazena conteúdo, filename, cliente ou outras informações comerciais.

## Operação local

```sh
npm run supabase:start
npm run supabase:db:reset
npm run supabase:db:test
npm run supabase:db:lint
npm run supabase:db:diff
npm run supabase:types
```

Teste uploads somente no Storage local antes do rollout. D5 poderá reutilizar a versão, o PDF e os checksums para envio, link público e aceite, mas nenhuma dessas operações existe na D4.
