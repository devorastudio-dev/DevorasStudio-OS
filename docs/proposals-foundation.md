# Fundação de propostas

A D1 introduz propostas como dados estruturados. PDF, HTML final, envio, aceite, contratos, projetos e financeiro permanecem fora do escopo.

## Modelo

- services mantém catálogo tenant-aware, unidade controlada, preço padrão numeric(14,2) e inativação sem exclusão;
- proposals referencia obrigatoriamente um cliente e opcionalmente uma oportunidade vinculada ao mesmo cliente;
- proposal_items guarda snapshot de nome, descrição, unidade e preço;
- quantidade usa numeric(12,3); valores usam numeric(14,2);
- somente BRL e o estado draft são operacionais na D1.

Subtotal e total são recalculados no PostgreSQL. O navegador não envia totais. O desconto fixo é limitado ao subtotal.

## Numeração

Uma tabela privada mantém contador por organização e ano. A operação atômica produz números como DEV-2026-0001 por upsert concorrente, sem count mais um.

## Segurança

proposals.read permite leitura. proposals.write permite mutações por RPC. Administrador, Sócio e Colaborador recebem escrita; Financeiro não. A capacidade anterior proposals.create é preservada por compatibilidade.

As tabelas têm RLS. Leitura exige membro active, AAL2, tenant e proposals.read. Escritas usam RPCs security definer com search_path vazio, tenant derivado e proposals.write. Não há DML direto ou acesso anon.

Auditoria guarda somente IDs, estado e indicadores técnicos, sem PII, descrições ou valores.

## Rotas

- /proposals: busca, filtro e paginação;
- /proposals/new: cria rascunho;
- /proposals/[id]: dados, itens, desconto e totais;
- /proposals/services: catálogo.

Itens podem partir do catálogo ou ser personalizados. Reordenação usa botões acessíveis.

## Validação

    npm run supabase:db:reset
    npm run supabase:db:test
    npm run supabase:db:lint
    npm run supabase:db:diff
    npm run supabase:types
    npm run lint
    npm run typecheck
    npm test --workspace=@devora/dashboard
    npm run build

Testes usam dados sintéticos. Rollout exige dry-run e autorização explícita.
