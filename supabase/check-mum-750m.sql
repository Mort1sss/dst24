-- Только чтение: что реально произошло с компенсацией «mum» на 750 млн ₽.
-- Запускать в Supabase Dashboard → SQL Editor (войти нужно тебе, анонимный ключ эти таблицы не видит).

select p.nick,
       p.last_seen,
       (select count(*) from public.grants g
         where g.user_id = p.id and g.note = 'Компенсация mum 750M')                       as создано_грантов,
       (select count(*) from public.grants g
         join public.grant_claims c on c.grant_id = g.id and c.user_id = g.user_id
         where g.user_id = p.id and g.note = 'Компенсация mum 750M')                        as забрано_грантов,
       (select coalesce(sum((g.params->>'amount')::bigint), 0)
          from public.grants g
          join public.grant_claims c on c.grant_id = g.id and c.user_id = g.user_id
         where g.user_id = p.id and g.note = 'Компенсация mum 750M')                        as забрано_₽,
       s.money      as деньги_в_последнем_сейве,
       s.cars       as машин,
       s.day        as день,
       s.mode       as режим,
       s.updated_at as сейв_обновлён
  from public.profiles p
  left join public.saves s on s.user_id = p.id
 where lower(p.nick) = lower('mum');

-- Если строк ноль — ник «mum» не найден: тогда сначала найти его в «Игроки» и уточнить написание.
