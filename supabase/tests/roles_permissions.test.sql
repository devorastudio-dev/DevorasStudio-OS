begin;
create extension if not exists pgtap with schema extensions;
select plan(27);

insert into public.organizations (id, name, slug) values
('00000000-0000-4000-8000-000000000501','RBAC Um','rbac-um'),
('00000000-0000-4000-8000-000000000502','RBAC Dois','rbac-dois');
insert into auth.users (id,email,created_at,updated_at) values
('00000000-0000-4000-8000-000000000511','admin@example.invalid',now(),now()),
('00000000-0000-4000-8000-000000000512','alvo@example.invalid',now(),now()),
('00000000-0000-4000-8000-000000000513','convidado-rbac@example.invalid',now(),now()),
('00000000-0000-4000-8000-000000000514','suspenso-rbac@example.invalid',now(),now()),
('00000000-0000-4000-8000-000000000515','outro@example.invalid',now(),now());
insert into public.organization_members (id,organization_id,user_id,status) values
('00000000-0000-4000-8000-000000000521','00000000-0000-4000-8000-000000000501','00000000-0000-4000-8000-000000000511','active'),
('00000000-0000-4000-8000-000000000522','00000000-0000-4000-8000-000000000501','00000000-0000-4000-8000-000000000512','active'),
('00000000-0000-4000-8000-000000000523','00000000-0000-4000-8000-000000000501','00000000-0000-4000-8000-000000000513','invited'),
('00000000-0000-4000-8000-000000000524','00000000-0000-4000-8000-000000000501','00000000-0000-4000-8000-000000000514','suspended'),
('00000000-0000-4000-8000-000000000525','00000000-0000-4000-8000-000000000502','00000000-0000-4000-8000-000000000515','active');

select is((select count(*)::integer from public.roles where organization_id='00000000-0000-4000-8000-000000000501'),4,'quatro papeis de sistema por organizacao');
select is((select count(*)::integer from public.permissions),22,'catalogo explicito possui 22 permissoes');
select is((select count(*)::integer from public.role_permissions rp join public.roles r on r.id=rp.role_id where r.organization_id='00000000-0000-4000-8000-000000000501' and r.slug='administrador'),22,'administrador recebe catalogo completo');
select is((select count(*)::integer from public.role_permissions rp join public.roles r on r.id=rp.role_id where r.organization_id='00000000-0000-4000-8000-000000000501' and r.slug='socio'),18,'socio recebe matriz esperada');
select is((select count(*)::integer from public.role_permissions rp join public.roles r on r.id=rp.role_id where r.organization_id='00000000-0000-4000-8000-000000000501' and r.slug='colaborador'),12,'colaborador recebe matriz minima');
select is((select count(*)::integer from public.role_permissions rp join public.roles r on r.id=rp.role_id where r.organization_id='00000000-0000-4000-8000-000000000501' and r.slug='financeiro'),4,'financeiro recebe matriz financeira');

insert into public.organization_member_roles (organization_id,membership_id,role_id)
select '00000000-0000-4000-8000-000000000501','00000000-0000-4000-8000-000000000521',id from public.roles where organization_id='00000000-0000-4000-8000-000000000501' and slug='administrador';

set local role anon;
select throws_ok($$select * from public.roles$$,'42501','permission denied for table roles','anonimo nao acessa papeis');
reset role;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000513","role":"authenticated","aal":"aal2"}',true);
select is(public.has_permission('roles.read'),false,'convidado nao possui permissoes');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000514","role":"authenticated","aal":"aal2"}',true);
select is(public.has_permission('roles.read'),false,'suspenso nao possui permissoes');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000512","role":"authenticated","aal":"aal2"}',true);
select is(public.has_permission('roles.manage'),false,'ativo sem papel nao possui privilegio');

select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000511","role":"authenticated","aal":"aal1"}',true);
select is(public.has_permission('roles.manage'),false,'AAL1 nao administra permissoes');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000511","role":"authenticated","aal":"aal2"}',true);
select is(public.has_role('administrador'),true,'administrador reconhecido no estado atual do banco');
select is(public.has_permission('roles.manage'),true,'administrador possui roles.manage');
select is(public.has_permission('roles.manage','00000000-0000-4000-8000-000000000502'),false,'has_permission rejeita organizacao alheia');
select lives_ok($$select public.assign_member_role('00000000-0000-4000-8000-000000000522','colaborador')$$,'administrador atribui papel');
select lives_ok($$select public.assign_member_role('00000000-0000-4000-8000-000000000522','colaborador')$$,'atribuicao repetida e idempotente');
select is((select count(*)::integer from public.organization_member_roles where membership_id='00000000-0000-4000-8000-000000000522'),1,'idempotencia nao duplica atribuicao');
select throws_ok($$select public.assign_member_role('00000000-0000-4000-8000-000000000521','socio')$$,'P0001','Operation not permitted.','usuario nao atribui papel a si mesmo');
select throws_ok($$select public.assign_member_role('00000000-0000-4000-8000-000000000525','administrador')$$,'P0001','Operation not permitted.','papel nao atravessa organizacao');

select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000512","role":"authenticated","aal":"aal2"}',true);
select is(public.has_permission('financial.read'),false,'colaborador nao acessa financeiro');
select is(public.has_permission('roles.manage'),false,'colaborador nao altera papeis');
select throws_ok($$select public.assign_member_role('00000000-0000-4000-8000-000000000523','socio')$$,'P0001','Operation not permitted.','membro sem roles.manage nao atribui papel');

reset role;
select throws_ok($$delete from public.organization_member_roles where membership_id='00000000-0000-4000-8000-000000000521'$$,'P0001','The last active administrator cannot be removed.','ultimo administrador ativo e protegido');
select throws_ok($$update public.organization_members set status='suspended' where id='00000000-0000-4000-8000-000000000521'$$,'P0001','The last active administrator cannot be removed.','ultimo administrador nao pode ser suspenso');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000511","role":"authenticated","aal":"aal2"}',true);
select lives_ok($$select public.remove_member_role('00000000-0000-4000-8000-000000000522','colaborador')$$,'administrador remove papel alheio');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000512","role":"authenticated","aal":"aal2"}',true);
select is(public.has_permission('crm.read'),false,'remocao revoga acesso imediatamente');

reset role;
insert into public.organization_member_roles (organization_id,membership_id,role_id)
select '00000000-0000-4000-8000-000000000501','00000000-0000-4000-8000-000000000524',id from public.roles where organization_id='00000000-0000-4000-8000-000000000501' and slug='administrador';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000514","role":"authenticated","aal":"aal2"}',true);
select is(public.has_permission('roles.manage'),false,'suspensao revoga papel imediatamente');

select * from finish();
rollback;
