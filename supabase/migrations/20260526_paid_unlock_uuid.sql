-- Paid unlock support for analysis_history UUID ids.
-- Run this in the Supabase SQL editor before enabling real payments.

alter table if exists purchases
  add column if not exists analysis_id uuid;

alter table if exists purchases
  alter column analysis_id type uuid using (
    case
      when analysis_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then analysis_id::text::uuid
      else null
    end
  );

create index if not exists purchases_order_id_idx
  on purchases(order_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'purchases_analysis_id_fkey'
  ) then
    alter table purchases
      add constraint purchases_analysis_id_fkey
      foreign key (analysis_id)
      references analysis_history(id)
      on delete set null;
  end if;
end $$;

alter table analysis_history enable row level security;

drop policy if exists "Users can update own history" on analysis_history;
create policy "Users can update own history"
  on analysis_history for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table purchases enable row level security;

drop policy if exists "Users can view own purchases" on purchases;
create policy "Users can view own purchases"
  on purchases for select
  using (auth.uid() = user_id);

drop policy if exists "Admin can view purchases" on purchases;
create policy "Admin can view purchases"
  on purchases for select
  using ((auth.jwt() ->> 'email') = 'lrinvl1203@gmail.com');

-- This keeps the current mock-payment dev flow usable.
-- Real Toss confirmations should be written by the server with SUPABASE_SERVICE_ROLE_KEY.
drop policy if exists "Users can insert own purchases" on purchases;
create policy "Users can insert own purchases"
  on purchases for insert
  with check (auth.uid() = user_id);
