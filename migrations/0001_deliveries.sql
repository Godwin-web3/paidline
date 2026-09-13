create table if not exists deliveries (
  invoice_id integer primary key,
  merchant text not null,
  kind text not null check (kind in ('link', 'text')),
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists deliveries_merchant_idx on deliveries (merchant);
