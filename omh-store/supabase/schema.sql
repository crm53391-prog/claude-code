-- OMH: database for Supabase.
-- Run this whole file once in Supabase: SQL Editor > New query > paste > Run.
-- Then create the admin account in Authentication > Users > Add user,
-- and turn off public sign-ups in Authentication > Providers > Email ("Allow new users to sign up").

create extension if not exists pgcrypto;

-- ---------- tables ----------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_url text,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  old_price numeric(10,2) check (old_price is null or old_price >= 0),
  images text[] not null default '{}',
  sizes jsonb not null default '[]',   -- [{"size":"42","stock":3}, ...]
  colors jsonb not null default '[]',  -- [{"name":"Noir","hex":"#000000"}, ...]
  is_new boolean not null default true,
  active boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  author text not null check (char_length(author) between 1 and 60),
  rating int not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 1000),
  approved boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  items jsonb not null,
  total numeric(10,2) not null,
  customer_name text,
  customer_phone text,
  city text,
  address text,
  status text not null default 'new' check (status in ('new','confirmed','shipped','delivered','cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  whatsapp text default '',
  city text default '',
  announcement text default '',
  hero_url text default '',
  hero_type text default 'image' check (hero_type in ('image','video')),
  hero_title text default 'OMH',
  hero_text text default '',
  free_delivery_from numeric(10,2) default 0,
  instagram text default ''
);
insert into public.settings (id) values (1) on conflict (id) do nothing;

-- ---------- row level security ----------
-- Visitors can read the shop, post a review and place an order.
-- Only a signed-in user (the admin) can change anything else.
alter table public.categories enable row level security;
alter table public.products   enable row level security;
alter table public.reviews    enable row level security;
alter table public.orders     enable row level security;
alter table public.settings   enable row level security;

create policy "read categories" on public.categories for select using (true);
create policy "admin categories" on public.categories for all to authenticated using (true) with check (true);

create policy "read active products" on public.products for select using (active or auth.role() = 'authenticated');
create policy "admin products" on public.products for all to authenticated using (true) with check (true);

create policy "read approved reviews" on public.reviews for select using (approved or auth.role() = 'authenticated');
create policy "post review" on public.reviews for insert to anon, authenticated with check (true);
create policy "admin reviews" on public.reviews for update to authenticated using (true) with check (true);
create policy "admin delete reviews" on public.reviews for delete to authenticated using (true);

create policy "place order" on public.orders for insert to anon, authenticated with check (status = 'new');
create policy "admin orders" on public.orders for select to authenticated using (true);
create policy "admin update orders" on public.orders for update to authenticated using (true) with check (true);
create policy "admin delete orders" on public.orders for delete to authenticated using (true);

create policy "read settings" on public.settings for select using (true);
create policy "admin settings" on public.settings for update to authenticated using (true) with check (true);

-- ---------- storage for photos and the hero video ----------
insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict (id) do nothing;
create policy "read media" on storage.objects for select using (bucket_id = 'media');
create policy "admin upload media" on storage.objects for insert to authenticated with check (bucket_id = 'media');
create policy "admin update media" on storage.objects for update to authenticated using (bucket_id = 'media');
create policy "admin delete media" on storage.objects for delete to authenticated using (bucket_id = 'media');
