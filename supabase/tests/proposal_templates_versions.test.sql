begin;
select plan(34);
select has_table('public','proposal_templates','templates exist');
select has_table('public','proposal_template_sections','template sections exist');
select has_table('public','proposal_template_items','template items exist');
select has_table('public','proposal_template_versions','template versions exist');
select has_table('public','proposal_versions','proposal versions exist');
select has_column('public','proposals','source_template_id','proposal keeps template origin');
select has_column('public','proposals','source_template_version','proposal keeps template version');
select has_function('public','create_proposal_template',array['text','text'],'template creation is exposed');
select has_function('public','create_proposal_from_template',array['uuid','uuid','text','date','uuid'],'atomic proposal copy is exposed');
select has_function('public','create_proposal_version',array['uuid','uuid'],'proposal snapshot is exposed');
select has_function('public','create_proposal_template_version',array['uuid','uuid'],'template snapshot is exposed');
select isnt_empty($$select 1 from pg_class where oid='public.proposal_templates'::regclass and relrowsecurity$$,'templates use RLS');
select isnt_empty($$select 1 from pg_class where oid='public.proposal_versions'::regclass and relrowsecurity$$,'versions use RLS');
select isnt_empty($$select 1 from pg_constraint where conname='proposal_versions_number_key'$$,'proposal version number is unique');
select isnt_empty($$select 1 from pg_constraint where conname='proposal_versions_request_key'$$,'proposal requests are idempotent');
select is_empty($$select 1 from information_schema.role_table_grants where table_schema='public' and table_name='proposal_versions' and grantee='authenticated' and privilege_type in('INSERT','UPDATE','DELETE')$$,'versions are append-only to clients');
select is_empty($$select 1 from information_schema.role_table_grants where table_schema='public' and table_name='proposal_template_versions' and grantee='authenticated' and privilege_type in('INSERT','UPDATE','DELETE')$$,'template versions are append-only to clients');
select isnt_empty($$select 1 from information_schema.role_routine_grants where routine_schema='public' and routine_name='create_proposal_version' and grantee='authenticated'$$,'authenticated can execute version RPC');

insert into public.organizations(id,name,slug) values
('70000000-0000-4000-8000-000000000001','D5 Gate','d5-gate');
insert into auth.users(id,email,created_at,updated_at) values
('70000000-0000-4000-8000-000000000011','writer-d5@example.invalid',now(),now());
insert into public.organization_members(id,organization_id,user_id,status) values
('70000000-0000-4000-8000-000000000021','70000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000011','active');
insert into public.organization_member_roles(organization_id,membership_id,role_id)
select m.organization_id,m.id,r.id from public.organization_members m join public.roles r
on r.organization_id=m.organization_id and r.slug='colaborador'
where m.id='70000000-0000-4000-8000-000000000021';
insert into public.leads(id,organization_id,full_name,email,service_interest,message,source,landing_path,status,consent_version) values
('70000000-0000-4000-8000-000000000041','70000000-0000-4000-8000-000000000001','Cliente ficticio','cliente-d5@example.invalid','other','Contexto exclusivamente ficticio para o gate D5.','outbound','/crm/manual','new','manual');
insert into public.opportunities(id,organization_id,lead_id,stage_id,title,created_by,updated_by)
select '70000000-0000-4000-8000-000000000051','70000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000041',id,'Oportunidade ficticia','70000000-0000-4000-8000-000000000011','70000000-0000-4000-8000-000000000011'
from public.pipeline_stages where organization_id='70000000-0000-4000-8000-000000000001' and position=1;
insert into public.clients(id,organization_id,source_lead_id,source_opportunity_id,created_by) values
('70000000-0000-4000-8000-000000000061','70000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000041','70000000-0000-4000-8000-000000000051','70000000-0000-4000-8000-000000000011');
insert into public.client_opportunities(client_id,organization_id,opportunity_id,linked_by) values
('70000000-0000-4000-8000-000000000061','70000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000051','70000000-0000-4000-8000-000000000011');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"70000000-0000-4000-8000-000000000011","role":"authenticated","aal":"aal2"}',true);
select lives_ok($$select public.create_proposal_template('Template gate','Somente dados ficticios')$$,'writer creates template');
select lives_ok($$select public.save_proposal_template_section((select id from public.proposal_templates),null,'scope','Escopo','Entrega ficticia',true)$$,'template section persists');
select lives_ok($$select public.save_proposal_template_item((select id from public.proposal_templates),null,null,'Servico ficticio','Descricao ficticia',1,'project',1500)$$,'template item persists');
select lives_ok($$select public.create_proposal_template_version((select id from public.proposal_templates),'70000000-0000-4000-8000-000000000071')$$,'template version persists');
select lives_ok($$select public.create_proposal('70000000-0000-4000-8000-000000000061',null,'Proposta em branco',current_date+30)$$,'blank proposal without opportunity persists');
select lives_ok($$select public.create_proposal_from_template('70000000-0000-4000-8000-000000000061','70000000-0000-4000-8000-000000000051','Proposta por template',current_date+30,(select id from public.proposal_templates))$$,'proposal with linked opportunity and template persists');
select is((select count(*)::integer from public.proposals),2,'both creation paths persist exactly once');
select is(
  (select count(*)::integer from public.proposal_sections where proposal_id=(select id from public.proposals where title='Proposta por template')),
  (select count(*)::integer from public.proposal_template_sections where template_id=(select id from public.proposal_templates)),
  'all template sections are copied'
);
select is((select count(*)::integer from public.proposal_items where proposal_id=(select id from public.proposals where title='Proposta por template')),1,'template items are copied');
select is((select source_template_version from public.proposals where title='Proposta por template'),1,'template source version is frozen');
select matches((select proposal_number from public.proposals where title='Proposta em branco'),'^DEV-[0-9]{4}-0001$','first number uses expected sequence');
select matches((select proposal_number from public.proposals where title='Proposta por template'),'^DEV-[0-9]{4}-0002$','second number increments without collision');
select throws_ok($$select public.create_proposal('70000000-0000-4000-8000-000000000061',gen_random_uuid(),'Combinacao invalida',null)$$,'23503','Opportunity is not linked to client.','incompatible opportunity is rejected safely');
select is((select count(*)::integer from public.proposals),2,'failed creation leaves no partial proposal');
select lives_ok($$select public.create_proposal_version((select id from public.proposals where title='Proposta por template'),'70000000-0000-4000-8000-000000000072')$$,'proposal version is generated');
select is((select snapshot->'proposal'->>'title' from public.proposal_versions),'Proposta por template','version snapshot freezes proposal data');
select * from finish();
rollback;
