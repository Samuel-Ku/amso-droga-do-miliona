# Release — hero, ranking D1 i mobile bez scrolla

> Historyczny raport wydania. Frontendowe instrukcje zostały zastąpione przez ADR 0009; aktualny frontend publikuje wyłącznie Vercel.

## Zakres

Wydanie składa się z dwóch niezależnych artefaktów:

- Autonomicznego HTML z nową hierarchią CTA, accordionem, landingowym top 5,
  wynikiem desktop top 10 lub top 9 + aktualny gracz oraz jednokadrowym mobile;
- Workera rekordów z D1 jako źródłem prawdy, unikalną nazwą gracza,
  anonimowym identyfikatorem właściciela i dokładnym miejscem poza top 10.

Gra i lokalny wynik pozostają offline-first. Niedostępny Worker, D1 albo sieć
mogą ukryć lub opóźnić ranking, ale nie mogą zablokować CTA ani rozgrywki.

## Brama automatyczna

Przed publikacją uruchomić:

```sh
npm test
npm run typecheck
npm run build
npm run build:single
npm run check:autonomic-html
```

Test Workera obejmuje nową nazwę, kolizję nazwy bez względu na wielkość liter,
poprawę wyniku właściciela, deterministyczny remis, dokładne miejsce poza top 10,
ponad 1000 zachowanych graczy, neutralizację moderowanej nazwy legacy i
idempotentny import z niezmienionego R2.

### Wykonane dowody — 2026-08-06

- `npm test`: 60 plików, 583 testy zaliczone.
- `npm run typecheck`: zaliczony bez diagnostyki.
- `npm run build`, `npm run build:single`: zaliczone; Autonomiczny HTML ma
  17 173 801 B.
- `npm run check:autonomic-html`: zaliczony, raportowany budżet 16.38 MB.
- Izolowany rehearsal migracji: `sourceCount: 2`; pierwszy przebieg
  `imported: 2, skipped: 0, invalid: 0`, drugi przebieg
  `imported: 0, skipped: 2, invalid: 0`. Surowy payload R2 przed i po teście
  pozostaje identyczny; osobny fixture potwierdza zachowanie moderowanej nazwy
  w D1 i publiczną neutralizację do `Gracz`.
- Smoke HTTP: nowa nazwa 200, nazwa zajęta 409, gorszy wynik bez aktualizacji,
  lepszy wynik właściciela 200, remis rozstrzygany zamówieniami/czasem, dokładne
  miejsce 1001 oraz moderowany legacy wpis bez wycieku owner ID.
- Browser QA z produkcyjnego `dist-demo`: desktop 1440×900 bez overflow;
  mobile landing 667×375 i 844×390 ma dokładnie jeden viewport, brak overflow,
  ukryty leaderboard i widoczną grafikę; mobile result 667×375 i 844×390 ma
  dwie kolumny, widoczne akcje i ranking bez overflow. 568×320 aktywuje
  `data-campaign-too-narrow`; portrait po starcie aktywuje prompt obrotu.

Produkcja wymaga jeszcze wpisania rzeczywistych identyfikatorów Cloudflare oraz
powtórzenia tego samego rehearsal na niezmienionym źródłowym R2. Nie wpisujemy
fikcyjnych produkcyjnych liczników do dowodów lokalnych.

## Kolejność wdrożenia

1. Utworzyć D1 `droga-records`, wpisać jego rzeczywiste `database_id` do
   `worker/wrangler.toml`, upewnić się, że namespace `WRITE_RATE_LIMITER` jest
   unikalny w koncie, i ustawić sekret `MIGRATION_TOKEN`. Binding wymaga
   Wrangler 4.36.0 lub nowszego.
2. Zastosować migracje D1 przed opublikowaniem nowego Workera:
   `npx wrangler d1 migrations apply droga-records --remote`.
3. Wdrożyć Worker. Stary frontend może nadal czytać publiczne `entries`.
4. Uruchomić jednorazowy import przez chroniony
   `POST /api/records/migrate` z nagłówkiem `Authorization: Bearer <token>`.
5. Powtórzyć import. Drugi raport musi mieć `imported: 0`; suma
   `imported + skipped + invalid` musi odpowiadać `sourceCount`.
6. Porównać próbkę pól `name`, `challengeScore`, `orders`, `updatedAt` i legacy
   ID między R2 i D1. Obiekt `records.json` w R2 pozostaje tylko do odczytu.
7. Wykonać smoke GET/POST, a następnie wdrożyć frontendowy Autonomiczny HTML.
   Frontend można wdrożyć przed Workerem, jeżeli akceptujemy czasowy brak nowych
   funkcji właściciela i dokładnego miejsca.

Import zachowuje surową historyczną nazwę w D1. Jeżeli aktualna polityka ją
odrzuca, publiczne API zwraca neutralne `Gracz`; źródłowe R2 i pole D1 nie są
przepisywane.

### Ograniczenie przypisania legacy

Anonimowy `playerId` nie jest kontem ani uwierzytelnieniem. Best-effort claim
ownerless legacy sprawdza nazwę i poprzedni lokalny najlepszy wynik, lecz te dane
nie są kryptograficznym dowodem własności. Migrację i okno claim należy prowadzić
krótko, monitorować 409 oraz nietypowe przejęcia, zachować R2 do audytu i w razie
sporu ręcznie wycofać `owner_id`. Dla silnej własności potrzebne byłoby osobne
logowanie lub podpisany token migracyjny — poza zakresem tej kampanii.

## Browser acceptance

Desktop:

- przed ukończeniem historii jedynym głównym CTA jest „Zagraj z historią AMSO”;
- po ukończeniu „Szybki start” jest pierwszy i główny, a powtórka historii
  drugorzędna;
- landing pokazuje top 5, a result top 10 lub top 9 + dokładny wiersz gracza;
- accordion ma własny chevron, neutralną ramkę i widoczny `focus-visible`.

Mobile landscape:

- na 667×375 i 844×390 root ma `scrollWidth === clientWidth` oraz
  `scrollHeight === clientHeight` na landing i challenge result;
- landing nie pokazuje rankingu, ale zachowuje grafikę i otwiera instrukcję w
  zamykanym overlayu z pułapką fokusu;
- result pokazuje wynik łączny, zamówienia, rekord, top 3 + aktualnego gracza,
  czytelny ranking na półprzezroczystym znaku i share jako overlay;
- Escape zamyka overlay i oddaje fokus elementowi, który go otworzył;
- 568×320 oraz portrait pokazują zatwierdzony komunikat o obrocie/za małym
  ekranie zamiast częściowo działającego interfejsu.

## Monitoring kosztu i zdrowia

W panelu Cloudflare monitorować osobno:

- D1 rows read, rows written i storage;
- liczbę odpowiedzi `409 name_taken`, `503 records_unavailable` i 5xx;
- liczbę `429 rate_limited` w Workers Logs/Traces; wbudowany binding jest
  celowo permissive/eventually consistent, więc nie zastępuje monitoringu;
- czas odpowiedzi GET z `playerId` oraz POST po wzroście liczby rekordów;
- zgodność liczby wierszy po imporcie z raportem migracji.

Nie włączać automatycznego płatnego upgrade ani płatnego planu w ramach tego
wydania. Przekroczenie darmowego limitu ma skutkować degradacją leaderboardu,
nie blokadą gry. Decyzja o płatnym planie wymaga osobnej zgody.

## Rollback

1. Wycofać frontend do poprzedniego Autonomicznego HTML; Worker może pozostać.
2. Jeżeli problem dotyczy API, wycofać Worker do poprzedniego bundle niezależnie
   od frontendu.
3. Nie usuwać bazy D1, tabeli ani bucketu R2. Nie wykonywać migracji wstecz
   niszczącej dane.
4. Zachować źródłowy `records.json` w R2, token migracyjny unieważnić po użyciu.
5. Po ponownym wdrożeniu nowego Workera powtórzyć idempotentny import; istniejące
   rekordy D1 oraz legacy nie zostaną utracone ani zduplikowane.
