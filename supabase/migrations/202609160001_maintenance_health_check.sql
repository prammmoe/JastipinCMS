create extension if not exists pg_cron;

-- Named jobs overwrite their previous configuration, keeping this migration
-- safe to reapply without creating duplicate scheduled work.
select cron.schedule(
  'maintenance-health-check',
  '0 0,8,16 * * *',
  $$select now();$$
);
