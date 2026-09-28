create table public.administradoras (
    user_id uuid primary key references auth.users(id) on delete cascade
);

create table public.historias (
    id uuid primary key default gen_random_uuid(),
    titulo text not null check (char_length(trim(titulo)) between 1 and 90),
    texto text not null check (char_length(trim(texto)) between 1 and 2000),
    imagen_path text not null,
    creado_en timestamptz not null default now()
);

alter table public.administradoras enable row level security;
alter table public.historias enable row level security;

grant select on public.administradoras to authenticated;
grant select on public.historias to anon, authenticated;
grant insert, delete on public.historias to authenticated;

create policy "Administrators can read their own access"
on public.administradoras for select to authenticated
using (
    user_id = auth.uid()
    and lower(coalesce(auth.jwt() ->> 'email', '')) = 'dichuchis@gmail.com'
);

create policy "Anyone can read published stories"
on public.historias for select to anon, authenticated
using (true);

create policy "Only administrators can publish stories"
on public.historias for insert to authenticated
with check (
    exists (select 1 from public.administradoras where user_id = auth.uid())
    and lower(coalesce(auth.jwt() ->> 'email', '')) = 'dichuchis@gmail.com'
);

create policy "Only administrators can delete stories"
on public.historias for delete to authenticated
using (
    exists (select 1 from public.administradoras where user_id = auth.uid())
    and lower(coalesce(auth.jwt() ->> 'email', '')) = 'dichuchis@gmail.com'
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('historias', 'historias', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Anyone can view story images"
on storage.objects for select to anon, authenticated
using (bucket_id = 'historias');

create policy "Only administrators can upload story images"
on storage.objects for insert to authenticated
with check (
    bucket_id = 'historias'
    and exists (select 1 from public.administradoras where user_id = auth.uid())
    and lower(coalesce(auth.jwt() ->> 'email', '')) = 'dichuchis@gmail.com'
);

create policy "Only administrators can delete story images"
on storage.objects for delete to authenticated
using (
    bucket_id = 'historias'
    and exists (select 1 from public.administradoras where user_id = auth.uid())
    and lower(coalesce(auth.jwt() ->> 'email', '')) = 'dichuchis@gmail.com'
);

insert into public.administradoras (user_id)
select id from auth.users where lower(email) = 'dichuchis@gmail.com'
on conflict (user_id) do nothing;