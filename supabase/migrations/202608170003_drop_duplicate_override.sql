-- Duplicate tracking numbers are no longer allowed, so the duplicate override
-- columns and their check constraint are removed.

alter table public.packages
  drop column duplicate_override cascade,
  drop column duplicate_override_reason;