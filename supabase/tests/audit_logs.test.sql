begin;
create extension if not exists pgtap with schema extensions;
select plan(25);

select has_table('public','audit_logs','audit_logs existe');
select col_is_pk('public','audit_logs','id','id e chave primaria');
select col_not_null('public','audit_logs','created_at','created_at obrigatorio');
select has_index('public','audit_logs','audit_logs_organization_created_idx','indice organizacao e data existe');

insert into public.organizations (id,name,slug) values
('00000000-0000-4000-8000-000000000601','Audit Um','audit-um'),
('00000000-0000-4000-8000-000000000602','Audit Dois','audit-dois');
insert into auth.users (id,email,created_at,updated_at) values
('00000000-0000-4000-8000-000000000611','admin-audit@example.invalid',now(),now()),
('00000000-0000-4000-8000-000000000612','socio-audit@example.invalid',now(),now()),
('00000000-0000-4000-8000-000000000613','colab-audit@example.invalid',now(),now()),
('00000000-0000-4000-8000-000000000614','financeiro-audit@example.invalid',now(),now()),
('00000000-0000-4000-8000-000000000615','convidado-audit@example.invalid',now(),now()),
('00000000-0000-4000-8000-000000000616','suspenso-audit@example.invalid',now(),now()),
('00000000-0000-4000-8000-000000000617','outro-audit@example.invalid',now(),now());
insert into public.organization_members (id,organization_id,user_id,status) values
('00000000-0000-4000-8000-000000000621','00000000-0000-4000-8000-000000000601','00000000-0000-4000-8000-000000000611','active'),
('00000000-0000-4000-8000-000000000622','00000000-0000-4000-8000-000000000601','00000000-0000-4000-8000-000000000612','active'),
('00000000-0000-4000-8000-000000000623','00000000-0000-4000-8000-000000000601','00000000-0000-4000-8000-000000000613','active'),
('00000000-0000-4000-8000-000000000624','00000000-0000-4000-8000-000000000601','00000000-0000-4000-8000-000000000614','active'),
('00000000-0000-4000-8000-000000000625','00000000-0000-4000-8000-000000000601','00000000-0000-4000-8000-000000000615','invited'),
('00000000-0000-4000-8000-000000000626','00000000-0000-4000-8000-000000000601','00000000-0000-4000-8000-000000000616','suspended'),
('00000000-0000-4000-8000-000000000627','00000000-0000-4000-8000-000000000602','00000000-0000-4000-8000-000000000617','active');
insert into public.organization_member_roles (organization_id,membership_id,role_id)
select membership.organization_id,membership.id,role.id from public.organization_members membership
join public.roles role on role.organization_id=membership.organization_id
where role.slug=case membership.user_id
when '00000000-0000-4000-8000-000000000611' then 'administrador'
when '00000000-0000-4000-8000-000000000612' then 'socio'
when '00000000-0000-4000-8000-000000000613' then 'colaborador'
when '00000000-0000-4000-8000-000000000614' then 'financeiro'
when '00000000-0000-4000-8000-000000000617' then 'administrador' end;

insert into public.audit_logs (organization_id,actor_user_id,action,outcome) values
('00000000-0000-4000-8000-000000000601','00000000-0000-4000-8000-000000000611','auth.login.succeeded','success'),
('00000000-0000-4000-8000-000000000602','00000000-0000-4000-8000-000000000617','auth.login.succeeded','success');

set local role anon;
select throws_ok($$select * from public.audit_logs$$,'42501','permission denied for table audit_logs','anonimo nao le');
select throws_ok($$insert into public.audit_logs(action,outcome) values('auth.login.failed','failure')$$,'42501','permission denied for table audit_logs','anonimo nao insere diretamente');
reset role;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000611","role":"authenticated","aal":"aal1"}',true);
select is((select count(*)::integer from public.audit_logs),0,'AAL1 nao le');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000611","role":"authenticated","aal":"aal2"}',true);
select is((select count(*)::integer from public.audit_logs),5,'administrador le apenas propria organizacao incluindo eventos de trigger');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000612","role":"authenticated","aal":"aal2"}',true);
select is((select count(*)::integer from public.audit_logs),0,'socio nao le auditoria conforme matriz B5 vigente');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000613","role":"authenticated","aal":"aal2"}',true);
select is((select count(*)::integer from public.audit_logs),0,'colaborador nao le');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000614","role":"authenticated","aal":"aal2"}',true);
select is((select count(*)::integer from public.audit_logs),0,'financeiro nao le');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000615","role":"authenticated","aal":"aal2"}',true);
select is((select count(*)::integer from public.audit_logs),0,'convidado nao le');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000616","role":"authenticated","aal":"aal2"}',true);
select is((select count(*)::integer from public.audit_logs),0,'suspenso nao le');
select throws_ok($$insert into public.audit_logs(action,outcome) values('auth.login.succeeded','success')$$,'42501','permission denied for table audit_logs','usuario comum nao insere');
select throws_ok($$update public.audit_logs set outcome='failure'$$,'42501','permission denied for table audit_logs','usuario comum nao atualiza');
select throws_ok($$delete from public.audit_logs$$,'42501','permission denied for table audit_logs','usuario comum nao apaga');
reset role;

select throws_ok($$insert into public.audit_logs(action,outcome) values('invalid.action.value','success')$$,'23514',null,'acao fora do catalogo rejeitada');
select throws_ok($$insert into public.audit_logs(action,outcome) values('auth.login.failed','invalid')$$,'23514',null,'resultado invalido rejeitado');
select throws_ok($$insert into public.audit_logs(action,outcome,metadata) values('auth.login.failed','failure','{"password":"known-secret"}')$$,'23514',null,'metadata sensivel rejeitada');
select throws_ok($$insert into public.audit_logs(action,outcome,metadata) values('auth.login.failed','failure',jsonb_build_object('safe',repeat('x',5000)))$$,'23514',null,'metadata grande rejeitada');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000611","role":"authenticated","aal":"aal2"}',true);
select lives_ok($$select public.record_audit_event('auth.access.denied','denied',null,null,'{"capability":"roles.manage"}',null)$$,'funcao registra ator confiavel');
reset role;
select is((select actor_user_id from public.audit_logs where action='auth.access.denied'),'00000000-0000-4000-8000-000000000611'::uuid,'ator nao e fornecido pelo cliente');
select is((select organization_id from public.audit_logs where action='auth.access.denied'),'00000000-0000-4000-8000-000000000601'::uuid,'organizacao e resolvida pelo vinculo');
select is((select count(*)::integer from public.audit_logs where action='member.role.assigned'),5,'atribuicoes geram auditoria atomica');
select is((select count(*)::integer from public.audit_logs where organization_id='00000000-0000-4000-8000-000000000602'),2,'isolamento preserva eventos da segunda organizacao');

select * from finish();
rollback;
