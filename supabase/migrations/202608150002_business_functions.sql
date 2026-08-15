create or replace function public.next_business_code(p_scope text, p_prefix text, p_date date default null)
returns text language plpgsql security definer set search_path = public as $$
declare v_scope text := p_scope || case when p_date is null then '' else ':' || to_char(p_date, 'YYYYMMDD') end; v_number bigint;
begin
  insert into business_counters(scope,last_value) values(v_scope,1)
  on conflict(scope) do update set last_value=business_counters.last_value+1, updated_at=now()
  returning last_value into v_number;
  return p_prefix || case when p_date is null then '' else '-' || to_char(p_date,'YYYYMMDD') end || '-' || lpad(v_number::text, 4, '0');
end $$;

create or replace function public.finalize_closing(p_closing_id uuid, p_actor_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_closing closings%rowtype; v_invalid integer; v_invoice_id uuid; v_customer uuid; v_total bigint;
begin
  select * into v_closing from closings where id=p_closing_id for update;
  if not found or v_closing.status <> 'DRAFT' then raise exception 'CLOSING_NOT_DRAFT'; end if;
  select count(*) into v_invalid from closing_packages cp join packages p on p.id=cp.package_id
  where cp.closing_id=p_closing_id and cp.is_active and (p.customer_id is null or p.status <> 'WAITING_CLOSING' or p.shipping_fee_idr < 0);
  if v_invalid > 0 or not exists(select 1 from closing_packages where closing_id=p_closing_id and is_active) then raise exception 'PACKAGE_NOT_ELIGIBLE_FOR_CLOSING'; end if;
  update closing_packages cp set actual_weight_snapshot_kg=p.actual_weight_kg, chargeable_weight_snapshot_kg=p.chargeable_weight_kg,
    shipping_fee_snapshot_idr=p.shipping_fee_idr, customer_id_snapshot=p.customer_id
  from packages p where cp.closing_id=p_closing_id and cp.is_active and p.id=cp.package_id;
  update closings set status='FINALIZED', finalized_at=now(), finalized_by=p_actor_id,
    package_count=x.c, total_actual_weight_kg=x.aw, total_chargeable_weight_kg=x.cw, total_amount_idr=x.total
  from (select count(*)::int c, coalesce(sum(actual_weight_snapshot_kg),0) aw, coalesce(sum(chargeable_weight_snapshot_kg),0) cw,
    coalesce(sum(shipping_fee_snapshot_idr),0)::bigint total from closing_packages where closing_id=p_closing_id and is_active) x where id=p_closing_id;
  for v_customer,v_total in select customer_id_snapshot,sum(shipping_fee_snapshot_idr)::bigint from closing_packages where closing_id=p_closing_id and is_active group by customer_id_snapshot loop
    insert into invoices(code,closing_id,customer_id,total_idr,balance_idr) values(next_business_code('INVOICE','INV',current_date),p_closing_id,v_customer,v_total,v_total) returning id into v_invoice_id;
    insert into invoice_items(invoice_id,package_id,description,amount_idr)
      select v_invoice_id,cp.package_id,p.tracking_number,cp.shipping_fee_snapshot_idr from closing_packages cp join packages p on p.id=cp.package_id
      where cp.closing_id=p_closing_id and cp.is_active and cp.customer_id_snapshot=v_customer;
  end loop;
  insert into package_status_history(package_id,from_status,to_status,actor_id)
    select package_id,'WAITING_CLOSING','READY_TO_SHIP',p_actor_id from closing_packages where closing_id=p_closing_id and is_active;
  update packages p set status='READY_TO_SHIP',updated_by=p_actor_id from closing_packages cp where cp.closing_id=p_closing_id and cp.is_active and cp.package_id=p.id;
  insert into audit_logs(actor_id,action,entity_type,entity_id) values(p_actor_id,'CLOSING_FINALIZED','CLOSING',p_closing_id);
  return p_closing_id;
end $$;

create or replace function public.cancel_closing(p_closing_id uuid, p_actor_id uuid, p_reason text)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_status closing_status;
begin
  if nullif(trim(p_reason),'') is null then raise exception 'CANCELLATION_REASON_REQUIRED'; end if;
  select status into v_status from closings where id=p_closing_id for update;
  if v_status not in ('DRAFT','FINALIZED') then raise exception 'CLOSING_NOT_CANCELLABLE'; end if;
  if exists(select 1 from invoices where closing_id=p_closing_id and paid_idr>0) then raise exception 'CLOSING_HAS_PAYMENTS'; end if;
  update invoices set status='VOID' where closing_id=p_closing_id;
  if v_status='FINALIZED' then
    insert into package_status_history(package_id,from_status,to_status,reason,actor_id)
      select package_id,'READY_TO_SHIP','WAITING_CLOSING',p_reason,p_actor_id from closing_packages where closing_id=p_closing_id and is_active;
    update packages p set status='WAITING_CLOSING',updated_by=p_actor_id from closing_packages cp where cp.closing_id=p_closing_id and cp.is_active and cp.package_id=p.id;
  end if;
  update closing_packages set is_active=false where closing_id=p_closing_id;
  update closings set status='CANCELLED',cancellation_reason=p_reason where id=p_closing_id;
  insert into audit_logs(actor_id,action,entity_type,entity_id,metadata) values(p_actor_id,'CLOSING_CANCELLED','CLOSING',p_closing_id,jsonb_build_object('reason',p_reason));
  return p_closing_id;
end $$;

create or replace function public.depart_shipment(p_shipment_id uuid,p_actor_id uuid,p_departure_at timestamptz)
returns uuid language plpgsql security definer set search_path=public as $$
begin
  if not exists(select 1 from shipments where id=p_shipment_id and status in ('DRAFT','READY') for update) then raise exception 'SHIPMENT_NOT_DEPARTABLE'; end if;
  if not exists(select 1 from shipment_closings where shipment_id=p_shipment_id) then raise exception 'SHIPMENT_EMPTY'; end if;
  update shipments set status='DEPARTED',departure_at=coalesce(p_departure_at,now()) where id=p_shipment_id;
  update closings c set status='IN_SHIPMENT' from shipment_closings sc where sc.shipment_id=p_shipment_id and sc.closing_id=c.id and c.status='FINALIZED';
  insert into package_status_history(package_id,from_status,to_status,actor_id)
    select cp.package_id,'READY_TO_SHIP','IN_TRANSIT',p_actor_id from shipment_closings sc join closing_packages cp on cp.closing_id=sc.closing_id and cp.is_active where sc.shipment_id=p_shipment_id;
  update packages p set status='IN_TRANSIT',updated_by=p_actor_id from shipment_closings sc join closing_packages cp on cp.closing_id=sc.closing_id and cp.is_active where sc.shipment_id=p_shipment_id and cp.package_id=p.id;
  insert into audit_logs(actor_id,action,entity_type,entity_id) values(p_actor_id,'SHIPMENT_DEPARTED','SHIPMENT',p_shipment_id);
  return p_shipment_id;
end $$;

create or replace function public.reconcile_shipment(p_shipment_id uuid,p_actor_id uuid,p_confirm_missing boolean)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_missing integer;
begin
  if not exists(select 1 from shipments where id=p_shipment_id and status in ('DEPARTED','ARRIVED') for update) then raise exception 'SHIPMENT_NOT_RECONCILABLE'; end if;
  select count(*) into v_missing from shipment_closings sc join closing_packages cp on cp.closing_id=sc.closing_id and cp.is_active
    where sc.shipment_id=p_shipment_id and not exists(select 1 from arrival_checks ac where ac.shipment_id=p_shipment_id and ac.package_id=cp.package_id);
  if v_missing>0 and not p_confirm_missing then raise exception 'MISSING_CONFIRMATION_REQUIRED'; end if;
  if v_missing>0 then
    insert into package_status_history(package_id,from_status,to_status,reason,actor_id)
      select cp.package_id,'IN_TRANSIT','MISSING','Tidak ditemukan saat rekonsiliasi',p_actor_id from shipment_closings sc join closing_packages cp on cp.closing_id=sc.closing_id and cp.is_active
      where sc.shipment_id=p_shipment_id and not exists(select 1 from arrival_checks ac where ac.shipment_id=p_shipment_id and ac.package_id=cp.package_id);
    update packages p set status='MISSING',updated_by=p_actor_id from shipment_closings sc join closing_packages cp on cp.closing_id=sc.closing_id and cp.is_active
      where sc.shipment_id=p_shipment_id and cp.package_id=p.id and not exists(select 1 from arrival_checks ac where ac.shipment_id=p_shipment_id and ac.package_id=p.id);
  end if;
  insert into package_status_history(package_id,from_status,to_status,actor_id)
    select ac.package_id,p.status,'READY_FOR_PICKUP',p_actor_id from arrival_checks ac join packages p on p.id=ac.package_id where ac.shipment_id=p_shipment_id and ac.condition='OK' and p.status<>'READY_FOR_PICKUP';
  update packages p set status=case when ac.condition='OK' then 'READY_FOR_PICKUP'::package_status else 'DAMAGED'::package_status end,updated_by=p_actor_id
    from arrival_checks ac where ac.shipment_id=p_shipment_id and ac.package_id=p.id;
  update shipments set status='RECONCILED',actual_arrival_at=coalesce(actual_arrival_at,now()) where id=p_shipment_id;
  update closings c set status='ARRIVED' from shipment_closings sc where sc.shipment_id=p_shipment_id and sc.closing_id=c.id;
  insert into audit_logs(actor_id,action,entity_type,entity_id,metadata) values(p_actor_id,'ARRIVAL_RECONCILED','SHIPMENT',p_shipment_id,jsonb_build_object('missing',v_missing));
  return p_shipment_id;
end $$;

create or replace function public.record_payment(p_invoice_id uuid,p_amount bigint,p_method payment_method,p_paid_at timestamptz,p_reference text,p_notes text,p_idempotency_key uuid,p_actor_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_invoice invoices%rowtype; v_payment_id uuid;
begin
  select id into v_payment_id from payments where created_by=p_actor_id and idempotency_key=p_idempotency_key;
  if found then return v_payment_id; end if;
  select * into v_invoice from invoices where id=p_invoice_id for update;
  if not found or v_invoice.status='VOID' then raise exception 'INVOICE_NOT_PAYABLE'; end if;
  if p_amount<=0 or p_amount>v_invoice.balance_idr then raise exception 'PAYMENT_EXCEEDS_BALANCE'; end if;
  insert into payments(invoice_id,amount_idr,method,paid_at,reference,notes,idempotency_key,created_by)
    values(p_invoice_id,p_amount,p_method,p_paid_at,p_reference,p_notes,p_idempotency_key,p_actor_id) returning id into v_payment_id;
  update invoices set paid_idr=paid_idr+p_amount,balance_idr=balance_idr-p_amount,status=case when balance_idr-p_amount=0 then 'PAID'::invoice_status else 'PARTIAL'::invoice_status end where id=p_invoice_id;
  insert into audit_logs(actor_id,action,entity_type,entity_id,metadata) values(p_actor_id,'PAYMENT_CREATED','PAYMENT',v_payment_id,jsonb_build_object('invoice_id',p_invoice_id,'amount_idr',p_amount));
  return v_payment_id;
end $$;

create or replace function public.complete_pickup(p_customer_id uuid,p_package_ids uuid[],p_picked_up_at timestamptz,p_recipient_name text,p_notes text,p_idempotency_key uuid,p_actor_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_pickup_id uuid; v_count int;
begin
  select id into v_pickup_id from pickups where created_by=p_actor_id and idempotency_key=p_idempotency_key;
  if found then return v_pickup_id; end if;
  if coalesce(array_length(p_package_ids,1),0)=0 then raise exception 'PICKUP_EMPTY'; end if;
  perform id from packages where id=any(p_package_ids) for update;
  select count(*) into v_count from packages where id=any(p_package_ids) and customer_id=p_customer_id and status='READY_FOR_PICKUP';
  if v_count<>array_length(p_package_ids,1) then raise exception 'PICKUP_PACKAGE_NOT_READY'; end if;
  insert into pickups(customer_id,picked_up_at,recipient_name,notes,idempotency_key,created_by) values(p_customer_id,p_picked_up_at,p_recipient_name,p_notes,p_idempotency_key,p_actor_id) returning id into v_pickup_id;
  insert into pickup_packages(pickup_id,package_id) select v_pickup_id,unnest(p_package_ids);
  insert into package_status_history(package_id,from_status,to_status,actor_id) select unnest(p_package_ids),'READY_FOR_PICKUP','COMPLETED',p_actor_id;
  update packages set status='COMPLETED',updated_by=p_actor_id where id=any(p_package_ids);
  insert into audit_logs(actor_id,action,entity_type,entity_id,metadata) values(p_actor_id,'PICKUP_COMPLETED','PICKUP',v_pickup_id,jsonb_build_object('package_count',v_count));
  return v_pickup_id;
end $$;

revoke all on function public.next_business_code(text,text,date) from public,anon,authenticated;
revoke all on function public.finalize_closing(uuid,uuid) from public,anon,authenticated;
revoke all on function public.cancel_closing(uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.depart_shipment(uuid,uuid,timestamptz) from public,anon,authenticated;
revoke all on function public.reconcile_shipment(uuid,uuid,boolean) from public,anon,authenticated;
revoke all on function public.record_payment(uuid,bigint,payment_method,timestamptz,text,text,uuid,uuid) from public,anon,authenticated;
revoke all on function public.complete_pickup(uuid,uuid[],timestamptz,text,text,uuid,uuid) from public,anon,authenticated;
grant execute on function public.next_business_code(text,text,date) to service_role;
grant execute on function public.finalize_closing(uuid,uuid) to service_role;
grant execute on function public.cancel_closing(uuid,uuid,text) to service_role;
grant execute on function public.depart_shipment(uuid,uuid,timestamptz) to service_role;
grant execute on function public.reconcile_shipment(uuid,uuid,boolean) to service_role;
grant execute on function public.record_payment(uuid,bigint,payment_method,timestamptz,text,text,uuid,uuid) to service_role;
grant execute on function public.complete_pickup(uuid,uuid[],timestamptz,text,text,uuid,uuid) to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
