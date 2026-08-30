# Landing e captação de leads

## Arquitetura

O formulário público do workspace `apps/marketing` envia uma Server Action. A ação valida os campos com Zod, descarta silenciosamente o honeypot e envios rápidos e chama `submit_public_lead` com uma Publishable key. Não existe `INSERT` direto para `anon`.

A RPC `security definer` aceita somente os campos públicos, resolve a organização pelo slug fixo `devora-studio` e define internamente origem, status, consentimento e datas. O banco serializa envios por e-mail, ignora a mesma mensagem por dez minutos e limita a três mensagens por e-mail a cada hora. A resposta ao visitante é genérica. Não são armazenados IP, user agent ou parâmetros desconhecidos.

Leitura exige AAL2, vínculo ativo e `crm.read`. Nesta entrega não há atualização ou exclusão direta de leads. Toda evolução do schema deve ocorrer por migração.

## Configuração

Copie `apps/marketing/.env.example` para `.env.local` no mesmo workspace e preencha localmente:

- `SUPABASE_URL`: URL do projeto;
- `SUPABASE_PUBLISHABLE_KEY`: Publishable key pública.

Esses nomes são server-side no marketing. Nunca use Secret key ou `service_role`, nem crie variantes `NEXT_PUBLIC_` para segredos. Na Vercel, cadastre as duas variáveis separadamente no projeto marketing e nos ambientes aprovados.

A organização receptora precisa existir com slug `devora-studio`. Confirme isso antes de aplicar a migração remota.

## Operação

```sh
npm run supabase:db:reset
npm run supabase:db:lint
npm run supabase:db:test
npm run supabase:types
npm run test --workspace @devora/marketing
```

Antes de produção, revise `npm run supabase:db:push:dry-run`, aplique a migração pelo fluxo autorizado, regenere os tipos e faça novo deployment do marketing. Teste um envio e confirme o registro usando acesso interno autorizado; não consulte a tabela com credencial pública.

## Proteções e limites

- validação ocorre no cliente por atributos HTML, na Server Action por Zod e no PostgreSQL por constraints;
- honeypot e tempo mínimo reduzem automação simples;
- repetição e duplicidade são controladas transacionalmente no banco;
- somente UTM source, medium, campaign, content e term são aceitas, com limite de tamanho;
- erro interno não é devolvido ao navegador;
- a política de privacidade está em `/privacy`.

Não foi configurado CAPTCHA, serviço externo de rate limit ou notificação por e-mail porque não há infraestrutura aprovada para isso. Monitorar abuso e adicionar uma proteção distribuída será necessário se os sinais reais justificarem. A equipe também deve definir canal operacional e prazo de triagem dos leads.

O conteúdo público é deliberadamente conservador e deve passar por revisão editorial antes de campanhas. Nenhuma métrica de Lighthouse foi declarada; execute auditoria própria no deployment final.
