begin;
create extension if not exists pgtap with schema extensions;
select plan(45);

select has_table('public','pipeline_stages','pipeline stages exist');
select has_table('public','opportunities','opportunities exist');
select has_table('public','opportunity_stage_history','stage history exists');
select col_type_is('public','opportunities','estimated_value','numeric(14,2)','money uses bounded numeric');
select ok(not has_table_privilege('anon','public.opportunities','SELECT'),'anon cannot read opportunities');
select ok(not has_table_privilege('anon','public.opportunities','INSERT'),'anon cannot insert opportunities');
select ok(not has_table_privilege('authenticated','public.opportunities','INSERT'),'authenticated cannot bypass create RPC');
select ok(not has_table_privilege('authenticated','public.opportunity_stage_history','UPDATE'),'history cannot be updated');
select ok(not has_table_privilege('authenticated','public.opportunity_stage_history','DELETE'),'history cannot be deleted');

insert into public.organizations(id,name,slug) values
('30000000-0000-4000-8000-000000000001','Pipeline A','pipeline-a'),
('30000000-0000-4000-8000-000000000002','Pipeline B','pipeline-b');
select is((select count(*)::integer from public.pipeline_stages where organization_id='30000000-0000-4000-8000-000000000001'),8,'eight deterministic initial stages');
select is((select string_agg(position::text,',' order by position) from public.pipeline_stages where organization_id='30000000-0000-4000-8000-000000000001'),'1,2,3,4,5,6,7,8','stage order is deterministic');

insert into auth.users(id,email,created_at,updated_at) values
('30000000-0000-4000-8000-000000000011','writer-a@example.invalid',now(),now()),
('30000000-0000-4000-8000-000000000012','reader-a@example.invalid',now(),now()),
('30000000-0000-4000-8000-000000000013','invited-a@example.invalid',now(),now()),
('30000000-0000-4000-8000-000000000014','suspended-a@example.invalid',now(),now()),
('30000000-0000-4000-8000-000000000015','writer-b@example.invalid',now(),now());
insert into public.organization_members(id,organization_id,user_id,status) values
('30000000-0000-4000-8000-000000000021','30000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000011','active'),
('30000000-0000-4000-8000-000000000022','30000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000012','active'),
('30000000-0000-4000-8000-000000000023','30000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000013','invited'),
('30000000-0000-4000-8000-000000000024','30000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000014','suspended'),
('30000000-0000-4000-8000-000000000025','30000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000015','active');
insert into public.organization_member_roles(organization_id,membership_id,role_id)
select membership.organization_id,membership.id,role.id from public.organization_members membership join public.roles role on role.organization_id=membership.organization_id and role.slug='colaborador' where membership.id in('30000000-0000-4000-8000-000000000021','30000000-0000-4000-8000-000000000025');
insert into public.roles(id,organization_id,name,slug,description) values('30000000-0000-4000-8000-000000000031','30000000-0000-4000-8000-000000000001','Leitor Pipeline','leitor-pipeline','Leitura sintetica.');
insert into public.role_permissions(role_id,permission_id) select '30000000-0000-4000-8000-000000000031',id from public.permissions where key='crm.read';
insert into public.organization_member_roles(organization_id,membership_id,role_id) values('30000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000022','30000000-0000-4000-8000-000000000031');
insert into public.leads(id,organization_id,full_name,email,service_interest,message,source,landing_path,status,consent_version) values
('30000000-0000-4000-8000-000000000041','30000000-0000-4000-8000-000000000001','Lead A','lead-a@example.invalid','other','Mensagem sintetica suficientemente longa.','outbound','/crm/manual','new','manual'),
('30000000-0000-4000-8000-000000000042','30000000-0000-4000-8000-000000000002','Lead B','lead-b@example.invalid','other','Mensagem sintetica suficientemente longa.','outbound','/crm/manual','new','manual');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000011","role":"authenticated","aal":"aal1"}',true);
select is((select count(*)::integer from public.pipeline_stages),0,'AAL1 cannot read pipeline');
select set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000013","role":"authenticated","aal":"aal2"}',true);
select is((select count(*)::integer from public.pipeline_stages),0,'invited cannot read pipeline');
select set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000014","role":"authenticated","aal":"aal2"}',true);
select is((select count(*)::integer from public.pipeline_stages),0,'suspended cannot read pipeline');
select set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000012","role":"authenticated","aal":"aal2"}',true);
select is((select count(*)::integer from public.pipeline_stages),8,'crm.read sees own stages only');
select throws_ok($$select public.create_opportunity_from_lead('30000000-0000-4000-8000-000000000041')$$,'P0001','CRM operation not permitted.','crm.read cannot create');

select set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000011","role":"authenticated","aal":"aal2"}',true);
select lives_ok($$select public.create_opportunity_from_lead('30000000-0000-4000-8000-000000000041','Projeto sintetico',12500.50)$$,'writer creates opportunity from own lead');
select is((select count(*)::integer from public.opportunities),1,'exactly one opportunity created');
select is((select estimated_value from public.opportunities),12500.50::numeric,'estimated value is exact');
select is((select count(*)::integer from public.opportunity_stage_history),1,'creation writes initial history');
select is((select context from public.opportunity_stage_history),'created','initial history is categorized');
select lives_ok($$select public.create_opportunity_from_lead('30000000-0000-4000-8000-000000000041','Repetida',1)$$,'repeated creation is idempotent');
select is((select count(*)::integer from public.opportunities),1,'idempotency avoids duplicate opportunity');
select is((select count(*)::integer from public.opportunity_stage_history),1,'idempotency avoids false history');
select throws_ok($$select public.create_opportunity_from_lead('30000000-0000-4000-8000-000000000042')$$,'P0001','Lead is not available.','cross tenant lead is rejected');

select lives_ok($$select public.move_opportunity((select id from public.opportunities),(select id from public.pipeline_stages where position=2),1)$$,'valid stage movement works');
select is((select version from public.opportunities),2,'movement increments version');
select is((select count(*)::integer from public.opportunity_stage_history),2,'movement appends history');
select is((select previous_stage_id from public.opportunity_stage_history where previous_stage_id is not null order by created_at desc limit 1),(select id from public.pipeline_stages where position=1),'history keeps previous stage');
select lives_ok($$select public.move_opportunity((select id from public.opportunities),(select id from public.pipeline_stages where position=2),2)$$,'same stage movement is idempotent');
select is((select count(*)::integer from public.opportunity_stage_history),2,'same stage adds no history');
select throws_ok($$select public.move_opportunity((select id from public.opportunities),(select id from public.pipeline_stages where organization_id='30000000-0000-4000-8000-000000000002' and position=2),2)$$,'P0001','Pipeline stage is not available.','cross tenant stage is rejected');
select throws_ok($$select public.move_opportunity((select id from public.opportunities),(select id from public.pipeline_stages where position=8),2)$$,'23514','Loss reason is required.','lost requires reason');
select is((select version from public.opportunities),2,'failed movement is atomic');
select lives_ok($$select public.move_opportunity((select id from public.opportunities),(select id from public.pipeline_stages where position=8),2,'price')$$,'valid loss closes opportunity');
select ok((select closed_at is not null and loss_reason='price' from public.opportunities),'loss records closure and reason');
select lives_ok($$select public.move_opportunity((select id from public.opportunities),(select id from public.pipeline_stages where position=3),3)$$,'closed opportunity can reopen');
select ok((select closed_at is null and loss_reason is null from public.opportunities),'reopening clears closure state');
select is((select context from public.opportunity_stage_history where context='reopened' limit 1),'reopened','reopening is preserved in history');
select throws_ok($$select public.update_opportunity((select id from public.opportunities),4,'Projeto sintetico',100,'30000000-0000-4000-8000-000000000024',false)$$,'23514','Opportunity assignee must be an active member.','suspended assignee is rejected');
select lives_ok($$select public.update_opportunity((select id from public.opportunities),4,'Projeto revisado',15000,'30000000-0000-4000-8000-000000000021',false)$$,'active assignee is accepted');
select is((select assigned_membership_id from public.opportunities),'30000000-0000-4000-8000-000000000021'::uuid,'assignee remains same tenant');
select throws_ok($$update public.opportunity_stage_history set context='manual'$$,'42501',null,'history update denied');
select throws_ok($$delete from public.opportunity_stage_history$$,'42501',null,'history delete denied');
reset role;
select ok(not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in('public','private') and p.prosecdef and not ('search_path=""'=any(coalesce(p.proconfig,array[]::text[])))),'security definer functions have safe search path');

select * from finish();
rollback;
