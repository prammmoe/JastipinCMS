-- Business seed data only. Create auth users with scripts/bootstrap-owner.ts.
insert into public.rate_configs(name,rate_per_kg_idr,minimum_charge_idr,volumetric_divisor,rounding_step_kg,notes)
values ('Tarif Reguler', 17000, 10000, 6000, 0.5, 'Tarif contoh development')
on conflict do nothing;

