-- ДСТ-24: проверка серверных проверок на живом проекте.
-- Вставить целиком в SQL Editor и нажать Run. Всё идёт внутри begin … rollback,
-- поэтому база не меняется: тестовые аккаунты, письма и рекорды исчезают вместе с откатом,
-- чистить ничего не нужно.
-- Успех = «Success. No rows returned». Провал = ошибка с тегом теста, например «T4 FAIL: …».
-- Нужны права роли postgres (SQL Editor их даёт): скрипт пишет в auth.users и public.saves напрямую.

begin;

/* ---- тестовые игроки ---- */
-- в списке только обязательные столбцы: остальное берёт на себя GoTrue (значения по умолчанию)
insert into auth.users(id, aud, role, email, raw_app_meta_data, raw_user_meta_data)
 values
  ('11111111-1111-1111-1111-111111111111','authenticated','authenticated','qa_h1@mort1sss.github.io',
   '{"provider":"email","providers":["email"]}','{"nick":"QA-H1"}'),
  ('22222222-2222-2222-2222-222222222222','authenticated','authenticated','qa_h2@mort1sss.github.io',
   '{"provider":"email","providers":["email"]}','{"nick":"QA-H2"}')
 on conflict (id) do nothing;

-- профиль и ник создаёт триггер handle_new_user; кассу, машины и водителей — как облачное сохранение игры
insert into public.saves(user_id, mode, day, money, cars, drivers, stars, bal) values
  ('11111111-1111-1111-1111-111111111111','campaign',5,3000,4,3,0,7),
  ('22222222-2222-2222-2222-222222222222','campaign',5,60000,6,1,0,7)
 on conflict (user_id) do update set mode = excluded.mode, day = excluded.day, money = excluded.money,
   cars = excluded.cars, drivers = excluded.drivers, stars = excluded.stars, bal = excluded.bal, updated_at = now();

-- дальше все вызовы идут от имени QA-H1: функции берут игрока из auth.uid()
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","aud":"authenticated","role":"authenticated"}';

do $$
declare r jsonb; n bigint; c bigint; mx bigint; d int; k text;
        -- объявления в plpgsql разделяются точкой с запятой: через запятую парсер отваливался на ':='
        -- и весь файл не исполнялся с самого своего появления (d3c8ef9, 3 ноября)
        u1 uuid := '11111111-1111-1111-1111-111111111111';
        u2 uuid := '22222222-2222-2222-2222-222222222222';
begin
  /* ---- подарки ---- */
  -- T1: подарок не по карману — отказ, касса не тронута
  r := public.send_gift('QA-H2', 5000);
  if not (r ? 'err' and r ->> 'err' like '%не хватает%') then raise exception 'T1 FAIL: %', r; end if;
  if (select money from public.saves where user_id = u1) <> 3000 then raise exception 'T1 FAIL: деньги списаны при отказе'; end if;

  -- T2: подарок по карману — принят, сервер списал кассу сам
  update public.saves set money = 60000 where user_id = u1;
  r := public.send_gift('QA-H2', 5000);
  if not (r ? 'ok') then raise exception 'T2 FAIL: %', r; end if;
  if (select money from public.saves where user_id = u1) <> 55000 then raise exception 'T2 FAIL: касса стала %', (select money from public.saves where user_id = u1); end if;
  if not exists(select 1 from public.mail where from_user = u1 and kind = 'gift' and params ->> 'amount' = '5000') then raise exception 'T2 FAIL: письмо адресату не создано'; end if;

  -- T3: подарок несуществующему игроку — отказ
  r := public.send_gift('QA-Нет-Такого', 5000);
  if not (r ? 'err') then raise exception 'T3 FAIL: %', r; end if;

  /* ---- переманивание ---- */
  -- T4: у парка с одним водителем забирать нечего
  r := public.poach('QA-H2');
  if not (r ? 'err' and r ->> 'err' like '%некого%') then raise exception 'T4 FAIL: %', r; end if;

  -- T5: забросил сохранение — не цель. Явным updated_at это не смоделировать: триггер
  -- saves_touch на before insert or update безусловно ставит now(). Ветку «нет свежего
  -- сохранения» проверяем отсутствием строки — poach на seen is null даёт то же сообщение
  delete from public.saves where user_id = u2;
  r := public.poach('QA-H2');
  if not (r ? 'err' and r ->> 'err' like '%давно не заходил%') then raise exception 'T5 FAIL: %', r; end if;

  -- T6: живой парк с водителями — получается; второй раз за сутки уже нет.
  -- Касса завышена намеренно: parks() отдаёт только 200 строк, отсортированных по money desc,
  -- и с обычными 60 000 тестовый игрок в них не попал бы — T7 видел null вместо водителей.
  -- Потолок saves по CHECK — |money| < 10 млрд, 9 млрд в него проходит
  insert into public.saves(user_id, mode, day, money, cars, drivers, stars, bal)
    values (u2,'campaign',5,9000000000,6,5,0,7)
    on conflict (user_id) do update set drivers = 5, money = 9000000000, updated_at = now();
  r := public.poach('QA-H2');
  if not (r ? 'ok') then raise exception 'T6 FAIL: %', r; end if;
  r := public.poach('QA-H2');
  if not (r ? 'err' and r ->> 'err' like '%уже пытались%') then raise exception 'T6 FAIL (повтор в тот же день): %', r; end if;

  -- T7: список таксопарков отдаёт число водителей
  select drivers into d from public.parks() where nick = 'QA-H2';
  if d is distinct from 5 then raise exception 'T7 FAIL: drivers = %', d; end if;

  /* ---- рекорды ---- */
  -- T8: испытание за прошлую дату не принимается
  begin
    n := public.submit_score('daily', 'normal', '2020-1-1', 1000000, 0, 6, 12, 400000, 7);
    raise exception 'T8 FAIL: старый ключ принят (id %)', n;
  exception when raise_exception then
    if sqlerrm <> 'stale' then raise exception 'T8 FAIL: %', sqlerrm; end if;
  end;

  -- T9: сегодняшний ключ проходит; повтор хуже — не перебивает, лучше — замещает; строка остаётся одна
  k := (select extract(year from (now() at time zone 'utc')::date)::int || '-' ||
               extract(month from (now() at time zone 'utc')::date)::int || '-' ||
               extract(day from (now() at time zone 'utc')::date)::int);
  begin
    n := public.submit_score('daily', 'normal', k, 1000000, 0, 6, 12, 400000, 7);
  exception when others then raise exception 'T9a FAIL: %', sqlerrm; end;
  select count(*), max(score) into c, mx from public.scores where user_id = u1 and mode = 'daily' and day_key = k;
  if c <> 1 or mx <> 1000000 then raise exception 'T9a FAIL: строк %, очков %', c, mx; end if;
  begin
    n := public.submit_score('daily', 'normal', k, 500000, 0, 6, 12, 300000, 7);
  exception when others then raise exception 'T9b FAIL: %', sqlerrm; end;
  select count(*), max(score) into c, mx from public.scores where user_id = u1 and mode = 'daily' and day_key = k;
  if c <> 1 or mx <> 1000000 then raise exception 'T9b FAIL: худший повтор перебил результат (% строк, % очков)', c, mx; end if;
  n := public.submit_score('daily', 'normal', k, 2000000, 0, 6, 12, 1500000, 7);
  select count(*), max(score) into c, mx from public.scores where user_id = u1 and mode = 'daily' and day_key = k;
  if c <> 1 or mx <> 2000000 then raise exception 'T9c FAIL: строк %, очков %', c, mx; end if;

  -- T10: для кампании 99 дней быть не может
  begin
    n := public.submit_score('campaign', 'normal', '', 100000, 3, 99, 40, 100000, 7);
    raise exception 'T10 FAIL: 99 дней приняты (id %)', n;
  exception when raise_exception then
    if sqlerrm <> 'days' then raise exception 'T10 FAIL: %', sqlerrm; end if;
  end;

  -- T11: очки больше, чем машины × 20 000 + касса
  begin
    n := public.submit_score('campaign', 'normal', '', 5000000, 0, 30, 10, 0, 7);
    raise exception 'T11 FAIL: надуманные очки приняты (id %)', n;
  exception when raise_exception then
    if sqlerrm <> 'score' then raise exception 'T11 FAIL: %', sqlerrm; end if;
  end;

  -- T12: честная запись кампании проходит
  begin
    n := public.submit_score('campaign', 'normal', '', 900000, 3, 30, 40, 100000, 7);
  exception when others then raise exception 'T12 FAIL: %', sqlerrm; end;
  if n is null then raise exception 'T12 FAIL: id не вернулся'; end if;

  -- T13: bal текущего поколения и парк больше тысячи машин проходят. Прежняя граница p_bal > 12 отбивала
  -- именно это, а все тесты выше передавали bal = 7 и проскок не видели: пять дней в scores не попадало ничего
  begin
    n := public.submit_score('endless', 'normal', '', 24100000, 3, 800, 1200, 100000, 21);
  exception when others then raise exception 'T13 FAIL: %', sqlerrm; end;
  if n is null then raise exception 'T13 FAIL: id не вернулся'; end if;

  -- T14: bal за запасом 99 отсечён, иначе граница превратилась бы в «принимается всё подряд»
  begin
    n := public.submit_score('endless', 'normal', '', 24100000, 3, 800, 1200, 100000, 100);
    raise exception 'T14 FAIL: bal 100 принят (id %)', n;
  exception when raise_exception then
    if sqlerrm <> 'bal' then raise exception 'T14 FAIL: %', sqlerrm; end if;
  end;
  -- T15: потолок машин в районе снят (BAL[22]) — сеть из тысяч машин должна и сохраняться в облаке, и попадать в scores.
  -- Граница была 7000; бот на 400-й день даёт 2555 машин, а длинная партия её давно перешагивает, и CHECK молча отбивал синхронизацию
  begin
    update public.saves set cars = 40000 where user_id = '22222222-2222-2222-2222-222222222222';
  exception when others then raise exception 'T15 FAIL: сохранение на 40 000 машин отбито: %', sqlerrm; end;
  begin
    n := public.submit_score('endless', 'normal', '', 700000000, 3, 1800, 40000, 0, 22);
  exception when others then raise exception 'T15 FAIL: рекорд на 40 000 машин отбит: %', sqlerrm; end;
  if n is null then raise exception 'T15 FAIL: id не вернулся'; end if;

  -- T16: запас всё-таки конечен — иначе вместо проверки получилось бы «принимается любое число»
  begin
    n := public.submit_score('endless', 'normal', '', 700000000, 3, 1800, 50001, 0, 22);
    raise exception 'T16 FAIL: парк 50 001 принят (id %)', n;
  exception when raise_exception then
    if sqlerrm <> 'cars' then raise exception 'T16 FAIL: %', sqlerrm; end if;
  end;
end $$;

rollback;
