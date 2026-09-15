-- Closing Surabaya -> Closing Merauke crosscheck workflow
-- Adds package-level Merauke crosscheck metadata on closing_packages
-- and atomic RPCs for saving a Surabaya closing and for Merauke crosscheck.

create type public.merauke_check_status as enum ('PENDING','OK','DAMAGED','MISSING');

alter table public.closing_packages
  add column merauke_check_status public.merauke_check_status not null default 'PENDING',
  add column merauke_checked_at timestamptz,
  add column merauke_checked_by uuid references public.profiles(id),
  add column merauke_notes text;

create index closing_packages_merauke_status_idx
  on public.closing_packages(closing_id, merauke_check_status)
  where is_active;

-- Backfill: existing completed closings represent a successful Merauke arrival
-- where crosscheck metadata is available (snapshot + membership).
update public.closing_packages cp
set merauke_check_status = 'OK'
from public.closings c
where cp.closing_id = c.id
  and cp.is_active
  and c.status = 'COMPLETED';

create or replace function public.save_surabaya_closing(
  p_closing_date date,
  p_package_ids uuid[],
  p_notes text,
  p_actor_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_closing_id uuid;
  v_invalid integer;
  v_count integer;
  v_aw numeric(14,3);
  v_cw numeric(14,3);
  v_total bigint;
begin
  if coalesce(array_length(p_package_ids,1),0) = 0
    then raise exception 'CLOSING_EMPTY'; end if;
  select count(*) into v_invalid
  from (select unnest(p_package_ids)) d
  group by d
  having count(*) > 1;
  if v_invalid > 0 then raise exception 'CLOSING_DUPLICATE_PACKAGE'; end if;

  -- lock selected package rows
  perform 1 from packages where id = any(p_package_ids) for update;

  -- every package must be eligible: WAITING_CLOSING, has customer, not HOLD/DAMAGED/MISSING
  select count(*) into v_invalid
  from packages p
  where p.id = any(p_package_ids)
    and (
      p.status <> 'WAITING_CLOSING'
      or p.customer_id is null
      or p.status in ('HOLD','DAMAGED','MISSING')
    );
  if v_invalid > 0 then raise exception 'PACKAGE_NOT_ELIGIBLE_FOR_CLOSING'; end if;

  -- none may already belong to an active closing
  select count(*) into v_invalid
  from closing_packages cp
  where cp.package_id = any(p_package_ids) and cp.is_active;
  if v_invalid > 0 then raise exception 'PACKAGE_ALREADY_IN_CLOSING'; end if;

  insert into closings(code, closing_date, status, notes, created_by, finalized_at, finalized_by)
  values (next_business_code('CLOSING','CLS',p_closing_date), p_closing_date, 'FINALIZED', p_notes, p_actor_id, now(), p_actor_id)
  returning id into v_closing_id;

  insert into closing_packages(
    closing_id, package_id,
    actual_weight_snapshot_kg, chargeable_weight_snapshot_kg,
    shipping_fee_snapshot_idr, customer_id_snapshot
  )
  select v_closing_id, p.id, p.actual_weight_kg, p.chargeable_weight_kg,
         p.shipping_fee_idr, p.customer_id
  from packages p
  where p.id = any(p_package_ids);

  select count(*)::int, coalesce(sum(actual_weight_snapshot_kg),0),
         coalesce(sum(chargeable_weight_snapshot_kg),0),
         coalesce(sum(shipping_fee_snapshot_idr),0)::bigint
  into v_count, v_aw, v_cw, v_total
  from closing_packages where closing_id = v_closing_id and is_active;

  update closings
  set package_count = v_count,
      total_actual_weight_kg = v_aw,
      total_chargeable_weight_kg = v_cw,
      total_amount_idr = v_total
  where id = v_closing_id;

  insert into package_status_history(package_id, from_status, to_status, actor_id)
  select p.id, p.status, 'READY_TO_SHIP', p_actor_id from packages p where p.id = any(p_package_ids);
  update packages set status = 'READY_TO_SHIP', updated_by = p_actor_id where id = any(p_package_ids);

  insert into audit_logs(actor_id, action, entity_type, entity_id, metadata)
  values (p_actor_id, 'CLOSING_SURABAYA_CREATED', 'CLOSING', v_closing_id,
          jsonb_build_object('package_ids', p_package_ids));

  return v_closing_id;
end $$;

create or replace function public.mark_closing_merauke(
  p_closing_id uuid,
  p_package_ids uuid[],
  p_condition text,
  p_notes text,
  p_actor_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_closing closings%rowtype;
  v_count integer;
  v_new_status package_status;
  v_pending integer;
  v_exceptions integer;
begin
  select * into v_closing from closings where id = p_closing_id for update;
  if not found or v_closing.status in ('COMPLETED','CANCELLED')
    then raise exception 'CLOSING_NOT_CHECKABLE'; end if;
  if coalesce(array_length(p_package_ids,1),0) = 0
    then raise exception 'CROSSCHECK_EMPTY'; end if;

  -- every requested package must belong to this closing, active, and unchecked
  select count(*) into v_count
  from closing_packages
  where closing_id = p_closing_id
    and package_id = any(p_package_ids)
    and is_active
    and merauke_check_status = 'PENDING';
  if v_count <> array_length(p_package_ids,1)
    then raise exception 'PACKAGE_NOT_CHECKABLE'; end if;

  -- package must be in a valid shipping state
  select count(*) into v_count
  from packages
  where id = any(p_package_ids) and status in ('READY_TO_SHIP','IN_TRANSIT');
  if v_count <> array_length(p_package_ids,1)
    then raise exception 'PACKAGE_NOT_IN_SHIPPING'; end if;

  if p_condition = 'OK' then v_new_status := 'ARRIVED_MERAUKE';
  elsif p_condition = 'DAMAGED' then v_new_status := 'DAMAGED';
  elsif p_condition = 'MISSING' then v_new_status := 'MISSING';
  else raise exception 'INVALID_CONDITION'; end if;

  update closing_packages
  set merauke_check_status = p_condition::public.merauke_check_status,
      merauke_checked_at = now(),
      merauke_checked_by = p_actor_id,
      merauke_notes = p_notes
  where closing_id = p_closing_id and package_id = any(p_package_ids);

  insert into package_status_history(package_id, from_status, to_status, reason, actor_id)
  select p.id, p.status, v_new_status, p_notes, p_actor_id
  from packages p where p.id = any(p_package_ids);
  update packages set status = v_new_status, updated_by = p_actor_id where id = any(p_package_ids);

  insert into audit_logs(actor_id, action, entity_type, entity_id, metadata)
  values (p_actor_id,
          case when p_condition = 'OK' then 'CLOSING_MERAUKE_CHECKED' else 'CLOSING_MERAUKE_EXCEPTION' end,
          'CLOSING', p_closing_id,
          jsonb_build_object('package_ids', p_package_ids, 'condition', p_condition));

  -- auto-complete when all packages are resolved successfully
  select count(*) into v_pending
  from closing_packages
  where closing_id = p_closing_id and is_active and merauke_check_status = 'PENDING';
  select count(*) into v_exceptions
  from closing_packages
  where closing_id = p_closing_id and is_active and merauke_check_status in ('DAMAGED','MISSING');

  if v_pending = 0 and v_exceptions = 0 then
    update closing_packages cp
    set actual_weight_snapshot_kg = p.actual_weight_kg,
        chargeable_weight_snapshot_kg = p.chargeable_weight_kg,
        shipping_fee_snapshot_idr = p.shipping_fee_idr,
        customer_id_snapshot = p.customer_id
    from packages p
    where cp.closing_id = p_closing_id and cp.is_active and p.id = cp.package_id;

    update closings
    set status = 'COMPLETED',
        package_count = x.c,
        total_actual_weight_kg = x.aw,
        total_chargeable_weight_kg = x.cw,
        total_amount_idr = x.total
    from (
      select count(*)::int c,
             coalesce(sum(actual_weight_snapshot_kg),0) aw,
             coalesce(sum(chargeable_weight_snapshot_kg),0) cw,
             coalesce(sum(shipping_fee_snapshot_idr),0)::bigint total
      from closing_packages where closing_id = p_closing_id and is_active
    ) x
    where id = p_closing_id;

    insert into audit_logs(actor_id, action, entity_type, entity_id)
    values (p_actor_id, 'CLOSING_COMPLETED', 'CLOSING', p_closing_id);
  end if;

  return p_closing_id;
end $$;

revoke all on function public.save_surabaya_closing(date, uuid[], text, uuid) from public, anon, authenticated;
revoke all on function public.mark_closing_merauke(uuid, uuid[], text, text, uuid) from public, anon, authenticated;
grant execute on function public.save_surabaya_closing(date, uuid[], text, uuid) to service_role;
grant execute on function public.mark_closing_merauke(uuid, uuid[], text, text, uuid) to service_role;