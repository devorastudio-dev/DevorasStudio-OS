begin;
select plan(19);

create extension if not exists pgtap with schema extensions;

insert into auth.users (id, email, created_at, updated_at) values
  ('10000000-0000-0000-0000-000000000011', 'lead-reader@example.invalid', now(), now()),
  ('10000000-0000-0000-0000-000000000012', 'outsider@example.invalid', now(), now());

insert into public.organizations (id, name, slug)
values ('10000000-0000-0000-0000-000000000001', 'Devora Studio', 'devora-studio'),
       ('10000000-0000-0000-0000-000000000002', 'Other', 'other');

insert into public.organization_members (organization_id, user_id, status)
values ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000011', 'active');

insert into public.organization_member_roles (organization_id, membership_id, role_id)
select m.organization_id, m.id, r.id from public.organization_members m
join public.roles r on r.organization_id = m.organization_id and r.slug = 'colaborador'
where m.user_id = '10000000-0000-0000-0000-000000000011';

set local role anon;
select is(public.submit_public_lead('Pessoa Ficticia', 'LEAD@example.invalid', '', '', 'automation', 'Mensagem sintetica suficientemente longa para contato.', '/', 'google', null, null, null, null), 'persisted', 'RPC confirms persistence');
select throws_ok($$ insert into public.leads (organization_id, full_name, email, service_interest, message, submission_fingerprint) values ('10000000-0000-0000-0000-000000000001', 'Direct Insert', 'direct@example.com', 'other', 'Mensagem suficientemente longa para contato.', md5('x')) $$, '42501', null, 'anonymous direct insert is denied');
select throws_ok($$ select * from public.leads $$, '42501', 'permission denied for table leads', 'anonymous cannot read leads');
reset role;

select is((select count(*) from public.leads where email = 'lead@example.invalid'), 1::bigint, 'RPC normalizes and stores exactly one lead');
select is((select organization_id from public.leads where email = 'lead@example.invalid'), '10000000-0000-0000-0000-000000000001'::uuid, 'RPC resolves the fixed organization');
select is((select status from public.leads where email = 'lead@example.invalid'), 'new', 'RPC controls workflow status');

set local role anon;
select is(public.submit_public_lead('Pessoa Ficticia', 'lead@example.invalid', '', '', 'automation', 'Mensagem sintetica suficientemente longa para contato.', '/', null, null, null, null, null), 'duplicate', 'duplicate returns a verified outcome');
reset role;
select is((select count(*) from public.leads where email = 'lead@example.invalid'), 1::bigint, 'duplicate submission is idempotent');

set local role anon;
select is(public.submit_public_lead('Pessoa Ficticia', 'lead@example.invalid', '', '', 'automation', 'Segunda mensagem sintetica suficientemente longa.', '/', null, null, null, null, null), 'persisted', 'second distinct message persists');
select is(public.submit_public_lead('Pessoa Ficticia', 'lead@example.invalid', '', '', 'automation', 'Terceira mensagem sintetica suficientemente longa.', '/', null, null, null, null, null), 'persisted', 'third distinct message persists');
select is(public.submit_public_lead('Pessoa Ficticia', 'lead@example.invalid', '', '', 'automation', 'Quarta mensagem sintetica suficientemente longa.', '/', null, null, null, null, null), 'rate_limited', 'fourth message is rate limited');
reset role;
select is((select count(*) from public.leads where email = 'lead@example.invalid'), 3::bigint, 'rate limit does not insert another lead');

update public.organizations set slug = 'temporarily-unavailable' where id = '10000000-0000-0000-0000-000000000001';
set local role anon;
select is(public.submit_public_lead('Pessoa Ficticia', 'other@example.invalid', '', '', 'automation', 'Mensagem sintetica suficientemente longa.', '/', null, null, null, null, null), 'organization_not_found', 'missing destination is explicit');
reset role;
update public.organizations set slug = 'devora-studio' where id = '10000000-0000-0000-0000-000000000001';

select throws_ok($$ insert into public.leads (organization_id, full_name, email, service_interest, message, submission_fingerprint) values ('10000000-0000-0000-0000-000000000001', 'A', 'invalid', 'unknown', 'short', md5('x')) $$, '23514', null, 'database constraints reject invalid payload');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000012","role":"authenticated","aal":"aal2"}',true);
select is((select count(*) from public.leads), 0::bigint, 'user without membership cannot read leads');

select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000011","role":"authenticated","aal":"aal2"}',true);
select is((select count(*) from public.leads), 3::bigint, 'member with crm.read reads organization leads');
select throws_ok($$ delete from public.leads $$, '42501', null, 'authenticated users cannot delete leads');
select lives_ok($$ update public.leads set triage_status = 'in_review' $$, 'crm.write gerencia triagem sem alterar a captura C1');

select ok(not has_table_privilege('anon', 'public.leads', 'INSERT'), 'anon has no direct insert grant');

select * from finish();
rollback;
