do $$
begin
  if exists (select 1 from public.profiles where role::text = 'FINANCE') then
    raise exception 'FINANCE_ROLE_MIGRATION_REQUIRED';
  end if;
end;
$$;

create type public.internal_user_role_v2 as enum ('ADMIN','STAFF_SIDOARJO','STAFF_MERAUKE');

alter table public.profiles
  alter column role type public.internal_user_role_v2
  using (case role::text when 'OWNER' then 'ADMIN' else role::text end)::public.internal_user_role_v2;

drop type public.internal_user_role;
alter type public.internal_user_role_v2 rename to internal_user_role;

alter table public.packages
  add column received_date date,
  add column received_time time without time zone;

update public.packages
set received_date = (received_at at time zone 'Asia/Jakarta')::date,
    received_time = (received_at at time zone 'Asia/Jakarta')::time(0)
where received_date is null;

alter table public.packages alter column received_date set not null;

create index packages_received_date_idx
  on public.packages(received_date desc, received_time desc nulls last);
