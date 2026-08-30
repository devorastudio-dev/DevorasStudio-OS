begin;
create extension if not exists pgtap with schema extensions;
select plan(34);

select has_table('public','crm_companies','empresas comerciais existem');
select has_table('public','crm_contacts','contatos comerciais existem');
select col_type_is('public','leads','triage_status','public.crm_lead_triage_status','lead possui triagem controlada');
select has_index('public','crm_contacts','crm_contacts_one_primary_per_company_idx','contato principal possui unicidade');
select ok(not has_table_privilege('anon','public.crm_companies','SELECT'),'anon nao le empresas');
select ok(not has_table_privilege('anon','public.crm_contacts','SELECT'),'anon nao le contatos');
select ok(not has_table_privilege('anon','public.leads','SELECT'),'anon nao le leads');
select ok(not has_table_privilege('authenticated','public.crm_companies','DELETE'),'authenticated nao apaga empresas');
select ok(not has_table_privilege('authenticated','public.crm_contacts','DELETE'),'authenticated nao apaga contatos');
select ok(not has_table_privilege('authenticated','public.leads','DELETE'),'authenticated nao apaga leads');

insert into public.organizations(id,name,slug) values
('10000000-0000-4000-8000-000000000001','CRM A','devora-studio'),
('10000000-0000-4000-8000-000000000002','CRM B','crm-b');
insert into auth.users(id,email,created_at,updated_at) values
('10000000-0000-4000-8000-000000000011','writer-a@example.invalid',now(),now()),
('10000000-0000-4000-8000-000000000012','reader-a@example.invalid',now(),now()),
('10000000-0000-4000-8000-000000000013','invited-a@example.invalid',now(),now()),
('10000000-0000-4000-8000-000000000014','suspended-a@example.invalid',now(),now()),
('10000000-0000-4000-8000-000000000015','writer-b@example.invalid',now(),now());
insert into public.organization_members(id,organization_id,user_id,status) values
('10000000-0000-4000-8000-000000000021','10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000011','active'),
('10000000-0000-4000-8000-000000000022','10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000012','active'),
('10000000-0000-4000-8000-000000000023','10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000013','invited'),
('10000000-0000-4000-8000-000000000024','10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000014','suspended'),
('10000000-0000-4000-8000-000000000025','10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000015','active');
insert into public.organization_member_roles(organization_id,membership_id,role_id)
select m.organization_id,m.id,r.id from public.organization_members m join public.roles r on r.organization_id=m.organization_id and r.slug='colaborador' where m.id in ('10000000-0000-4000-8000-000000000021','10000000-0000-4000-8000-000000000025');
insert into public.roles(id,organization_id,name,slug,description) values('10000000-0000-4000-8000-000000000031','10000000-0000-4000-8000-000000000001','Leitor CRM','leitor-crm','Somente leitura de CRM.');
insert into public.role_permissions(role_id,permission_id) select '10000000-0000-4000-8000-000000000031',id from public.permissions where key='crm.read';
insert into public.organization_member_roles(organization_id,membership_id,role_id) values('10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000022','10000000-0000-4000-8000-000000000031');
insert into public.crm_companies(id,organization_id,display_name,normalized_name) values
('10000000-0000-4000-8000-000000000041','10000000-0000-4000-8000-000000000001','Empresa A','empresa a'),
('10000000-0000-4000-8000-000000000042','10000000-0000-4000-8000-000000000002','Empresa B','empresa b');
insert into public.crm_contacts(id,organization_id,company_id,full_name,is_primary) values
('10000000-0000-4000-8000-000000000051','10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000041','Contato A',true),
('10000000-0000-4000-8000-000000000052','10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000042','Contato B',true);

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000011","role":"authenticated","aal":"aal1"}',true);
select is((select count(*)::integer from public.crm_companies),0,'AAL1 nao le empresas');
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000013","role":"authenticated","aal":"aal2"}',true);
select is((select count(*)::integer from public.crm_companies),0,'convidado nao le CRM');
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000014","role":"authenticated","aal":"aal2"}',true);
select is((select count(*)::integer from public.crm_contacts),0,'suspenso nao le CRM');
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000012","role":"authenticated","aal":"aal2"}',true);
select is((select count(*)::integer from public.crm_companies),1,'crm.read le somente propria organizacao');
select throws_ok($$insert into public.crm_companies(display_name,normalized_name) values('Negada','negada')$$,'P0001','CRM operation not permitted.','crm.read nao escreve');
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000011","role":"authenticated","aal":"aal2"}',true);
select lives_ok($$insert into public.crm_companies(display_name,normalized_name,email) values('  Nova Empresa  ','ignorado','CONTATO@EXAMPLE.INVALID')$$,'crm.write cria empresa');
select is((select organization_id from public.crm_companies where display_name='Nova Empresa'),'10000000-0000-4000-8000-000000000001'::uuid,'organizacao e derivada');
select is((select created_by from public.crm_companies where display_name='Nova Empresa'),'10000000-0000-4000-8000-000000000011'::uuid,'autor e derivado');
select is((select email from public.crm_companies where display_name='Nova Empresa'),'contato@example.invalid','email e normalizado');
select throws_ok($$update public.crm_companies set organization_id='10000000-0000-4000-8000-000000000002' where display_name='Nova Empresa'$$,'P0001','CRM operation not permitted.','tenant nao pode ser trocado');
select throws_ok($$insert into public.crm_contacts(company_id,full_name,is_primary) values('10000000-0000-4000-8000-000000000042','Contato cruzado',false)$$,'23503',null,'empresa cross tenant e rejeitada');
select throws_ok($$insert into public.crm_contacts(company_id,full_name,is_primary) values('10000000-0000-4000-8000-000000000041','Outro principal',true)$$,'23505',null,'somente um contato principal ativo');
select lives_ok($$insert into public.leads(full_name,email,service_interest,message,source,landing_path,status,consent_version) values('Lead Manual','lead@example.invalid','other','Mensagem sintetica suficientemente longa.','outbound','/crm/manual','new','manual')$$,'cadastro manual funciona');
select is((select organization_id from public.leads where email='lead@example.invalid'),'10000000-0000-4000-8000-000000000001'::uuid,'lead manual recebe tenant da sessao');
select throws_ok($$update public.leads set triage_status='invalid' where email='lead@example.invalid'$$,'22P02',null,'triagem invalida rejeitada');
select throws_ok($$update public.leads set triage_status='disqualified' where email='lead@example.invalid'$$,'23514',null,'desqualificacao exige motivo');
select lives_ok($$update public.leads set assigned_membership_id='10000000-0000-4000-8000-000000000021',triage_status='in_review' where email='lead@example.invalid'$$,'responsavel ativo aceito');
select throws_ok($$update public.leads set assigned_membership_id='10000000-0000-4000-8000-000000000024' where email='lead@example.invalid'$$,'23514','Lead assignee must be an active member.','responsavel suspenso rejeitado');
select throws_ok($$update public.leads set company_id='10000000-0000-4000-8000-000000000041',contact_id='10000000-0000-4000-8000-000000000052' where email='lead@example.invalid'$$,'23514','Lead contact is not linked to the selected company.','contato cross tenant rejeitado');
select throws_ok($$delete from public.leads where email='lead@example.invalid'$$,'42501',null,'hard delete negado');
reset role;
select is((select count(*)::integer from public.audit_logs where action like 'crm.%' and metadata::text !~* 'email|phone|message'),3,'auditoria CRM e criada e sanitizada');
select ok(not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in('public','private') and p.prosecdef and not ('search_path=""'=any(coalesce(p.proconfig,array[]::text[])))),'security definer possui search_path seguro');
select lives_ok($$select public.submit_public_lead('Lead Publico','public@example.invalid',null,null,'other','Mensagem publica sintetica valida.','/',null,null,null,null,null)$$,'captacao publica C1 continua funcionando');
select is((select count(*)::integer from public.leads where email='public@example.invalid'),1,'captacao publica persiste sem duplicidade');
select * from finish();
rollback;
