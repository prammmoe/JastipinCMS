create extension if not exists pgcrypto;

create type public.internal_user_role as enum ('OWNER','STAFF_SIDOARJO','STAFF_MERAUKE','FINANCE');
create type public.package_charge_type as enum ('WEIGHT','VOLUMETRIC','FIXED','MANUAL');
create type public.package_status as enum ('WAITING_CLOSING','READY_TO_SHIP','IN_TRANSIT','ARRIVED_MERAUKE','READY_FOR_PICKUP','COMPLETED','HOLD','DAMAGED','MISSING');
create type public.package_attachment_type as enum ('RECEIVED','ARRIVAL','DAMAGED','OTHER');
create type public.closing_status as enum ('DRAFT','FINALIZED','IN_SHIPMENT','ARRIVED','COMPLETED','CANCELLED');
create type public.shipment_status as enum ('DRAFT','READY','DEPARTED','ARRIVED','RECONCILED','COMPLETED','CANCELLED');
create type public.arrival_condition as enum ('OK','DAMAGED');
create type public.invoice_status as enum ('UNPAID','PARTIAL','PAID','VOID');
create type public.payment_method as enum ('CASH','BANK_TRANSFER','OTHER');
create type public.expense_category as enum ('SEA_FREIGHT','TRANSPORT','PACKAGING','SALARY','RENT','OPERATIONS','OTHER');

create table public.profiles (
  id uuid primary key references auth.users(id), name text not null,
  role public.internal_user_role not null, is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.business_counters (
  scope text primary key, last_value bigint not null default 0 check (last_value >= 0), updated_at timestamptz not null default now()
);
create table public.login_rate_limits (
  identifier_hash text primary key, attempts integer not null default 0,
  window_started_at timestamptz not null default now(), blocked_until timestamptz null
);
create table public.customers (
  id uuid primary key default gen_random_uuid(), code text unique not null, name text not null,
  phone text, address text, notes text, is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.rate_configs (
  id uuid primary key default gen_random_uuid(), name text not null,
  rate_per_kg_idr bigint check (rate_per_kg_idr >= 0), minimum_charge_idr bigint check (minimum_charge_idr >= 0),
  volumetric_divisor numeric(12,3) check (volumetric_divisor > 0), rounding_step_kg numeric(12,3) check (rounding_step_kg > 0),
  valid_from date, valid_until date, is_active boolean not null default true, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (valid_until is null or valid_from is null or valid_until >= valid_from)
);
create table public.packages (
  id uuid primary key default gen_random_uuid(), package_code text unique not null,
  customer_id uuid references public.customers(id), tracking_number text not null,
  normalized_tracking_number text not null, courier text, received_at timestamptz not null,
  actual_weight_kg numeric(12,3) check (actual_weight_kg > 0), length_cm numeric(12,2) check (length_cm > 0),
  width_cm numeric(12,2) check (width_cm > 0), height_cm numeric(12,2) check (height_cm > 0),
  volumetric_weight_kg numeric(12,3) check (volumetric_weight_kg >= 0), chargeable_weight_kg numeric(12,3) check (chargeable_weight_kg >= 0),
  charge_type public.package_charge_type not null, shipping_fee_idr bigint not null default 0 check (shipping_fee_idr >= 0),
  rate_config_id uuid references public.rate_configs(id), pricing_snapshot jsonb,
  status public.package_status not null default 'WAITING_CLOSING',
  duplicate_override boolean not null default false, duplicate_override_reason text,
  storage_location text, notes text, created_by uuid not null references public.profiles(id),
  updated_by uuid not null references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (not duplicate_override or nullif(trim(duplicate_override_reason), '') is not null)
);
create table public.package_attachments (
  id uuid primary key default gen_random_uuid(), package_id uuid not null references public.packages(id),
  type public.package_attachment_type not null, storage_path text unique not null, original_filename text,
  mime_type text, size_bytes bigint check (size_bytes > 0 and size_bytes <= 3145728),
  uploaded_by uuid not null references public.profiles(id), created_at timestamptz not null default now()
);
create table public.closings (
  id uuid primary key default gen_random_uuid(), code text unique not null, closing_date date not null,
  status public.closing_status not null default 'DRAFT', notes text,
  package_count integer not null default 0 check (package_count >= 0),
  total_actual_weight_kg numeric(14,3) not null default 0, total_chargeable_weight_kg numeric(14,3) not null default 0,
  total_amount_idr bigint not null default 0 check (total_amount_idr >= 0), finalized_at timestamptz,
  finalized_by uuid references public.profiles(id), cancellation_reason text,
  created_by uuid not null references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.closing_packages (
  id uuid primary key default gen_random_uuid(), closing_id uuid not null references public.closings(id),
  package_id uuid not null references public.packages(id), actual_weight_snapshot_kg numeric(12,3),
  chargeable_weight_snapshot_kg numeric(12,3), shipping_fee_snapshot_idr bigint,
  customer_id_snapshot uuid references public.customers(id), is_active boolean not null default true,
  created_at timestamptz not null default now(), unique(closing_id, package_id)
);
create unique index closing_packages_one_active_package on public.closing_packages(package_id) where is_active;
create table public.shipments (
  id uuid primary key default gen_random_uuid(), code text unique not null,
  status public.shipment_status not null default 'DRAFT', vessel_name text, departure_at timestamptz,
  estimated_arrival_at timestamptz, actual_arrival_at timestamptz, notes text,
  created_by uuid not null references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.shipment_closings (
  shipment_id uuid not null references public.shipments(id), closing_id uuid not null unique references public.closings(id),
  created_at timestamptz not null default now(), primary key(shipment_id, closing_id)
);
create table public.arrival_checks (
  id uuid primary key default gen_random_uuid(), shipment_id uuid not null references public.shipments(id),
  package_id uuid not null references public.packages(id), condition public.arrival_condition not null,
  checked_at timestamptz not null default now(), checked_by uuid not null references public.profiles(id), notes text,
  unique(shipment_id, package_id)
);
create table public.invoices (
  id uuid primary key default gen_random_uuid(), code text unique not null, closing_id uuid not null references public.closings(id),
  customer_id uuid not null references public.customers(id), status public.invoice_status not null default 'UNPAID',
  total_idr bigint not null check (total_idr >= 0), paid_idr bigint not null default 0 check (paid_idr >= 0),
  balance_idr bigint not null check (balance_idr >= 0), notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(closing_id, customer_id), check (paid_idr + balance_idr = total_idr)
);
create table public.invoice_items (
  id uuid primary key default gen_random_uuid(), invoice_id uuid not null references public.invoices(id),
  package_id uuid not null references public.packages(id), description text, amount_idr bigint not null check (amount_idr >= 0),
  created_at timestamptz not null default now(), unique(invoice_id, package_id)
);
create table public.payments (
  id uuid primary key default gen_random_uuid(), invoice_id uuid not null references public.invoices(id),
  amount_idr bigint not null check (amount_idr > 0), method public.payment_method not null,
  paid_at timestamptz not null, reference text, notes text, idempotency_key uuid not null,
  created_by uuid not null references public.profiles(id), created_at timestamptz not null default now(),
  unique(created_by, idempotency_key)
);
create table public.expenses (
  id uuid primary key default gen_random_uuid(), expense_date date not null, category public.expense_category not null,
  amount_idr bigint not null check (amount_idr > 0), closing_id uuid references public.closings(id),
  shipment_id uuid references public.shipments(id), description text not null, notes text,
  created_by uuid not null references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.pickups (
  id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.customers(id),
  picked_up_at timestamptz not null, recipient_name text, notes text, idempotency_key uuid not null,
  created_by uuid not null references public.profiles(id), created_at timestamptz not null default now(),
  unique(created_by, idempotency_key)
);
create table public.pickup_packages (
  pickup_id uuid not null references public.pickups(id), package_id uuid not null unique references public.packages(id),
  primary key(pickup_id, package_id)
);
create table public.package_status_history (
  id uuid primary key default gen_random_uuid(), package_id uuid not null references public.packages(id),
  from_status public.package_status, to_status public.package_status not null, reason text,
  actor_id uuid not null references public.profiles(id), created_at timestamptz not null default now()
);
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(), actor_id uuid references public.profiles(id),
  action text not null, entity_type text not null, entity_id uuid, metadata jsonb,
  created_at timestamptz not null default now()
);
create table public.system_settings (
  key text primary key, value jsonb not null, updated_by uuid references public.profiles(id), updated_at timestamptz not null default now()
);

create index packages_tracking_idx on public.packages(normalized_tracking_number);
create index packages_customer_idx on public.packages(customer_id);
create index packages_status_idx on public.packages(status);
create index packages_received_idx on public.packages(received_at desc);
create index customers_name_idx on public.customers(name);
create index closings_date_idx on public.closings(closing_date desc);
create index closings_status_idx on public.closings(status);
create index invoices_customer_idx on public.invoices(customer_id);
create index invoices_status_idx on public.invoices(status);
create index invoices_closing_idx on public.invoices(closing_id);
create index payments_paid_at_idx on public.payments(paid_at desc);
create index expenses_date_idx on public.expenses(expense_date desc);
create index arrival_checks_shipment_idx on public.arrival_checks(shipment_id);
create index audit_logs_created_idx on public.audit_logs(created_at desc);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
do $$ declare t text; begin foreach t in array array['profiles','customers','rate_configs','packages','closings','shipments','invoices','expenses'] loop execute format('create trigger %I_touch before update on public.%I for each row execute function public.touch_updated_at()', t, t); end loop; end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('package-evidence','package-evidence',false,3145728,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

do $$ declare t text; begin foreach t in array array['profiles','business_counters','login_rate_limits','customers','rate_configs','packages','package_attachments','closings','closing_packages','shipments','shipment_closings','arrival_checks','invoices','invoice_items','payments','expenses','pickups','pickup_packages','package_status_history','audit_logs','system_settings'] loop execute format('alter table public.%I enable row level security', t); execute format('revoke all on table public.%I from anon, authenticated', t); end loop; end $$;
revoke all on table storage.objects from anon, authenticated;

