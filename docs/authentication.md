# Autenticação interna

O Devora OS usa Supabase Auth, cookies gerenciados por `@supabase/ssr`, validação server-side e RLS. Não existe cadastro público, criação de organização pelo navegador ou tela administrativa de usuários nesta etapa.

## Variáveis

No `apps/dashboard/.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`: URL pública do projeto;
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: chave Publishable pública;
- `APP_URL`: origem canônica do dashboard, sem barra final;
- `SUPABASE_SECRET_KEY`: chave Secret administrativa usada **somente** pelo script de convite.

`SUPABASE_SECRET_KEY` nunca pode receber prefixo `NEXT_PUBLIC_`, ser importada por código em `src/`, aparecer no navegador, em logs ou no Git. Para produção, use HTTPS em `APP_URL`.

## Configuração do Supabase

Na configuração de autenticação do projeto remoto:

1. desabilite novas inscrições públicas por e-mail; convites administrativos continuam disponíveis;
2. defina a URL principal como a origem exata do dashboard de produção;
3. permita somente os callbacks exatos usados pelo ambiente, como `/auth/confirm`, `/auth/callback` e `/auth/update-password`;
4. para previews, prefira uma lista limitada de origens confiáveis. Não use um wildcard global;
5. mantenha convite/OTP com validade curta e compatível com a operação. O ambiente local usa 3600 segundos;
6. configure senha mínima de 12 caracteres com maiúscula, minúscula e número;
7. revise remetente e templates antes de produção. O envio padrão do Supabase é adequado apenas para desenvolvimento/testes e deverá migrar futuramente para o e-mail comercial da Devora.

No ambiente local, `auth.enable_signup = false` bloqueia todo cadastro público. O provedor de e-mail permanece habilitado em `auth.email.enable_signup = true`, pois ele também é necessário para login e aceite dos usuários criados pelo convite administrativo.

O convite administrativo não usa PKCE porque o navegador que envia o convite é diferente do que o aceita. Configure o link do template de convite para chegar ao endpoint server-side usando o hash, sem expor sessão em fragmento:

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite
```

Para recuperação, o callback por `code` é suportado em `/auth/callback`. Se o template for personalizado com token hash, use:

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery
```

Os nomes e a localização das opções podem mudar no painel; confirme cada ajuste na documentação oficial da versão em uso. Nenhuma configuração remota é alterada por este repositório.

## Convidar o primeiro sócio

Primeiro crie a organização por uma sessão administrativa no banco, usando a transação documentada em `database-core.md`. Não use o cliente público. Depois coloque a chave Secret apenas no `.env.local` da máquina autorizada e execute:

```sh
npm run auth:invite -- \
  --email pessoa@example.invalid \
  --organization-id 00000000-0000-0000-0000-000000000000 \
  --full-name "Pessoa Ficticia"
```

Substitua os dados localmente; não envie e-mail real, UUID, senha ou chave pelo chat. O mesmo comando convida usuários adicionais nesta fase.

O script valida e normaliza o e-mail, valida o UUID, confirma a organização, usa `inviteUserByEmail`, cria o vínculo como `invited` e não imprime tokens. Repetir o mesmo convite não cria duplicidade. Um vínculo ativo, suspenso, pertencente a outra organização ou múltiplo é rejeitado para revisão administrativa.

## Aceite, login e recuperação

1. O convidado abre o link recebido.
2. `/auth/confirm` valida `token_hash` e tipo pelo Supabase e confirma o usuário no servidor.
3. A pessoa define uma senha forte.
4. `accept_my_organization_invitation()` usa apenas `auth.uid()`, exige exatamente um vínculo `invited` e o ativa; não recebe `organization_id` do navegador.
5. O dashboard valida novamente o usuário e exige exatamente um vínculo ativo. A RLS continua sendo a barreira do banco.

Login usa e-mail/senha e retorna mensagem genérica para credenciais inválidas. Recuperação sempre retorna a mesma resposta, exista ou não a conta. Redefinir senha nunca cria associação e não reativa membro suspenso.

O Proxy do Next.js apenas renova cookies e claims. A autorização real é repetida nas páginas internas pelo servidor e no PostgreSQL por RLS.

## Testar localmente

```sh
npm run supabase:start
npm run supabase:db:reset
npm run supabase:db:test
npm run dev --workspace @devora/dashboard
```

Use somente endereços fictícios e o Mailpit local. Acesse o Mailpit pela URL exibida pelo status local, tratando essa saída como sensível. Não envie convites reais durante testes.

## Suspender acesso

Até a B5, suspensão é uma operação administrativa explícita:

```sql
update public.organization_members
set status = 'suspended'
where organization_id = '<organization-id>'::uuid
  and user_id = '<auth-user-id>'::uuid;
```

Confirme os dois identificadores antes da transação. Nunca ofereça essa operação em rota pública. Para evitar bloqueio total, mantenha pelo menos um operador ativo e teste o acesso de um segundo sócio antes de suspender ou excluir o primeiro.

## Checklist de produção

- inscrições públicas desabilitadas;
- URL principal e callbacks HTTPS exatos cadastrados;
- templates de convite e recuperação revisados;
- validade de convite/OTP revisada;
- política de senha alinhada ao ambiente local;
- `APP_URL` de produção configurada;
- chaves Publishable e Secret armazenadas no ambiente correto;
- nenhuma chave Secret no bundle ou em variáveis públicas;
- primeiro sócio convidado e acesso confirmado antes de remover o bootstrap;
- reset, pgTAP, lint, typecheck, testes e build aprovados;
- migração revisada com dry-run antes do push remoto.

## MFA TOTP obrigatório

Enquanto papéis e permissões não existem, todo membro `active` precisa de TOTP e de uma sessão AAL2. O servidor encaminha uma pessoa ativa sem fator verificado para `/auth/mfa/enroll`, e uma pessoa com fator verificado em AAL1 para `/auth/mfa/challenge`. Somente AAL2 libera o dashboard e `/account/security`.

O segredo TOTP existe apenas durante o enrollment fornecido pelo Supabase, não é persistido pelo Devora OS e não deve aparecer em logs, analytics ou suporte. A área de segurança permite adicionar outro fator; o último fator obrigatório não pode ser removido pela aplicação. Fatores não verificados abandonados são removidos antes de iniciar novo enrollment.

A RLS de organizações e membros também exige o claim `aal = aal2`. Uma função mínima retorna somente os estados dos vínculos da identidade atual para que o servidor possa encaminhar AAL1 sem revelar organizações ou colegas.

No projeto remoto, habilite enrollment e verification de TOTP nas configurações de MFA do Supabase. Não habilite Phone ou WebAuthn nesta etapa. Confirme também que as URLs de redirecionamento existentes continuam exatas para produção e desenvolvimento.

### Perda do autenticador

Não existem códigos de recuperação próprios. Uma pessoa autorizada deve verificar a identidade fora do sistema, usar exclusivamente as ferramentas administrativas do Supabase para remover o fator perdido, revogar sessões quando apropriado e exigir novo enrollment no próximo acesso. Registre essa intervenção quando a auditoria for implementada. Nunca exponha uma rota pública ou a chave Secret para esse procedimento.

Redefinir senha não substitui MFA. Suspender um membro corta o acesso pelos guards e pela RLS; a operação administrativa também deve revogar as sessões do usuário. Remover fator exige AAL2 e, após a remoção, a sessão é atualizada.

Papéis poderão refinar quem é obrigado a usar MFA na B5; até lá, nenhum membro ativo fica isento.
