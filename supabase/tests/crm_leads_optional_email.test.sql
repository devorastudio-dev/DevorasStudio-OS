begin;
create extension if not exists pgtap with schema extensions;
select plan(21);

select col_is_null('public','leads','email','lead email is nullable');
select has_function('public','update_crm_lead',array['uuid','integer','text','text','text','text','text','text','text','text','uuid','uuid','uuid','crm_lead_triage_status','text','boolean'],'safe update RPC exists');

insert into public.organizations(id,name,slug) values
('71000000-0000-4000-8000-000000000001','CRM C21 A','crm-c21-a'),
('71000000-0000-4000-8000-000000000002','CRM C21 B','crm-c21-b');
insert into auth.users(id,email,created_at,updated_at) values
('71000000-0000-4000-8000-000000000011','writer@example.invalid',now(),now()),
('71000000-0000-4000-8000-000000000012','reader@example.invalid',now(),now()),
('71000000-0000-4000-8000-000000000013','suspended@example.invalid',now(),now()),
('71000000-0000-4000-8000-000000000014','other@example.invalid',now(),now());
insert into public.organization_members(id,organization_id,user_id,status) values
('71000000-0000-4000-8000-000000000021','71000000-0000-4000-8000-000000000001','71000000-0000-4000-8000-000000000011','active'),
('71000000-0000-4000-8000-000000000022','71000000-0000-4000-8000-000000000001','71000000-0000-4000-8000-000000000012','active'),
('71000000-0000-4000-8000-000000000023','71000000-0000-4000-8000-000000000001','71000000-0000-4000-8000-000000000013','suspended'),
('71000000-0000-4000-8000-000000000024','71000000-0000-4000-8000-000000000002','71000000-0000-4000-8000-000000000014','active');
insert into public.organization_member_roles(organization_id,membership_id,role_id)
select m.organization_id,m.id,r.id from public.organization_members m join public.roles r on r.organization_id=m.organization_id and r.slug='colaborador' where m.id in ('71000000-0000-4000-8000-000000000021','71000000-0000-4000-8000-000000000024');
insert into public.roles(id,organization_id,name,slug,description) values('71000000-0000-4000-8000-000000000031','71000000-0000-4000-8000-000000000001','Leitor','leitor-c21','Leitura');
insert into public.role_permissions(role_id,permission_id) select '71000000-0000-4000-8000-000000000031',id from public.permissions where key='crm.read';
insert into public.organization_member_roles(organization_id,membership_id,role_id) values('71000000-0000-4000-8000-000000000001','71000000-0000-4000-8000-000000000022','71000000-0000-4000-8000-000000000031');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"71000000-0000-4000-8000-000000000011","role":"authenticated","aal":"aal2"}',true);
select lives_ok($$insert into public.leads(full_name,email,service_interest,message,source,landing_path,status,consent_version) values('Com Email','UPPER@EXAMPLE.INVALID','other','Contexto sintetico suficientemente longo.','outbound','/crm/manual','new','manual')$$,'manual lead with email works');
select is((select email from public.leads where full_name='Com Email'),'upper@example.invalid','email is normalized');
select lives_ok($$insert into public.leads(full_name,email,service_interest,message,source,landing_path,status,consent_version) values('Sem Email Um','', 'other','Contexto sintetico suficientemente longo.','instagram','/crm/manual','new','manual'),('Sem Email Dois',null,'other','Outro contexto sintetico suficientemente longo.','instagram','/crm/manual','new','manual')$$,'multiple manual leads without email work');
select is((select count(*)::integer from public.leads where email is null),2,'empty and null persist as null');
select lives_ok($$select public.update_crm_lead((select id from public.leads where full_name='Sem Email Um'),1,'Sem Email Um','added@example.invalid','','','other','Contexto sintetico suficientemente longo.','instagram','',null,null,null,'new','',false)$$,'writer adds email');
select is((select email from public.leads where full_name='Sem Email Um'),'added@example.invalid','added email persists');
select lives_ok($$select public.update_crm_lead((select id from public.leads where full_name='Sem Email Um'),2,'Sem Email Um','changed@example.invalid','','','other','Contexto sintetico suficientemente longo.','instagram','',null,null,null,'new','',false)$$,'writer changes email');
select lives_ok($$select public.update_crm_lead((select id from public.leads where full_name='Sem Email Um'),3,'Sem Email Um','','','','other','Contexto sintetico suficientemente longo.','instagram','',null,null,null,'new','',false)$$,'writer removes email');
select is((select email from public.leads where full_name='Sem Email Um'),null,'removed email is null');
select throws_ok($$select public.update_crm_lead((select id from public.leads where full_name='Sem Email Um'),4,'Sem Email Um','invalid','','','other','Contexto sintetico suficientemente longo.','instagram','',null,null,null,'new','',false)$$,'23514',null,'invalid email rejected');
select set_config('request.jwt.claims','{"sub":"71000000-0000-4000-8000-000000000012","role":"authenticated","aal":"aal2"}',true);
select throws_ok($$select public.update_crm_lead((select id from public.leads where full_name='Com Email'),1,'Negado','','','','other','Contexto sintetico suficientemente longo.','outbound','',null,null,null,'new','',false)$$,'P0001','CRM operation not permitted.','crm.read cannot update');
select set_config('request.jwt.claims','{"sub":"71000000-0000-4000-8000-000000000011","role":"authenticated","aal":"aal1"}',true);
select throws_ok($$select public.update_crm_lead((select id from public.leads where full_name='Com Email'),1,'Negado','','','','other','Contexto sintetico suficientemente longo.','outbound','',null,null,null,'new','',false)$$,'P0001','CRM operation not permitted.','AAL1 cannot update');
select set_config('request.jwt.claims','{"sub":"71000000-0000-4000-8000-000000000013","role":"authenticated","aal":"aal2"}',true);
select throws_ok($$select public.update_crm_lead('71000000-0000-4000-8000-000000000099',1,'Negado','','','','other','Contexto sintetico suficientemente longo.','outbound','',null,null,null,'new','',false)$$,'P0001','CRM operation not permitted.','suspended cannot update');
select set_config('request.jwt.claims','{"sub":"71000000-0000-4000-8000-000000000014","role":"authenticated","aal":"aal2"}',true);
select throws_ok($$select public.update_crm_lead((select id from public.leads where full_name='Com Email'),1,'Negado','','','','other','Contexto sintetico suficientemente longo.','outbound','',null,null,null,'new','',false)$$,'40001','Lead changed or unavailable.','cross tenant cannot update');
select set_config('request.jwt.claims','{"sub":"71000000-0000-4000-8000-000000000011","role":"authenticated","aal":"aal2"}',true);
select throws_ok($$update public.leads set organization_id='71000000-0000-4000-8000-000000000002' where full_name='Com Email'$$,'P0001','CRM operation not permitted.','organization spoof fails');
reset role;
select ok(exists(select 1 from public.audit_logs where action='crm.lead.updated' and entity_id=(select id from public.leads where full_name='Sem Email Um')),'update is audited');
select ok(not exists(select 1 from public.audit_logs where action='crm.lead.updated' and metadata::text ~* 'added@example|changed@example|Sem Email|Contexto'),'audit contains no PII');
select is((select count(*)::integer from public.leads where (coalesce(full_name,'') ilike '%Sem Email%' or coalesce(email,'') ilike '%Sem Email%' or coalesce(company,'') ilike '%Sem Email%')),2,'search finds leads without email by name');
select lives_ok($$select public.submit_public_lead('Public Lead','public-c21@example.invalid',null,null,'other','Mensagem publica sintetica valida.','/',null,null,null,null,null)$$,'public capture remains compatible');
select * from finish();
rollback;
