-- Users/Tenants
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamp with time zone default now()
);

-- Tokens for Fintoc API
create table token (
  id text primary key,
  token text not null
);

-- Fintoc Links (bank connections)
create table fintoc_links (
  id text primary key,
  user_id uuid not null references users(id) on delete cascade,
  token_id text references token(id) on delete set null,
  holder_id text not null,
  username text,
  holder_type text,
  institution_id text not null,
  institution_name text,
  institution_country text,
  mode text,
  active boolean default true,
  status text,
  refresh_status text,
  last_refreshed_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  constraint unique_user_link unique(user_id, id)
);

-- Bank Accounts
create table fintoc_accounts (
  id text primary key,
  link_id text not null references fintoc_links(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  account_type text,
  account_number text,
  name text,
  official_name text,
  holder_name text,
  currency text not null,
  balance_available numeric,
  balance_current numeric,
  balance_limit numeric,
  refreshed_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  
  constraint unique_user_account unique(user_id, id)
);

-- Counterparties (who sent/received money)
create table counterparties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  holder_id text,
  holder_name text,
  created_at timestamp with time zone default now(),
  
  constraint unique_counterparty unique(user_id, holder_id)
);

-- Movements/Transactions
create table movements (
  id text primary key,
  account_id text not null references fintoc_accounts(id) on delete cascade,
  link_id text not null references fintoc_links(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  description text,
  amount numeric not null,
  currency text not null,
  movement_type text,
  status text,
  pending boolean default false,
  post_date date not null,
  transaction_date date,
  comment text,
  reference_id text,
  counterparty_id uuid references counterparties(id) on delete set null,
  counterparty_type text,
  created_at timestamp with time zone default now(),
  
  constraint unique_movement unique(user_id, id)
);

-- Enable RLS
alter table users enable row level security;
alter table token enable row level security;
alter table fintoc_links enable row level security;
alter table fintoc_accounts enable row level security;
alter table counterparties enable row level security;
alter table movements enable row level security;

-- RLS Policies
create policy "users_select" on users for select using (id = auth.uid());
create policy "token_select" on token for select using (
  exists (
    select 1 from fintoc_links
    where fintoc_links.token_id = token.id
    and fintoc_links.user_id = auth.uid()
  )
);
create policy "links_select" on fintoc_links for select using (user_id = auth.uid());
create policy "accounts_select" on fintoc_accounts for select using (user_id = auth.uid());
create policy "counterparties_select" on counterparties for select using (user_id = auth.uid());
create policy "movements_select" on movements for select using (user_id = auth.uid());

