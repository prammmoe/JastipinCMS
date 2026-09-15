-- Dashboard performance indexes.
-- Audit: packages_received_date_idx (packages.received_date),
-- packages_status_idx, closings_status_idx, closings_date_idx and the partial
-- closing_packages_merauke_status_idx already cover the dashboard queries, so
-- only closings.finalized_at (used by the aging "Menunggu Merauke" query) is missing.

create index closings_finalized_at_idx on public.closings(finalized_at);
