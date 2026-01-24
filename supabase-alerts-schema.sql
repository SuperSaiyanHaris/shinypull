-- Price Alerts Table
-- This table stores user-defined price alerts for Pokemon cards

create table if not exists price_alerts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  card_id text not null,
  card_name text not null,
  card_image text,
  card_set text,
  target_price decimal(10, 2) not null,
  alert_type text check (alert_type in ('below', 'above')) not null,
  is_active boolean default true,
  last_triggered_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add indexes for performance
create index if not exists price_alerts_user_id_idx on price_alerts(user_id);
create index if not exists price_alerts_card_id_idx on price_alerts(card_id);
create index if not exists price_alerts_is_active_idx on price_alerts(is_active);

-- Enable Row Level Security
alter table price_alerts enable row level security;

-- RLS Policies
-- Users can only see their own alerts
create policy "Users can view their own alerts"
  on price_alerts for select
  using (auth.uid() = user_id);

-- Users can create their own alerts
create policy "Users can create their own alerts"
  on price_alerts for insert
  with check (auth.uid() = user_id);

-- Users can update their own alerts
create policy "Users can update their own alerts"
  on price_alerts for update
  using (auth.uid() = user_id);

-- Users can delete their own alerts
create policy "Users can delete their own alerts"
  on price_alerts for delete
  using (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
create or replace function update_price_alerts_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to call the function
create trigger price_alerts_updated_at
  before update on price_alerts
  for each row
  execute function update_price_alerts_updated_at();
