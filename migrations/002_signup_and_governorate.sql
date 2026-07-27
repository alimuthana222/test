-- nabda clinic dashboard — signup, governorate, avatars
-- Run this once against your Supabase project (SQL editor).

-- 1) Add governorate to clinics + staff (nullable, safe for existing rows)
alter table public.clinics add column if not exists governorate text;
alter table public.staff   add column if not exists governorate text;
alter table public.staff   add column if not exists email text;

-- 2) Auto-provision a clinic + admin staff row when a doctor signs up.
--    The web signup passes clinic + doctor info in raw_user_meta_data.
create or replace function public.handle_new_clinic_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clinic_id uuid;
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  if v_meta ? 'clinic_name' then
    insert into public.clinics (name, address, phone, governorate, subscription_tier)
    values (
      v_meta->>'clinic_name',
      v_meta->>'clinic_address',
      v_meta->>'phone',
      v_meta->>'governorate',
      'free'
    )
    returning id into v_clinic_id;

    insert into public.staff (
      clinic_id, role, full_name, specialty, auth_user_id,
      is_active, governorate, email
    ) values (
      v_clinic_id,
      'admin',
      coalesce(v_meta->>'full_name', new.email),
      v_meta->>'specialty',
      new.id,
      true,
      v_meta->>'governorate',
      new.email
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_nabda on auth.users;
create trigger on_auth_user_created_nabda
  after insert on auth.users
  for each row execute function public.handle_new_clinic_signup();

-- 3) Avatars bucket (public read, owner write)
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'nabda avatars read') then
    create policy "nabda avatars read" on storage.objects
      for select using (bucket_id = 'avatars');
  end if;
  if not exists (select 1 from pg_policies where policyname = 'nabda avatars insert') then
    create policy "nabda avatars insert" on storage.objects
      for insert to authenticated
      with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'nabda avatars update') then
    create policy "nabda avatars update" on storage.objects
      for update to authenticated
      using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
  end if;
end $$;

-- 4) Let clinic admins update their own clinic + staff rows from the web dashboard
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'nabda staff self update') then
    create policy "nabda staff self update" on public.staff
      for update to authenticated
      using (auth_user_id = auth.uid())
      with check (auth_user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'nabda clinic admin update') then
    create policy "nabda clinic admin update" on public.clinics
      for update to authenticated
      using (exists (
        select 1 from public.staff s
        where s.clinic_id = clinics.id
          and s.auth_user_id = auth.uid()
          and s.role = 'admin'
      ));
  end if;
end $$;