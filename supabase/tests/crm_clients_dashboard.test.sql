begin;
create extension if not exists pgtap with schema extensions;
select plan(31);
select has_table('public','clients','clients exist');
select has_table('public','client_opportunities','client opportunity links exist');
select has_function('public','convert_won_opportunity_to_client',array['uuid'],'conversion RPC exists');
select has_function('public','get_crm_dashboard',array['integer'],'dashboard aggregate exists');
select ok(not has_table_privilege('anon','public.clients','SELECT'),'anon cannot read clients');
select ok(not has_table_privilege('authenticated','public.clients','INSERT'),'authenticated cannot bypass conversion RPC');
select ok(not has_table_privilege('authenticated','public.client_opportunities','INSERT'),'authenticated cannot link directly');

insert into public.organizations(id,name,slug) values ('50000000-0000-4000-8000-000000000001','C5 A','c5-a'),('50000000-0000-4000-8000-000000000002','C5 B','c5-b');
insert into auth.users(id,email,created_at,updated_at) values
('50000000-0000-4000-8000-000000000011','writer-a@example.invalid',now(),now()),('50000000-0000-4000-8000-000000000012','reader-a@example.invalid',now(),now()),('50000000-0000-4000-8000-000000000013','writer-b@example.invalid',now(),now());
insert into public.organization_members(id,organization_id,user_id,status) values
('50000000-0000-4000-8000-000000000021','50000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000011','active'),
('50000000-0000-4000-8000-000000000022','50000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000012','active'),
('50000000-0000-4000-8000-000000000023','50000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000013','active');
insert into public.organization_member_roles(organization_id,membership_id,role_id) select m.organization_id,m.id,r.id from public.organization_members m join public.roles r on r.organization_id=m.organization_id and r.slug='colaborador' where m.id in('50000000-0000-4000-8000-000000000021','50000000-0000-4000-8000-000000000023');
insert into public.roles(id,organization_id,name,slug,description) values('50000000-0000-4000-8000-000000000031','50000000-0000-4000-8000-000000000001','Leitor C5','leitor-c5','Leitura sintetica');
insert into public.role_permissions(role_id,permission_id) select '50000000-0000-4000-8000-000000000031',id from public.permissions where key='crm.read';
insert into public.organization_member_roles(organization_id,membership_id,role_id) values('50000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000022','50000000-0000-4000-8000-000000000031');
insert into public.crm_companies(id,organization_id,display_name,normalized_name) values('50000000-0000-4000-8000-000000000041','50000000-0000-4000-8000-000000000001','Empresa C5','empresa c5');
insert into public.crm_contacts(id,organization_id,company_id,full_name) values('50000000-0000-4000-8000-000000000051','50000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000041','Contato C5');
insert into public.leads(id,organization_id,full_name,email,service_interest,message,source,landing_path,status,consent_version,company_id,contact_id) values
('50000000-0000-4000-8000-000000000061','50000000-0000-4000-8000-000000000001','Lead C5','lead-c5@example.invalid','other','Contexto sintetico suficientemente longo.','outbound','/crm/manual','new','manual','50000000-0000-4000-8000-000000000041','50000000-0000-4000-8000-000000000051');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"50000000-0000-4000-8000-000000000012","role":"authenticated","aal":"aal2"}',true);
select throws_ok($$select public.convert_won_opportunity_to_client(gen_random_uuid())$$,'P0001','CRM operation not permitted.','crm.read cannot convert');
select lives_ok($$select public.get_crm_dashboard(30)$$,'crm.read can view aggregate');
select throws_ok($$select public.get_crm_dashboard(365)$$,'22023','Invalid dashboard period.','dashboard rejects unsupported period');

select set_config('request.jwt.claims','{"sub":"50000000-0000-4000-8000-000000000011","role":"authenticated","aal":"aal1"}',true);
select throws_ok($$select public.convert_won_opportunity_to_client(gen_random_uuid())$$,'P0001','CRM operation not permitted.','AAL1 cannot convert');
select set_config('request.jwt.claims','{"sub":"50000000-0000-4000-8000-000000000011","role":"authenticated","aal":"aal2"}',true);
select lives_ok($$select public.create_opportunity_from_lead('50000000-0000-4000-8000-000000000061','Projeto C5',9000)$$,'writer creates opportunity');
select throws_ok($$select public.convert_won_opportunity_to_client((select id from public.opportunities))$$,'23514','Only won opportunities can be converted.','open opportunity cannot convert');
select lives_ok($$select public.move_opportunity((select id from public.opportunities),(select id from public.pipeline_stages where organization_id='50000000-0000-4000-8000-000000000001' and category='lost'),1,'price')$$,'opportunity becomes lost');
select throws_ok($$select public.convert_won_opportunity_to_client((select id from public.opportunities))$$,'23514','Only won opportunities can be converted.','lost opportunity cannot convert');
select lives_ok($$select public.move_opportunity((select id from public.opportunities),(select id from public.pipeline_stages where organization_id='50000000-0000-4000-8000-000000000001' and category='won'),2)$$,'opportunity becomes won');
select lives_ok($$select public.convert_won_opportunity_to_client((select id from public.opportunities))$$,'won opportunity converts');
select is((select count(*)::integer from public.clients),1,'exactly one client is created');
select is((select count(*)::integer from public.client_opportunities),1,'source opportunity is linked');
select is((select triage_status from public.leads where id='50000000-0000-4000-8000-000000000061'),'converted'::public.crm_lead_triage_status,'source lead reflects conversion');
select lives_ok($$select public.convert_won_opportunity_to_client((select id from public.opportunities))$$,'repeat conversion is idempotent');
select is((select count(*)::integer from public.clients),1,'idempotency prevents duplicate client');
select is((select count(*)::integer from public.client_opportunities),1,'idempotency prevents duplicate link');
select is((select company_id from public.clients),'50000000-0000-4000-8000-000000000041'::uuid,'conversion reuses company');
select is((select primary_contact_id from public.clients),'50000000-0000-4000-8000-000000000051'::uuid,'conversion reuses contact');
select is(((public.get_crm_dashboard(30)->>'convertedClients')::integer),1,'dashboard counts converted client');
select is(((public.get_crm_dashboard(30)->>'openPipelineValue')::numeric),0::numeric,'won value is excluded from open pipeline');
select is(((public.get_crm_dashboard(30)->>'conversionRate')::numeric),100::numeric,'conversion rate uses closed opportunities');
select is(((public.list_crm_clients('Empresa',null,null,30,1,20)->>'total')::integer),1,'client search uses related company');
select throws_ok($$insert into public.clients(organization_id,source_opportunity_id,created_by) values('50000000-0000-4000-8000-000000000001',(select id from public.opportunities),'50000000-0000-4000-8000-000000000011')$$,'42501',null,'direct insert remains denied');
reset role;
select ok(not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in('public','private') and p.prosecdef and not ('search_path=""'=any(coalesce(p.proconfig,array[]::text[])))),'security definer functions have safe search path');
select * from finish();
rollback;
