-- OMH: only the admin e-mails listed in public.admins can change the shop.
-- Run once in Supabase > SQL Editor, AFTER schema.sql.
-- 1) Replace ADMIN@EMAIL.COM below with the e-mail of the admin account (Authentication > Users).
-- 2) Run. Safe to run again.

create table if not exists public.admins (
  email text primary key
);
alter table public.admins enable row level security;  -- no policy: invisible to visitors

insert into public.admins (email) values (lower('ADMIN@EMAIL.COM')) on conflict do nothing;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where email = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;

-- Replace the "any signed-in user" rules with "admin only".
drop policy if exists "admin categories" on public.categories;
create policy "admin categories" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "read active products" on public.products;
create policy "read active products" on public.products for select using (active or public.is_admin());
drop policy if exists "admin products" on public.products;
create policy "admin products" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "read approved reviews" on public.reviews;
create policy "read approved reviews" on public.reviews for select using (approved or public.is_admin());
drop policy if exists "admin reviews" on public.reviews;
create policy "admin reviews" on public.reviews for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin delete reviews" on public.reviews;
create policy "admin delete reviews" on public.reviews for delete to authenticated using (public.is_admin());

drop policy if exists "admin orders" on public.orders;
create policy "admin orders" on public.orders for select to authenticated using (public.is_admin());
drop policy if exists "admin update orders" on public.orders;
create policy "admin update orders" on public.orders for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin delete orders" on public.orders;
create policy "admin delete orders" on public.orders for delete to authenticated using (public.is_admin());

drop policy if exists "admin settings" on public.settings;
create policy "admin settings" on public.settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin upload media" on storage.objects;
create policy "admin upload media" on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
drop policy if exists "admin update media" on storage.objects;
create policy "admin update media" on storage.objects for update to authenticated using (bucket_id = 'media' and public.is_admin());
drop policy if exists "admin delete media" on storage.objects;
create policy "admin delete media" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.is_admin());
