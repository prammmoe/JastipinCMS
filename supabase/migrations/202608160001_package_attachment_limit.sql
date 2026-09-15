create or replace function public.enforce_package_attachment_limit()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.package_id::text, 0));
  if (
    select count(*)
    from public.package_attachments
    where package_id = new.package_id
  ) >= 2 then
    raise exception 'PACKAGE_ATTACHMENT_LIMIT';
  end if;
  return new;
end;
$$;

create trigger package_attachments_limit
before insert or update of package_id on public.package_attachments
for each row execute function public.enforce_package_attachment_limit();
