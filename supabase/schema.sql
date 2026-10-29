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

/* ---- вид рекордов ---- */
create or replace view public.leaderboard with (security_invoker = on) as
  select s.id, s.user_id, p.nick, s.mode, s.diff, s.day_key, s.score, s.stars,
         s.days, s.cars, s.money, s.bal, s.created_at
  from public.scores s join public.profiles p on p.id = s.user_id
  where not s.hidden and not p.banned;

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
declare n text := left(btrim(coalesce(new.raw_user_meta_data->>'nick','')), 16);
begin
  if n !~ '^[A-Za-zА-Яа-яЁё0-9_ -]{2,16}$' or exists(select 1 from public.profiles where lower(nick) = lower(n)) then
    loop
      n := 'Игрок' || lpad((floor(random()*10000))::int::text, 4, '0');
      exit when not exists(select 1 from public.profiles where lower(nick) = lower(n));
    end loop;
  end if;
  insert into public.profiles(id, nick) values (new.id, n);
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
  if v !~ '^[A-Za-zА-Яа-яЁё0-9_ -]{2,16}$' then return jsonb_build_object('err','Ник: 2–16 символов, буквы, цифры, пробел, _ и -'); end if;
  if exists(select 1 from public.profiles where lower(nick) = lower(v) and id <> u) then return jsonb_build_object('err','Ник занят'); end if;
  update public.profiles set nick = v where id = u;
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
  if length(coalesce(p_diff,'')) > 20 or length(coalesce(p_day_key,'')) > 20 then raise exception 'key'; end if;
  if (select count(*) from public.scores where user_id = u and created_at > now() - interval '1 hour') >= 30 then raise exception 'limit'; end if;
  insert into public.scores(user_id, mode, diff, day_key, score, stars, days, cars, money, bal)
    values (u, p_mode, p_diff, p_day_key, p_score, p_stars, p_days, p_cars, p_money, p_bal)
    returning id into r;
  return r;
end $$;

/* ---- подарки ---- */
create or replace function public.my_grants() returns setof public.grants
language plpgsql security definer set search_path = public as $$
declare u uuid := public._uid(); reg timestamptz;
begin
  select created_at into reg from public.profiles where id = u;
  return query select g.* from public.grants g
    where (g.user_id = u or (g.user_id is null and g.created_at >= reg))
      and not exists(select 1 from public.grant_claims c where c.grant_id = g.id and c.user_id = u)
    order by g.id;
end $$;

create or replace function public.claim_grant(p_id int) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u uuid := public._uid(); g public.grants; reg timestamptz; n int;
begin
  select created_at into reg from public.profiles where id = u;
  select * into g from public.grants where id = p_id and (user_id = u or (user_id is null and created_at >= reg));
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
declare u uuid := public._uid(); t uuid; me_nick text;
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

create or replace function public.mail_done(p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
declare u uuid := public._uid();
begin update public.mail set done = true where id = p_id and to_user = u; end $$;

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

grant select on public.config, public.events to anon;
grant select on public.profiles, public.leaderboard, public.grant_claims to authenticated;
grant update (banned, nick, last_seen) on public.profiles to authenticated;   -- игроку закрыто политикой, нужно админу
grant select, insert, delete on public.admins to authenticated;
grant select, insert, update, delete on public.saves, public.scores, public.config, public.events, public.grants to authenticated;
grant delete on public.grant_claims to authenticated;
grant select, insert, delete on public.mail to authenticated;
grant update (done) on public.mail to authenticated;                          -- игрок меняет только «прочитано»
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
  with check (user_id = public.me() and octet_length(data::text) <= 409600);
drop policy if exists saves_upd on public.saves;
create policy saves_upd on public.saves for update to authenticated
  using (user_id = public.me()) with check (user_id = public.me() and octet_length(data::text) <= 409600);
drop policy if exists saves_admin on public.saves;
create policy saves_admin on public.saves for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- scores
drop policy if exists scores_sel on public.scores;
create policy scores_sel on public.scores for select to authenticated
  using (user_id = public.me() or (not hidden and not exists(select 1 from public.profiles p where p.id = scores.user_id and p.banned)));
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
create policy grants_sel on public.grants for select to authenticated using (user_id is null or user_id = public.me());
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
drop policy if exists mail_upd on public.mail;
create policy mail_upd on public.mail for update to authenticated using (to_user = public.me()) with check (to_user = public.me());
drop policy if exists mail_admin on public.mail;
create policy mail_admin on public.mail for all to authenticated using (public.is_admin()) with check (public.is_admin());

/* ---- права на функции ---- */
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.me(), public.is_admin(), public.touch(), public.set_nick(text),
  public.submit_score(text,text,text,bigint,int,int,int,bigint,int), public.my_grants(), public.claim_grant(int),
  public.parks(), public.poach(text), public.send_gift(text,int), public.my_mail(), public.mail_done(bigint)
  to authenticated;

/* ---- сделать себя админом ---- */
-- Сначала зарегистрируйтесь в игре, потом уберите «--» в начале строки, впишите свой ник вместо ВАШ_НИК и нажмите Run.
-- insert into admins(id) select id from profiles where nick='ВАШ_НИК';
