-- Bastion worlds: forts other players join with their code (src/game/74-siege-mp.js).
-- Applied to the game's Supabase project as migration "bastion_worlds". Only these functions touch the table.
create table if not exists public.bastion_worlds (
  code text primary key,
  owner uuid not null references public.saves (id) on delete cascade,
  fort jsonb not null,
  wave integer not null default 1,
  updated_at timestamptz not null default now()
);
create unique index if not exists bastion_worlds_owner on public.bastion_worlds (owner);
alter table public.bastion_worlds enable row level security; -- no policies: reads and writes go through the functions below

-- the owner's device makes its world once (it needs a cloud save); later calls return the same code
create or replace function public.create_world(p_id uuid, p_secret text, p_fort jsonb)
returns text language plpgsql security definer set search_path to 'public', 'extensions' as $$
declare cur public.saves; w public.bastion_worlds; c text; chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  select * into cur from public.saves where id = p_id;
  if not found or cur.secret_hash <> encode(digest(p_secret, 'sha256'), 'hex') then raise exception 'unknown device'; end if;
  select * into w from public.bastion_worlds where owner = p_id;
  if found then return w.code; end if;
  if octet_length(p_fort::text) > 300000 then raise exception 'fort too large'; end if;
  loop
    c := '';
    for i in 1..6 loop c := c || substr(chars, 1 + floor(random() * length(chars))::int, 1); end loop;
    exit when not exists (select 1 from public.bastion_worlds where code = c);
  end loop;
  insert into public.bastion_worlds (code, owner, fort, wave) values (c, p_id, p_fort, greatest(1, coalesce((p_fort->>'wave')::int, 1)));
  return c;
end $$;

create or replace function public.load_world(p_code text)
returns jsonb language sql security definer set search_path to 'public' as $$
  select jsonb_build_object('fort', fort, 'wave', wave) from public.bastion_worlds where code = upper(p_code);
$$;

-- anyone with the code saves the world; its wave only ever goes up, a few waves per save at most
create or replace function public.save_world(p_code text, p_fort jsonb, p_wave integer)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare w public.bastion_worlds;
begin
  if octet_length(p_fort::text) > 300000 then raise exception 'fort too large'; end if;
  if jsonb_typeof(p_fort->'b') <> 'array' then raise exception 'bad fort'; end if;
  select * into w from public.bastion_worlds where code = upper(p_code) for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'no such world'); end if;
  update public.bastion_worlds set fort = p_fort, wave = greatest(w.wave, least(coalesce(p_wave, 1), w.wave + 3)), updated_at = now() where code = w.code;
  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.create_world(uuid, text, jsonb), public.load_world(text), public.save_world(text, jsonb, integer) from public;
grant execute on function public.create_world(uuid, text, jsonb), public.load_world(text), public.save_world(text, jsonb, integer) to anon, authenticated;
