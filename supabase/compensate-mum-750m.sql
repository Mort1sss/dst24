-- Компенсация игроку «mum»: 750 млн ₽.
-- Один грант крупнее 1 000 000 ₽ клиент обрезает до 1 млн и списывает целиком (js/online.js:7, js/online.js:193),
-- поэтому сумма отдаётся пачкой: 750 записей по 1 млн.
-- Забор: по 20 грантов за опрос, опрос раз в минуту (js/online.js:209, js/online.js:149) -> ~38 минут открытой игры.
-- В SQL Editor выполняется от postgres, RLS не мешает; админ-форма «Подарки» такой суммы не пропустит.

do $$
declare uid uuid; n int; total bigint;
begin
  -- ник должен быть найден ровно один раз
  select count(*) into n from public.profiles where lower(nick) = lower('mum');
  if n <> 1 then
    raise exception 'Ник «mum» найден раз: % — выдача остановлена (уточни ник в «Игроки»)', n;
  end if;
  select id into uid from public.profiles where lower(nick) = lower('mum');

  -- защита от двойного запуска: повторная вставка дала бы ещё 750 млн
  select count(*) into n from public.grants
    where user_id = uid and note = 'Компенсация mum 750M'
      and not exists (select 1 from public.grant_claims c where c.grant_id = grants.id and c.user_id = uid);
  if n > 0 then
    raise exception 'Уже висит незабраных грантов с этой отметкой: % — скрипт не запускаем дважды', n;
  end if;

  insert into public.grants(user_id, kind, params, note)
  select uid, 'money', jsonb_build_object('amount', 1000000), 'Компенсация mum 750M'
    from generate_series(1, 750);

  select count(*), coalesce(sum((params->>'amount')::bigint), 0) into n, total
    from public.grants where user_id = uid and note = 'Компенсация mum 750M';
  raise notice 'Игрок % · грантов создано: % · сумма: % ₽', uid, n, total;
end $$;

-- проверка: что реально лежит и ждёт забора
select g.id, g.kind, g.params, g.note, g.created_at
  from public.grants g
 where g.note = 'Компенсация mum 750M'
 order by g.id desc
 limit 3;

select count(*) as строк, coalesce(sum((params->>'amount')::bigint), 0) as ждёт_в_грантах_₽
  from public.grants where note = 'Компенсация mum 750M';
