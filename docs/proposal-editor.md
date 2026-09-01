# Editor estruturado de propostas

A D2 transforma o rascunho comercial em um documento estruturado e oferece preview HTML autenticado. HTML, PDF, templates e versões não são persistidos nesta etapa.

## Modelo editorial

`proposal_sections` guarda uma cópia própria por proposta, tenant, tipo controlado, título, texto simples, posição e visibilidade. Novas propostas recebem títulos vazios para apresentação, objetivo, escopo, entregáveis, tecnologias, prazo, condições comerciais, observações e encerramento. Seções `custom` permitem títulos adicionais. Títulos têm até 120 caracteres, conteúdo até 12.000 e posição entre 1 e 100.

`organization_document_settings` mantém apenas nome comercial obrigatório e e-mail, telefone, site, cidade e caminho de logo opcionais. Não exige CNPJ, não usa Storage e não cria dados fictícios. O cliente é lido das relações atuais; a proposta não duplica sua PII.

## Tokens

O resolver server-side aceita somente:

- `{{proposal.number}}`;
- `{{proposal.title}}`;
- `{{proposal.valid_until}}`;
- `{{proposal.total}}`;
- `{{client.name}}`;
- `{{organization.name}}`.

Tokens desconhecidos permanecem visíveis e são reportados pelo resolver. Não existem avaliação de caminhos, JavaScript, SQL ou HTML. Conteúdo é texto simples renderizado pelo React, que escapa caracteres especiais e impede HTML editorial arbitrário.

## Editor e preview

O detalhe `/proposals/[id]` permite salvar, cancelar/resetar, ocultar, reordenar e remover seções somente em `draft` e com `proposals.write`. `/proposals/[id]/preview` exige `proposals.read` e monta um `ProposalDocument` em consultas agrupadas. O renderer puro não lê sessão, banco ou mutations e pode futuramente receber uma versão congelada.

O investimento apresenta os snapshots e totais oficiais da D1. O CSS oferece composição A4 em desktop, adaptação mobile e regras de impressão. Imprimir pelo navegador não produz o PDF oficial futuro.

## Segurança e evolução

As tabelas possuem RLS e apenas SELECT para `authenticated`; mutations passam por RPCs `security definer`, tenant derivado, AAL2, `proposals.write` e proposta `draft`. FKs compostas impedem relação cross-tenant. Auditoria registra apenas IDs, tipo, posição, visibilidade e operação, nunca conteúdo ou PII.

Seções podem ser copiadas futuramente de um template sem vínculo dinâmico. O DTO e renderer também permitem que D3 forneça snapshots versionados. PDF, envio, link público, aceite e assinatura continuam fora do escopo.

## Validação

```sh
npm run supabase:db:reset
npm run supabase:db:test
npm run supabase:db:lint
npm run supabase:db:diff
npm run supabase:types
npm run lint
npm run typecheck
npm test --workspace=@devora/dashboard
npm run build
```
