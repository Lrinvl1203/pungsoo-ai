-- Refund timeline support.
-- Keeps the refund request row for operator audit, while the customer UI
-- can show a single order card with request and completion timestamps.

alter table if exists purchases
  add column if not exists refunded_at timestamptz;

create index if not exists purchases_refunded_at_idx
  on purchases(refunded_at);
