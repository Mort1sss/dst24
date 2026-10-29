-- ДСТ-24: бэкенд Supabase. Вставьте файл целиком в SQL Editor и нажмите Run.
-- Файл можно запускать повторно: уже созданное не ломается и не стирается.

/* ---- id игрока ---- */
-- Все политики и функции берут id игрока отсюда. Если схему входа поменяем, заменить нужно только эту функцию.
create or replace function public.me() returns uuid
language sql stable as $$ select auth.uid() $$;

/* ---- таблицы ---- */
create table if not exists public.profiles(
  id uuid primary key references auth.users(id) on delete cascade,
  nick text not null unique,
  banned boolean not null default false,
  created_at timestamptz not null default now(),
  last_seen timestamptz
);
create unique index if not exists profiles_nick_lower on public.profiles(lower(nick));

create table if not exists public.admins(id uuid primary key);

create table if not exists public.saves(
  user_id uuid primary key default public.me(),
  data jsonb,
  mode text, day int, money bigint, cars int, stars int, bal int,
  updated_at timestamptz not null default now()
);

alter table public.saves drop constraint if exists saves_sane;
alter table public.saves add constraint saves_sane check (
  (mode is null or mode in ('campaign','endless','story','daily','contest'))
  and (day is null or day between 0 and 2000) and (cars is null or cars between 0 and 1000)
  and (money is null or abs(money) < 10000000000) and (stars is null or stars between 0 and 3)) not valid;

create or replace function public.saves_touch() returns trigger
language plpgsql as $$ begin new.updated_at := now(); return new; end $$;
drop trigger if exists saves_touch on public.saves;
create trigger saves_touch before insert or update on public.saves
  for each row execute function public.saves_touch();

create table if not exists public.scores(
  id bigserial primary key,
  user_id uuid not null default public.me(),
  mode text, diff text, day_key text,
  score bigint, stars int, days int, cars int, money bigint, bal int,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists scores_top on public.scores(mode, day_key, score desc);

create table if not exists public.config(
  rev serial primary key,
  base int, patch jsonb, note text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.events(
  id serial primary key,
  kind text check (kind in ('news','rev','cash','event','contest')),
  title text, text text, params jsonb,
  starts date, ends date,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.grants(
  id serial primary key,
  user_id uuid,                       -- null = всем
  kind text check (kind in ('ach','money','livery','note')),
  params jsonb, note text,
  created_at timestamptz not null default now()
);

create table if not exists public.grant_claims(
  grant_id int not null,
  user_id uuid not null,
  claimed_at timestamptz not null default now(),
  primary key (grant_id, user_id)
);
create index if not exists grant_claims_user on public.grant_claims(user_id);

create table if not exists public.mail(
  id bigserial primary key,
  to_user uuid not null,
  from_user uuid not null,
  kind text check (kind in ('poach','gift')),
  params jsonb,
  created_at timestamptz not null default now(),
  done boolean not null default false
);
create index if not exists mail_inbox on public.mail(to_user, done);

/* ---- помощники (игрок не читает profiles.banned/created_at напрямую) ---- */
create or replace function public.is_banned(u uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select coalesce((select banned from public.profiles where id = u), false) $$;

create or replace function public.reg_at() returns timestamptz
language sql stable security definer set search_path = public as
$$ select created_at from public.profiles where id = public.me() $$;

-- ник: кириллица или латиница (не вперемешку), цифры, _ - пробел
create or replace function public.nick_ok(v text) returns boolean
language sql immutable as
$$ select v ~ '^[A-Za-zА-Яа-яЁё0-9_ -]{2,16}$' and not (v ~ '[A-Za-z]' and v ~ '[А-Яа-яЁё]') $$;

/* ---- вид рекордов ---- */
create or replace view public.leaderboard with (security_invoker = on) as
  select s.id, s.user_id, p.nick, s.mode, s.diff, s.day_key, s.score, s.stars,
         s.days, s.cars, s.money, s.bal, s.created_at
  from public.scores s join public.profiles p on p.id = s.user_id
  where not s.hidden and not public.is_banned(s.user_id);

/* ---- админ ---- */
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select exists(select 1 from public.admins where id = public.me()) $$;

/* ---- служебная проверка: вошёл и не забанен (только для функций ниже) ---- */
create or replace function public._uid() returns uuid
language plpgsql security definer set search_path = public as $$
declare u uuid := public.me();
begin
  if u is null then raise exception 'auth'; end if;
  if exists(select 1 from public.profiles where id = u and banned) then raise exception 'banned'; end if;
  return u;
end $$;

/* ---- новый пользователь -> профиль ---- */
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare n text := left(btrim(coalesce(new.raw_user_meta_data->>'nick','')), 16); i int := 0;
begin
  if not public.nick_ok(n) or exists(select 1 from public.profiles where lower(nick) = lower(n)) then n := null; end if;
  while n is null and i < 20 loop
    i := i + 1;
    n := 'Игрок' || lpad((floor(random()*10000))::int::text, 4, '0');
    if exists(select 1 from public.profiles where lower(nick) = lower(n)) then n := null; end if;
  end loop;
  if n is null then n := 'Игрок' || left(replace(new.id::text,'-',''), 8); end if;
  insert into public.profiles(id, nick) values (new.id, n) on conflict do nothing;
  if not found then
    insert into public.profiles(id, nick) values (new.id, 'Игрок' || left(replace(new.id::text,'-',''), 8)) on conflict do nothing;
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

/* ---- профиль ---- */
create or replace function public.touch() returns void
language plpgsql security definer set search_path = public as $$
declare u uuid := public._uid();
begin update public.profiles set last_seen = now() where id = u; end $$;

create or replace function public.set_nick(n text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u uuid := public._uid(); v text := btrim(coalesce(n,''));
begin
  if not public.nick_ok(v) then return jsonb_build_object('err','Ник: 2–16 символов, буквы (не вперемешку русские и латинские), цифры, пробел, _ и -'); end if;
  if exists(select 1 from public.profiles where lower(nick) = lower(v) and id <> u) then return jsonb_build_object('err','Ник занят'); end if;
  update public.profiles set nick = v where id = u;
  if not found then return jsonb_build_object('err','Нет профиля'); end if;
  return jsonb_build_object('ok', true, 'nick', v);
exception when unique_violation then return jsonb_build_object('err','Ник занят');
end $$;

/* ---- рекорды ---- */
create or replace function public.submit_score(p_mode text, p_diff text, p_day_key text, p_score bigint,
  p_stars int, p_days int, p_cars int, p_money bigint, p_bal int) returns bigint
language plpgsql security definer set search_path = public as $$
declare u uuid := public._uid(); r bigint;
begin
  if p_mode is null or p_mode not in ('campaign','endless','story','daily','contest') then raise exception 'mode'; end if;
  if p_days is null or p_days < 0 or p_days > 2000 then raise exception 'days'; end if;
  if p_cars is null or p_cars < 0 or p_cars > 1000 then raise exception 'cars'; end if;
  if p_money is null or abs(p_money) >= 10000000000 then raise exception 'money'; end if;
  if p_score is null or p_score < 0 or p_score >= 10000000000 then raise exception 'score'; end if;
  if p_stars is null or p_stars < 0 or p_stars > 3 then raise exception 'stars'; end if;
  if coalesce(p_diff,'') not in ('easy','normal','hard','') or length(coalesce(p_day_key,'')) > 20 then raise exception 'key'; end if;
  if (select count(*) from public.scores where user_id = u and created_at > now() - interval '1 hour') >= 30 then raise exception 'limit'; end if;
  insert into public.scores(user_id, mode, diff, day_key, score, stars, days, cars, money, bal)
    values (u, p_mode, p_diff, p_day_key, p_score, p_stars, p_days, p_cars, p_money, p_bal)
    returning id into r;
  return r;
end $$;

/* ---- подарки ---- */
drop function if exists public.my_grants();
create function public.my_grants() returns table(id int, kind text, params jsonb)
language plpgsql security definer set search_path = public as $$
declare u uuid := public._uid(); reg timestamptz;
begin
  select p.created_at into reg from public.profiles p where p.id = u;
  return query select g.id, g.kind, g.params from public.grants g
    where (g.user_id = u or (g.user_id is null and g.created_at >= reg))
      and not exists(select 1 from public.grant_claims c where c.grant_id = g.id and c.user_id = u)
    order by g.id;
end $$;

create or replace function public.claim_grant(p_id int) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u uuid := public.me(); g public.grants; reg timestamptz; n int;
begin
  if u is null or public.is_banned(u) then return null; end if;
  select p.created_at into reg from public.profiles p where p.id = u;
  select * into g from public.grants where grants.id = p_id and (user_id = u or (user_id is null and created_at >= reg));
  if not found then return null; end if;
  insert into public.grant_claims(grant_id, user_id) values (g.id, u) on conflict do nothing;
  get diagnostics n = row_count;
  if n = 0 then return null; end if;
  return jsonb_build_object('kind', g.kind, 'params', g.params);
end $$;

/* ---- города и почта ---- */
create or replace function public.parks() returns table(nick text, mode text, day int, money bigint, cars int, stars int, updated_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare u uuid := public._uid();
begin
  return query select p.nick, s.mode, s.day, s.money, s.cars, s.stars, s.updated_at
    from public.saves s join public.profiles p on p.id = s.user_id
    where not p.banned and s.updated_at > now() - interval '14 days'
    order by s.money desc nulls last limit 200;
end $$;

create or replace function public.poach(p_nick text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u uuid := public._uid(); t uuid;
begin
  select id into t from public.profiles where lower(nick) = lower(btrim(coalesce(p_nick,''))) and not banned;
  if t is null then return jsonb_build_object('err','Игрок не найден'); end if;
  if t = u then return jsonb_build_object('err','Нельзя переманивать у себя'); end if;
  if exists(select 1 from public.mail where from_user = u and kind = 'poach' and created_at > now() - interval '1 day') then
    return jsonb_build_object('err','Сегодня вы уже пытались'); end if;
  if exists(select 1 from public.mail where to_user = t and kind = 'poach' and created_at > now() - interval '1 day') then
    return jsonb_build_object('err','У этого игрока сегодня уже переманивали'); end if;
  insert into public.mail(to_user, from_user, kind, params) values (t, u, 'poach', '{}'::jsonb);
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.send_gift(p_nick text, p_amount int) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u uuid := public._uid(); t uuid;
begin
  if p_amount is null or p_amount < 1000 or p_amount > 20000 then return jsonb_build_object('err','Подарок от 1 000 до 20 000 ₽'); end if;
  select id into t from public.profiles where lower(nick) = lower(btrim(coalesce(p_nick,''))) and not banned;
  if t is null then return jsonb_build_object('err','Игрок не найден'); end if;
  if t = u then return jsonb_build_object('err','Себе нельзя'); end if;
  if (select count(*) from public.mail where from_user = u and kind = 'gift' and created_at > now() - interval '1 day') >= 3 then
    return jsonb_build_object('err','Не больше 3 подарков в сутки'); end if;
  if (select count(*) from public.mail where to_user = t and kind = 'gift' and created_at > now() - interval '1 day') >= 3 then
    return jsonb_build_object('err','Этому игроку сегодня уже много подарков'); end if;
  insert into public.mail(to_user, from_user, kind, params) values (t, u, 'gift', jsonb_build_object('amount', p_amount));
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.my_mail() returns setof public.mail
language plpgsql security definer set search_path = public as $$
declare u uuid := public._uid();
begin
  return query select m.id, m.to_user, m.from_user, m.kind,
      coalesce(m.params,'{}'::jsonb) || jsonb_build_object('from', p.nick), m.created_at, m.done
    from public.mail m join public.profiles p on p.id = m.from_user
    where m.to_user = u and not m.done order by m.id;
end $$;

drop function if exists public.mail_done(bigint);
create function public.mail_done(p_id bigint) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u uuid := public._uid(); r jsonb;
begin
  update public.mail set done = true where id = p_id and to_user = u and not done
    returning jsonb_build_object('kind', kind, 'params', params) into r;
  return r;
end $$;

/* ---- список игроков для админки ---- */
create or replace function public.admin_players() returns table(id uuid, nick text, banned boolean,
  created_at timestamptz, last_seen timestamptz, mode text, day int, money bigint, cars int, stars int, bal int, updated_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin'; end if;
  return query select p.id, p.nick, p.banned, p.created_at, p.last_seen, s.mode, s.day, s.money, s.cars, s.stars, s.bal, s.updated_at
    from public.profiles p left join public.saves s on s.user_id = p.id
    order by p.last_seen desc nulls last;
end $$;

/* ---- права на таблицы ---- */
alter table public.profiles    enable row level security;
alter table public.admins      enable row level security;
alter table public.saves       enable row level security;
alter table public.scores      enable row level security;
alter table public.config      enable row level security;
alter table public.events      enable row level security;
alter table public.grants      enable row level security;
alter table public.grant_claims enable row level security;
alter table public.mail        enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
grant usage on schema public to anon, authenticated;              -- на случай, если при создании проекта сняли «Автоматически отображать новые таблицы»

grant select on public.config, public.events to anon;
grant select on public.leaderboard, public.grant_claims to authenticated;
grant select (id, nick) on public.profiles to authenticated;     -- игрок видит только id и ник (в запросах select=id,nick, не *)
grant update (banned, nick) on public.profiles to authenticated; -- игроку закрыто политикой, нужно админу (Prefer: return=minimal)
grant select, insert, delete on public.admins to authenticated;
grant select, insert, update, delete on public.saves, public.scores, public.config, public.events, public.grants to authenticated;
grant delete on public.grant_claims to authenticated;
grant select, insert, update, delete on public.mail to authenticated;         -- update игроку закрыт политикой, «прочитано» ставит mail_done
grant usage on all sequences in schema public to authenticated;

/* ---- политики (RLS) ---- */
-- profiles
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using (true);
drop policy if exists profiles_admin on public.profiles;
create policy profiles_admin on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- admins
drop policy if exists admins_admin on public.admins;
create policy admins_admin on public.admins for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- saves
drop policy if exists saves_sel on public.saves;
create policy saves_sel on public.saves for select to authenticated using (user_id = public.me());
drop policy if exists saves_ins on public.saves;
create policy saves_ins on public.saves for insert to authenticated
  with check (user_id = public.me() and not public.is_banned(public.me()) and octet_length(data::text) <= 409600);
drop policy if exists saves_upd on public.saves;
create policy saves_upd on public.saves for update to authenticated
  using (user_id = public.me()) with check (user_id = public.me() and not public.is_banned(public.me()) and octet_length(data::text) <= 409600);
drop policy if exists saves_admin on public.saves;
create policy saves_admin on public.saves for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- scores
drop policy if exists scores_sel on public.scores;
create policy scores_sel on public.scores for select to authenticated
  using (user_id = public.me() or (not hidden and not public.is_banned(user_id)));
drop policy if exists scores_admin on public.scores;
create policy scores_admin on public.scores for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- config
drop policy if exists config_sel on public.config;
create policy config_sel on public.config for select to anon, authenticated using (active);
drop policy if exists config_admin on public.config;
create policy config_admin on public.config for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- events
drop policy if exists events_sel on public.events;
create policy events_sel on public.events for select to anon, authenticated using (active);
drop policy if exists events_admin on public.events;
create policy events_admin on public.events for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- grants
drop policy if exists grants_sel on public.grants;
create policy grants_sel on public.grants for select to authenticated using (user_id = public.me() or (user_id is null and created_at >= public.reg_at()));
drop policy if exists grants_admin on public.grants;
create policy grants_admin on public.grants for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- grant_claims
drop policy if exists claims_sel on public.grant_claims;
create policy claims_sel on public.grant_claims for select to authenticated using (user_id = public.me());
drop policy if exists claims_admin on public.grant_claims;
create policy claims_admin on public.grant_claims for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- mail
drop policy if exists mail_sel on public.mail;
create policy mail_sel on public.mail for select to authenticated using (to_user = public.me());
drop policy if exists mail_upd on public.mail;   -- игрок не обновляет mail напрямую
drop policy if exists mail_admin on public.mail;
create policy mail_admin on public.mail for all to authenticated using (public.is_admin()) with check (public.is_admin());

/* ---- права на функции ---- */
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.me(), public.is_admin(), public.touch(), public.set_nick(text),
  public.submit_score(text,text,text,bigint,int,int,int,bigint,int), public.my_grants(), public.claim_grant(int),
  public.parks(), public.poach(text), public.send_gift(text,int), public.my_mail(), public.mail_done(bigint),
  public.is_banned(uuid), public.reg_at(), public.admin_players()
  to authenticated;

/* ---- профили для уже зарегистрированных ---- */
insert into public.profiles(id, nick)
  select id, 'Игрок' || left(replace(id::text,'-',''), 8) from auth.users on conflict do nothing;

/* ---- общий город: районы (Обновление 23) ---- */
-- Районы те же, что в index.html (TOWN). Игрок пишет только через set_town/leave_town, читает через town_state.
create table if not exists public.town(
  user_id uuid primary key references public.profiles(id) on delete cascade,
  alloc jsonb not null default '{}'::jsonb,
  color text,
  updated_at timestamptz not null default now(),
  win_at timestamptz not null default now(),   -- начало часового окна для лимита вызовов
  win_n int not null default 0
);
alter table public.town enable row level security;
alter table public.town drop constraint if exists town_sane;
alter table public.town add constraint town_sane check ((color is null or color ~ '^#[0-9a-fA-F]{6}$')
  and jsonb_typeof(alloc) = 'object' and octet_length(alloc::text) <= 512) not valid;
revoke all on public.town from anon, authenticated;
grant select, insert, update, delete on public.town to authenticated;  -- права урезает RLS: только админ
drop policy if exists town_admin on public.town;
create policy town_admin on public.town for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop function if exists public.set_town(jsonb, text);
create function public.set_town(p_alloc jsonb, p_color text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u uuid := public._uid(); k text; v numeric; s numeric := 0; lim int; w timestamptz; n int; a jsonb := '{}'::jsonb;
  keys text[] := array['center','station','airport','sleep','univer','industry'];
begin
  if p_alloc is null or jsonb_typeof(p_alloc) <> 'object' then return jsonb_build_object('ok', false, 'err', 'Неверное распределение'); end if;
  if p_color is not null and p_color !~ '^#[0-9a-fA-F]{6}$' then return jsonb_build_object('ok', false, 'err', 'Неверный цвет'); end if;
  for k in select jsonb_object_keys(p_alloc) loop
    if not (k = any(keys)) then return jsonb_build_object('ok', false, 'err', 'Неизвестный район'); end if;
    if jsonb_typeof(p_alloc->k) <> 'number' then return jsonb_build_object('ok', false, 'err', 'Неверное число машин'); end if;
    v := (p_alloc->>k)::numeric;
    if v <> trunc(v) or v < 0 or v > 1000 then return jsonb_build_object('ok', false, 'err', 'Неверное число машин'); end if;
    s := s + v;
    if v > 0 then a := a || jsonb_build_object(k, v::int); end if;
  end loop;
  -- машин не больше, чем правдоподобно для дня партии (saves игрок пишет сам)
  select least(cars, 10 + 3*coalesce(day,0), 300) into lim from public.saves where user_id = u;
  if s > coalesce(lim, 10) then return jsonb_build_object('ok', false, 'err', 'Машин в районах больше, чем в парке'); end if;
  select win_at, win_n into w, n from public.town where user_id = u;
  if found and w >= now() - interval '1 hour' and n >= 60 then return jsonb_build_object('ok', false, 'err', 'Слишком часто, попробуйте позже'); end if;
  insert into public.town(user_id, alloc, color, updated_at, win_at, win_n) values (u, a, p_color, now(), now(), 1)
    on conflict (user_id) do update set alloc = excluded.alloc, color = excluded.color, updated_at = now(),
      win_at = case when public.town.win_at < now() - interval '1 hour' then now() else public.town.win_at end,
      win_n  = case when public.town.win_at < now() - interval '1 hour' then 1 else public.town.win_n + 1 end;
  return jsonb_build_object('ok', true);
end $$;

drop function if exists public.town_state();
create function public.town_state() returns table(nick text, alloc jsonb, color text, updated_at timestamptz, mine boolean)
language plpgsql security definer set search_path = public as $$
declare u uuid := public._uid();
begin
  return query select p.nick, t.alloc, t.color, t.updated_at, (t.user_id = u)
    from public.town t join public.profiles p on p.id = t.user_id
    where not p.banned and t.updated_at >= now() - interval '7 days'
    order by t.updated_at desc;
end $$;

drop function if exists public.leave_town();
create function public.leave_town() returns jsonb
language plpgsql security definer set search_path = public as $$
declare u uuid := public._uid();
begin
  -- строку не удаляем, чтобы не сбрасывать лимит вызовов; через 7 дней она и так не видна в town_state
  update public.town set alloc = '{}'::jsonb, updated_at = now() - interval '8 days' where user_id = u;
  return jsonb_build_object('ok', true);
end $$;

-- для админки: видит user_id, чтобы выгнать игрока из города
drop function if exists public.admin_town();
create function public.admin_town() returns table(user_id uuid, nick text, alloc jsonb, color text, updated_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin'; end if;
  return query select t.user_id, p.nick, t.alloc, t.color, t.updated_at
    from public.town t join public.profiles p on p.id = t.user_id order by t.updated_at desc;
end $$;

revoke execute on function public.set_town(jsonb,text), public.town_state(), public.leave_town(), public.admin_town() from public, anon, authenticated;
grant execute on function public.set_town(jsonb,text), public.town_state(), public.leave_town(), public.admin_town() to authenticated;

/* ---- сделать себя админом ---- */
-- Сначала зарегистрируйтесь в игре, потом уберите «--» в начале строки, впишите свой ник вместо ВАШ_НИК и нажмите Run.
-- insert into admins(id) select id from profiles where nick='ВАШ_НИК';
