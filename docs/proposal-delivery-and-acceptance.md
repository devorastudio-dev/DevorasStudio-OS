# Envio e aceite de propostas

A D5 disponibiliza somente versões imutáveis. Um token aleatório de 256 bits é entregue ao cliente; o banco guarda apenas seu SHA-256. Links podem ser revogados e expiram 30 dias após a criação. A página pública é `noindex`, não revela IDs internos e resolve dados por RPC restrita.

O histórico em `proposal_events` é append-only pela aplicação e separado da auditoria técnica. Visualizações são minimizadas para o primeiro evento e chamadas públicas são limitadas por token e janela, sem IP ou fingerprint. Aceite e recusa são decisões comerciais simples, transacionais, idempotentes e vinculadas à versão.

## E-mail

Configure somente no servidor:

```text
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Devora Studio <propostas@dominio-verificado>
APP_URL=https://app.exemplo.com
```

O SDK Resend usa uma chave de idempotência por delivery. Se configuração ou provider falhar, o link pendente é revogado e a proposta não é marcada como enviada. Sem destinatário, desmarque o envio e copie o link gerado.

O download público de anexos utiliza `SUPABASE_SECRET_KEY` exclusivamente na route server-side depois que token, expiração, versão e attachment são autorizados. Essa variável jamais pode usar prefixo `NEXT_PUBLIC_`.
