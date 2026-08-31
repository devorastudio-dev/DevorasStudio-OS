begin;
create extension if not exists pgtap with schema extensions;
select plan(33);

select is((select count(*)::integer from unnest(array[
  'organizations','profiles','organization_members','permissions','roles','role_permissions','organization_member_roles','audit_logs','leads','crm_companies','crm_contacts','pipeline_stages','opportunities','opportunity_stage_history','crm_activities','crm_tasks','clients','client_opportunities','services','proposals','proposal_items'
]) expected(table_name) where to_regclass('public.' || expected.table_name) is null),0,'todas as tabelas publicas esperadas existem');
select is((select count(*)::integer from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity),0,'todas as tabelas publicas possuem RLS');
select is((select count(*)::integer from pg_policies where schemaname='public' and (qual='true' or with_check='true')),0,'nenhuma politica ampla inesperada');
select is((select count(*)::integer from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private') and c.relkind in ('v','m','S')),0,'nenhuma view materializada ou sequence de aplicacao');
select is((select count(*)::integer from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') and p.prosecdef and not ('search_path=""'=any(coalesce(p.proconfig,array[]::text[])))),0,'security definer usa search_path vazio');
select ok(not exists(select 1 from pg_proc p cross join lateral aclexplode(p.proacl) acl where p.oid='public.record_administrative_audit(uuid,text,text,uuid,jsonb)'::regprocedure and acl.grantee=0 and acl.privilege_type='EXECUTE'),'PUBLIC nao executa auditoria administrativa');
select ok(not has_function_privilege('anon','public.record_administrative_audit(uuid,text,text,uuid,jsonb)','EXECUTE'),'anon nao executa auditoria administrativa');
select ok(not has_function_privilege('authenticated','public.record_administrative_audit(uuid,text,text,uuid,jsonb)','EXECUTE'),'authenticated nao executa auditoria administrativa');
select ok(has_function_privilege('service_role','public.record_administrative_audit(uuid,text,text,uuid,jsonb)','EXECUTE'),'service_role executa auditoria administrativa limitada');
select ok(not has_table_privilege('anon','public.audit_logs','SELECT'),'anon nao possui grant de auditoria');
select ok(not has_table_privilege('authenticated','public.audit_logs','INSERT'),'authenticated nao insere auditoria');
select ok(not has_table_privilege('authenticated','public.roles','INSERT'),'authenticated nao insere papeis');
select ok(not has_table_privilege('authenticated','public.permissions','UPDATE'),'authenticated nao altera permissoes');
select ok(not has_table_privilege('authenticated','public.organization_member_roles','DELETE'),'authenticated nao remove atribuicao diretamente');

insert into public.organizations(id,name,slug) values
('00000000-0000-4000-8000-000000000701','Seguranca A','seguranca-a'),
('00000000-0000-4000-8000-000000000702','Seguranca B','seguranca-b');
insert into auth.users(id,email,created_at,updated_at) values
('00000000-0000-4000-8000-000000000711','sem-vinculo@example.invalid',now(),now()),
('00000000-0000-4000-8000-000000000712','ativo-a@example.invalid',now(),now()),
('00000000-0000-4000-8000-000000000713','convidado-a@example.invalid',now(),now()),
('00000000-0000-4000-8000-000000000714','suspenso-a@example.invalid',now(),now()),
('00000000-0000-4000-8000-000000000715','ativo-b@example.invalid',now(),now());
insert into public.organization_members(id,organization_id,user_id,status) values
('00000000-0000-4000-8000-000000000721','00000000-0000-4000-8000-000000000701','00000000-0000-4000-8000-000000000712','active'),
('00000000-0000-4000-8000-000000000722','00000000-0000-4000-8000-000000000701','00000000-0000-4000-8000-000000000713','invited'),
('00000000-0000-4000-8000-000000000723','00000000-0000-4000-8000-000000000701','00000000-0000-4000-8000-000000000714','suspended'),
('00000000-0000-4000-8000-000000000724','00000000-0000-4000-8000-000000000702','00000000-0000-4000-8000-000000000715','active');
insert into public.organization_member_roles(organization_id,membership_id,role_id)
select membership.organization_id,membership.id,role.id from public.organization_members membership
join public.roles role on role.organization_id=membership.organization_id and role.slug='colaborador'
where membership.status='active';

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000711","role":"authenticated","aal":"aal2"}',true);
select is((select count(*)::integer from public.profiles),0,'autenticado sem associacao nao le perfil');
update public.profiles set full_name='indevido' where id='00000000-0000-4000-8000-000000000711';
reset role;
select is((select full_name from public.profiles where id='00000000-0000-4000-8000-000000000711'),null,'sem associacao nao atualiza perfil');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000712","role":"authenticated","aal":"aal1"}',true);
select is((select count(*)::integer from public.profiles),0,'AAL1 nao le perfil interno');
select is(public.has_permission('crm.read'),false,'AAL1 nao recebe permissao');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000712","role":"authenticated","aal":"invalid"}',true);
select is((select count(*)::integer from public.organizations),0,'claim AAL invalido falha fechado');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000712","role":"authenticated"}',true);
select is((select count(*)::integer from public.organizations),0,'claim AAL ausente falha fechado');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000712","role":"authenticated","aal":"aal2"}',true);
select is((select count(*)::integer from public.profiles where id='00000000-0000-4000-8000-000000000712'),1,'ativo AAL2 le apenas proprio perfil');
select is((select count(*)::integer from public.organizations),1,'ativo AAL2 le apenas organizacao permitida');
select is(public.has_permission('financial.read'),false,'AAL2 nao substitui permissao explicita');
select throws_ok($$select public.assign_member_role('00000000-0000-4000-8000-000000000724','administrador')$$,'P0001','Operation not permitted.','RPC rejeita membro de outra organizacao');
select throws_ok($$select public.assign_member_role('00000000-0000-4000-8000-000000000721','administrador')$$,'P0001','Operation not permitted.','RPC rejeita autoelevacao');
select throws_ok($$select public.record_audit_event('member.role.assigned','success','organization_member','00000000-0000-4000-8000-000000000721','{}',null)$$,'P0001','Audit event not permitted.','cliente nao falsifica sucesso administrativo');
select throws_ok($$select public.record_audit_event('auth.login.succeeded','failure',null,null,'{}',null)$$,'P0001','Audit event not permitted.','cliente nao falsifica resultado de login');
select throws_ok($$select public.record_audit_event('auth.access.denied','denied',null,null,'{"arbitrary":"value"}',null)$$,'P0001','Audit event not permitted.','metadata fora do contrato e rejeitada');
select lives_ok($$select public.record_audit_event('auth.access.denied','denied',null,null,'{"capability":"audit.read"}','00000000-0000-4000-8000-000000000799')$$,'request_id UUID valido e aceito');
reset role;
select is((select actor_user_id from public.audit_logs where request_id='00000000-0000-4000-8000-000000000799'),'00000000-0000-4000-8000-000000000712'::uuid,'ator e derivado da sessao');
select is((select organization_id from public.audit_logs where request_id='00000000-0000-4000-8000-000000000799'),'00000000-0000-4000-8000-000000000701'::uuid,'organizacao e derivada do vinculo');

set local role anon;
select throws_ok($$select public.record_audit_event('auth.login.failed','success',null,null,'{}',null)$$,'P0001','Audit event not permitted.','anon nao falsifica outcome');
select throws_ok($$select public.record_administrative_audit('00000000-0000-4000-8000-000000000701','member.invited','user','00000000-0000-4000-8000-000000000711','{}')$$,'42501','permission denied for function record_administrative_audit','anon nao chama RPC administrativa');

select * from finish();
rollback;
