-- Distinguish interior-space and external-site products without changing
-- the existing payment-provider order_type contract.

alter table if exists purchases
  add column if not exists analysis_scope text,
  add column if not exists product_sku text;

alter table if exists purchases
  drop constraint if exists purchases_analysis_scope_check;

alter table if exists purchases
  add constraint purchases_analysis_scope_check
  check (analysis_scope is null or analysis_scope in ('internal', 'external'));

alter table if exists purchases
  drop constraint if exists purchases_product_sku_check;

alter table if exists purchases
  add constraint purchases_product_sku_check
  check (
    product_sku is null
    or product_sku ~ '^(internal|external)_(report|remedy|zodiac|frame|object)$'
  );

create index if not exists purchases_product_sku_idx
  on purchases(product_sku);

