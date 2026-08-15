create extension if not exists pg_trgm with schema extensions;

alter table public.customers
  add column normalized_name text generated always as (
    lower(regexp_replace(btrim(name), '\s+', ' ', 'g'))
  ) stored;

create unique index customers_normalized_name_unique
  on public.customers (normalized_name);

create index customers_normalized_name_search
  on public.customers (normalized_name text_pattern_ops);

create or replace function public.search_customer_suggestions(
  p_query text,
  p_limit integer default 8
)
returns table (id uuid, code text, name text, similarity_score real)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  with input as (
    select lower(regexp_replace(btrim(p_query), '\s+', ' ', 'g')) as query
  )
  select
    customer.id,
    customer.code,
    customer.name,
    similarity(customer.normalized_name, input.query) as similarity_score
  from public.customers customer
  cross join input
  where customer.is_active
    and length(input.query) >= 2
    and (
      customer.normalized_name like '%' || input.query || '%'
      or similarity(customer.normalized_name, input.query) >= 0.24
    )
  order by
    (customer.normalized_name = input.query) desc,
    (customer.normalized_name like input.query || '%') desc,
    similarity_score desc,
    customer.name asc
  limit greatest(1, least(coalesce(p_limit, 8), 20));
$$;

revoke all on function public.search_customer_suggestions(text, integer)
  from public, anon, authenticated;
grant execute on function public.search_customer_suggestions(text, integer)
  to service_role;
