-- Flexio · 22 nov 2026
-- 1) Compartir con cualquier cuenta RAIKI (antes solo con personas de "Mi equipo";
--    como nadie estaba en un equipo, todo compartido fallaba con "no_es_del_equipo").
-- 2) Nube de Flexio: respaldo privado de cada cuenta (tabla flexio_respaldos +
--    archivos en el depósito "respaldos", carpeta <correo>/flexio/<modelo>/<versión>/).

create or replace function public.flexio_compartir(p_modelo text, p_nombre text, p_version text, p_para text[])
 returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare v_yo text := lower(auth.jwt() ->> 'email'); p text; v_para text[] := '{}'; r public.flexio_compartidos;
begin
  if v_yo is null then raise exception 'sin sesión'; end if;
  foreach p in array coalesce(p_para, '{}') loop
    p := lower(trim(p));
    if p = '' or p = v_yo or p = any (v_para) then continue; end if;
    if not exists (select 1 from auth.users u where lower(u.email) = p) then
      raise exception 'sin_cuenta:%', p;
    end if;
    v_para := array_append(v_para, p);
  end loop;
  if array_length(v_para, 1) is null then raise exception 'sin_personas'; end if;
  insert into public.flexio_compartidos as c (dueno, modelo_id, nombre, version, actualizado, editado_por, para)
  values (v_yo, p_modelo, p_nombre, p_version, now(), v_yo, v_para)
  on conflict (dueno, modelo_id) do update set para = excluded.para, nombre = excluded.nombre,
    version = coalesce(excluded.version, c.version), actualizado = case when excluded.version is distinct from c.version then now() else c.actualizado end,
    editado_por = case when excluded.version is distinct from c.version then v_yo else c.editado_por end
  returning * into r;
  return to_jsonb(r);
end; $function$;

-- Personas sugeridas al compartir: el equipo + con quien ya compartí o quien me compartió
create or replace function public.flexio_companeros()
 returns jsonb language plpgsql stable security definer set search_path to ''
as $function$
declare v_yo text := lower(auth.jwt() ->> 'email'); v_eq text;
begin
  v_eq := public.flexio_equipo_de(v_yo);
  return coalesce((select jsonb_agg(e order by e) from (
      select v_eq as e where v_eq <> v_yo
      union select m.miembro from public.equipo_miembros m where m.dueno = v_eq and m.miembro <> v_yo
      union select unnest(c.para) from public.flexio_compartidos c where c.dueno = v_yo
      union select c.dueno from public.flexio_compartidos c where v_yo = any (c.para)
      union select unnest(c.para) from public.flexio_compartidos c where v_yo = any (c.para)
    ) t where e is not null and e <> v_yo), '[]'::jsonb);
end; $function$;

create table if not exists public.flexio_respaldos (
  dueno text not null default lower(auth.jwt() ->> 'email'),
  modelo_id text not null,
  nombre text,
  version text not null,
  bytes bigint,
  actualizado timestamptz not null default now(),
  primary key (dueno, modelo_id)
);
alter table public.flexio_respaldos enable row level security;
create policy "flexio nube: dueño ve" on public.flexio_respaldos for select to authenticated using (dueno = (select lower(auth.jwt() ->> 'email')));
create policy "flexio nube: dueño crea" on public.flexio_respaldos for insert to authenticated with check (dueno = (select lower(auth.jwt() ->> 'email')));
create policy "flexio nube: dueño cambia" on public.flexio_respaldos for update to authenticated using (dueno = (select lower(auth.jwt() ->> 'email'))) with check (dueno = (select lower(auth.jwt() ->> 'email')));
create policy "flexio nube: dueño borra" on public.flexio_respaldos for delete to authenticated using (dueno = (select lower(auth.jwt() ->> 'email')));
grant select, insert, update, delete on public.flexio_respaldos to authenticated;
