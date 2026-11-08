-- Миграция выпуска 52+: потолок машин 1000 -> 7000 (saves CHECK + submit_score).
-- Применять в Supabase SQL editor живой БД; идемпотентна (drop/re-add constraint, create or replace).

alter table public.saves drop constraint if exists saves_sane;
alter table public.saves add constraint saves_sane check (
  (mode is null or mode in ('campaign','endless','story','daily','contest'))
  and (day is null or day between 0 and 2000) and (cars is null or cars between 0 and 7000)
  and (money is null or abs(money) < 10000000000) and (stars is null or stars between 0 and 3)) not valid;

create or replace function public.submit_score(p_mode text, p_diff text, p_day_key text, p_score bigint,
  p_stars int, p_days int, p_cars int, p_money bigint, p_bal int) returns bigint
language plpgsql security definer set search_path = public as $$
declare u uuid := public._uid(); r bigint; k date; nowd date := ((now() at time zone 'utc')::date);
begin
  if p_mode is null or p_mode not in ('campaign','endless','story','daily','contest') then raise exception 'mode'; end if;
  -- скобки обязательны: plpgsql ищет конец условия по первому THEN, а их внутри CASE несколько
  if p_days is null or p_days < 0 or p_days > (case p_mode
    when 'campaign' then 31 when 'story' then 46 when 'daily' then 10 when 'contest' then 10 else 2000 end)
    then raise exception 'days'; end if;
  if p_cars is null or p_cars < 0 or p_cars > 7000 then raise exception 'cars'; end if;
  if p_money is null or abs(p_money) >= 10000000000 then raise exception 'money'; end if;
  if p_score is null or p_score < 0 or p_score >= 10000000000 then raise exception 'score'; end if;
  if p_stars is null or p_stars < 0 or p_stars > 3 then raise exception 'stars'; end if;
  if p_bal is null or p_bal < 1 or p_bal > 12 then raise exception 'bal'; end if;
  if coalesce(p_diff,'') not in ('easy','normal','hard','') or length(coalesce(p_day_key,'')) > 20 then raise exception 'key'; end if;
  if (select count(*) from public.scores where user_id = u and created_at > now() - interval '1 hour') >= 30 then raise exception 'limit'; end if;
  -- очки обычной партии = машины × 20 000 + касса (recordResult); потолок с запасом на округление
  if p_mode in ('campaign','endless','story') and p_score > greatest(0, p_cars * 20000 + coalesce(p_money, 0)) + 100000
    then raise exception 'score'; end if;

  if p_mode in ('daily','contest') then
    if coalesce(p_day_key,'') = '' then raise exception 'key'; end if;
    -- очки испытания = касса + 50 000 за машину + 2 000 за репутацию (репутация не выше 100)
    if p_score > greatest(0, coalesce(p_money, 0)) + p_cars * 50000 + 250000 then raise exception 'score'; end if;
    if p_mode = 'daily' then
      if p_day_key !~ '^[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}$' then raise exception 'key'; end if;
      begin k := to_date(p_day_key, 'YYYY-MM-DD'); exception when others then raise exception 'key'; end;
      -- ключ ставится в день старта, а забег идёт 7 дней: пускаем неделю назад плюс сутки на часовые пояса
      if k not between nowd - 8 and nowd + 1 then raise exception 'stale'; end if;
    else
      -- ключ соревнования обязан совпадать с настоящим событием; active не требуем:
      -- выключенное админом событие не должно съедать уже сыгранные результаты
      if not exists(select 1 from public.events e where e.kind = 'contest'
        and ('c' || e.id::text) = p_day_key
        and (e.starts is null or e.starts <= nowd + 1)
        and (e.ends is null or e.ends >= nowd - 9)) then raise exception 'key'; end if;
    end if;
    insert into public.scores(user_id, mode, diff, day_key, score, stars, days, cars, money, bal)
      values (u, p_mode, p_diff, p_day_key, p_score, p_stars, p_days, p_cars, p_money, p_bal)
      on conflict (user_id, mode, day_key) where mode in ('daily','contest')
      do update set diff = excluded.diff, score = excluded.score, stars = excluded.stars,
        days = excluded.days, cars = excluded.cars, money = excluded.money, bal = excluded.bal, created_at = now()
      where excluded.score > scores.score
      returning id into r;
    if r is null then -- результат хуже прежнего: оставляем и показываем прежний
      select id into r from public.scores where user_id = u and mode = p_mode and day_key = p_day_key;
    end if;
    return r;
  end if;

  insert into public.scores(user_id, mode, diff, day_key, score, stars, days, cars, money, bal)
    values (u, p_mode, p_diff, p_day_key, p_score, p_stars, p_days, p_cars, p_money, p_bal)
    returning id into r;
  return r;
end $$;
