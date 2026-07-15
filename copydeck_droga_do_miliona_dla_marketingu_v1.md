# Droga do Miliona — copydeck do akceptacji marketingowej

**Wersja:** 2.0 (release candidate)
**Status:** roboczy — wymaga decyzji marketingu
**Źródło wdrożenia:** `public/assets/milion-runner/runner-config.json`
**Zakres:** 15 scen, 42 ręcznie przełączane ekrany, komunikaty finału i Trybu Wyzwania

## Jak pracować z dokumentem

Przy każdej scenie marketing wpisuje jedną decyzję: **AKCEPT / ZMIANA / ODRZUĆ**. Przy zmianie należy podać gotowe brzmienie, zachowując sens, perspektywę i fakty obowiązkowe. Tekst nie przełącza się automatycznie. Podczas aktywnej gry nie ma dolnego panelu narracji.

Perspektywy:

- **Nasza historia** — fakty i doświadczenia AMSO; dozwolone „my”.
- **Historia klienta** — anonimowa osoba lub firma; wyłącznie trzecia osoba.
- **Wyzwanie** — zasady i działanie gracza, bez przypisywania ich AMSO lub klientowi.

## Mapa całości

| # | ID | Perspektywa | Liczba ekranów | Funkcja |
|---:|---|---|---:|---|
| 1 | `story.first_package` | Nasza historia | 4 | instrukcja gry i początek AMSO |
| 2 | `story.order_backlog` | Nasza historia | 2 | rosnący zator zamówień |
| 3 | `story.first_process` | Nasza historia | 2 | przejście od improwizacji do procesu |
| 4 | `story.quality_promise` | Nasza historia | 2 | przygotowanie urządzenia |
| 5 | `story.quality_result` | Nasza historia | 2 | rezultat kontroli jakości |
| 6 | `client.creative_start` | Historia klienta | 4 | kreatywny start klientki |
| 7 | `client.business_growth` | Historia klienta | 4 | 300 zł → 100 000 zł po roku |
| 8 | `client.b2b_trust` | Historia klienta | 5 | 10% budżetu → decyzja po teście → 7 lat |
| 9 | `story.matching_result` | Nasza historia | 2 | dopasowanie sprzętu do różnych potrzeb |
| 10 | `story.scale` | Nasza historia | 5 | roczne dane skali i ich ludzki sens |
| 11 | `story.order_peak_result` | Nasza historia | 2 | proces i zespół opanowują szczyt |
| 12 | `story.million_approach` | Nasza historia | 2 | źródło licznika 999 970 |
| 13 | `challenge.million_wave` | Wyzwanie | 2 | cele bezpiecznego finału fabuły |
| 14 | `story.million_finale` | Nasza historia | 2 | milion i dalsza droga |
| 15 | `story.challenge_handoff` | Wyzwanie | 2 | jawna zmiana zasad |

## Sceny i copy do decyzji

### 1. `story.first_package` — Nasza historia

**Cel:** wyjaśnić grę i ustanowić pierwszą paczkę jako początek historii AMSO.
**Fakty:** mały sklep, magazyn wielkości kawalerki, pierwsze zamówienie przygotowane własnymi rękami.

1. **To gra o prawdziwej drodze AMSO.** Bieg przeplata się z krótkimi, sterowanymi przez gracza historiami — od pierwszej paczki do miliona zamówień.
2. **Kiedy czytasz, trasa jest bezpieczna.** W scenach historii nie ma przeszkód ani paczek. Po odliczaniu wracają skok, ślizg, zbieranie i licznik.
3. **Zaczynaliśmy naprawdę niewielcy.** Pierwszy sklep był mały, a magazyn miał powierzchnię zbliżoną do kawalerki.
4. **Pierwszą paczkę przygotowaliśmy sami.** Własnymi rękami spakowaliśmy pierwsze zamówienie i wysłaliśmy je w dalszą drogę.

**Decyzja:** `AKCEPT / ZMIANA / ODRZUĆ`
**Proponowana zmiana:**

### 2. `story.order_backlog` — Nasza historia

**Cel:** pokazać konkretny zator, zanim gracz pomaga go rozładować.
**Fakty:** wzrost liczby zamówień, ręcznych etykiet i zadań.

1. **Zamówień przybywało szybciej niż miejsca.** Paczki, ręczne etykiety i kolejne zadania zaczęły tworzyć zator w małym magazynie.
2. **Wzrost postawił przed nami nowe wyzwanie.** Gracz porządkuje przepływ zamówień skokiem, ślizgiem i zbieraniem paczek.

**Decyzja:** `AKCEPT / ZMIANA / ODRZUĆ`
**Proponowana zmiana:**

### 3. `story.first_process` — Nasza historia

**Cel:** domknąć zator widocznym skutkiem fabularnym.
**Fakty:** strefy przyjęcia, kontroli, pakowania i wysyłki; powtarzalny proces.

1. **Rosnąca kolejka wymagała czegoś więcej niż improwizacji.** Same ręce i dobre chęci nie wystarczały przy coraz większej liczbie paczek.
2. **Powtarzalny proces pozwolił zrobić następny krok.** Przyjęcie, kontrola, pakowanie i wysyłka układają te same elementy w czytelny przepływ.

**Decyzja:** `AKCEPT / ZMIANA / ODRZUĆ`
**Proponowana zmiana:**

### 4. `story.quality_promise` — Nasza historia

**Cel:** pokazać rzeczywiste przygotowanie urządzenia bez niepotwierdzonych szczegółów testów.
**Fakty:** przyjęcie, uruchomienie, przygotowanie, oznaczenie i pakowanie urządzenia.

1. **Urządzenie trafia na stanowisko przygotowania.** Zanim ruszy dalej, zostaje uruchomione i przygotowane do kolejnego użycia.
2. **Dopiero przygotowane urządzenie otrzymuje oznaczenie.** Znak „SPRAWDZONY” komunikuje rezultat procesu, nie listę niepotwierdzonych testów komponentów.

**Decyzja:** `AKCEPT / ZMIANA / ODRZUĆ`
**Proponowana zmiana:**

### 5. `story.quality_result` — Nasza historia

**Cel:** pokazać rezultat Próby Jakości.
**Fakty:** urządzenie jest przygotowane, oznaczone i rusza do kolejnego użytkownika.

1. **SPRAWDZONY oznacza gotowy do dalszej drogi.** Cztery ukończone serie doprowadziły urządzenia przez ten sam czytelny proces.
2. **Przygotowane urządzenie rusza do kolejnego użytkownika.** Kontrola kończy się zamkniętą paczką, nie abstrakcyjnym symbolem.

**Decyzja:** `AKCEPT / ZMIANA / ODRZUĆ`
**Proponowana zmiana:**

### 6. `client.creative_start` — Historia klienta

**Cel:** opowiedzieć ciągłą historię anonimowej klientki i tego samego laptopa.
**Fakty:** ograniczony budżet, pierwszy projekt, portfolio, rozwinięte miejsce pracy.

1. **Klientka zaczynała z ograniczonym budżetem.** Szukała sprawdzonego narzędzia, które pozwoli jej rozpocząć pracę.
2. **Na wybranym laptopie powstał pierwszy projekt.** Sprzęt stał się narzędziem do wykonania konkretnej pracy.
3. **Kolejne projekty złożyły się na portfolio.** Ten sam laptop towarzyszył klientce na następnym etapie.
4. **Z czasem rozwinęło się całe miejsce pracy.** Początkowy wybór pomógł jej przejść od pierwszego projektu do własnego stanowiska.

**Decyzja:** `AKCEPT / ZMIANA / ODRZUĆ`
**Anonimizacja potwierdzona:** `TAK / NIE`
**Proponowana zmiana:**

### 7. `client.business_growth` — Historia klienta

**Cel:** pokazać rozwój firmy przez konkretny powrót klienta, bez skrótu pozbawionego kontekstu.
**Fakty:** start działalności; budżet do 400 zł; laptop za 300 zł; powrót po roku; budżet 100 000 zł; dalszy wybór sprzętu poleasingowego.

1. **Klient dopiero rozpoczynał działalność.** Przyszedł po laptop do pracy z budżetem nie większym niż 400 zł.
2. **Znalazł laptop za 300 zł.** To było narzędzie na początek, dopasowane do ówczesnych możliwości firmy.
3. **Po roku wrócił do AMSO.** Firma urosła, a pierwszy laptop nadal przypominał, od czego zaczynał.
4. **Tym razem budżet wynosił 100 000 zł.** Mimo rozwoju nadal uznawał sprzęt poleasingowy za dobry wybór dla firmy.

**Decyzja:** `AKCEPT / ZMIANA / ODRZUĆ`
**Anonimizacja potwierdzona:** `TAK / NIE`
**Proponowana zmiana:**

### 8. `client.b2b_trust` — Historia klienta

**Cel:** pokazać ostrożną decyzję firmy B2B i jej konsekwencje, nie deklarować niepotwierdzonej ciągłości współpracy.
**Fakty:** większy plan zakupowy; pierwsze zamówienie równe 10% przygotowanego budżetu; test w pracy; realizacja reszty zakupu; po 7 latach klient nadal wybiera sprzęt poleasingowy.

1. **Firma planowała większy zakup, ale chciała ograniczyć ryzyko.** Przed decyzją potrzebowała sprawdzić sprzęt w codziennej pracy.
2. **Pierwsze zamówienie wykorzystało 10% przygotowanego budżetu.** Dopiero wtedy AMSO poznało skalę całego planu zakupowego.
3. **Pracownicy sprawdzili urządzenia w rzeczywistych zadaniach.** To doświadczenie dało firmie podstawę do dalszej decyzji.
4. **Po udanej próbie firma zrealizowała pozostałą część planu.** Testowe zamówienie otworzyło drogę do właściwego zakupu.
5. **Od tamtej decyzji minęło siedem lat.** Klient nadal wybiera sprzęt poleasingowy, gdy odpowiada potrzebom jego firmy.

**Decyzja:** `AKCEPT / ZMIANA / ODRZUĆ`
**Anonimizacja potwierdzona:** `TAK / NIE`
**Proponowana zmiana:**

### 9. `story.matching_result` — Nasza historia

**Cel:** połączyć trzy historie tezą o dopasowaniu, nie o najniższej cenie.

1. **Trzy historie oznaczały trzy różne zestawy.** Inne potrzeby, plany i budżety wymagały innych konfiguracji sprzętu.
2. **Dobre dopasowanie zaczyna się od zrozumienia zastosowania.** Sprzęt ma odpowiadać realnej pracy klienta i etapowi jego rozwoju.

**Decyzja:** `AKCEPT / ZMIANA / ODRZUĆ`
**Proponowana zmiana:**

### 10. `story.scale` — Nasza historia

**Cel:** wyjaśnić okres, kategorię i jednostkę przed wizualnym porównaniem, a następnie wrócić do ludzi.
**Fakty:** około 28 000 smartfonów rocznie; około 240 m po ułożeniu w wieżę; około 400 000 kg komputerów rocznie; robocze porównanie do pięciu załadowanych Boeingów 737.

1. **W ciągu roku sprzedajemy około 28 000 smartfonów.** To roczna liczba urządzeń jednej kategorii, nie liczba wszystkich zamówień.
2. **Ułożone w wieżę miałyby około 240 metrów.** To wysokość porównywalna z PKiN; każdy telefon był jednak konkretnym zamówieniem.
3. **W ciągu roku wysyłamy około 400 000 kg komputerów.** Mówimy o łącznej masie tej kategorii w rocznym okresie.
4. **To masa porównywalna z pięcioma załadowanymi Boeingami 737.** Porównanie pozostaje robocze do osobnej akceptacji marketingu.
5. **Za skalą stoją ludzie i logistyka.** Magazyn, strefy pracy i zespół zamieniają liczby w przygotowane zamówienia.

**Decyzja:** `AKCEPT / ZMIANA / ODRZUĆ`
**Porównanie Boeing 737:** `AKCEPT / ZMIANA / ODRZUĆ`
**Proponowana zmiana:**

### 11. `story.order_peak_result` — Nasza historia

**Cel:** pokazać, że proces i zespół opanowały trzyfazowy szczyt zamówień.

1. **Proces zamienił szczyt w płynny przepływ.** Kategorie przechodzą przez kompletację, pakowanie i wysyłkę.
2. **Za każdą strefą stoi zespół.** Skoordynowana praca pozwala utrzymać jakość i tempo, gdy wiele zamówień rusza równolegle.

**Decyzja:** `AKCEPT / ZMIANA / ODRZUĆ`
**Proponowana zmiana:**

### 12. `story.million_approach` — Nasza historia

**Cel:** wyjaśnić źródło licznika i sens ostatnich 30 paczek.
**Fakty:** licznik startuje od 999 970 zrealizowanych zamówień; każda zebrana paczka dodaje dokładnie jedno; próg to 1 000 000 zamówień.

1. **999 970 zrealizowanych zamówień.** Do progu miliona prowadzi ostatnich 30 paczek i osiem poznanych kombinacji.
2. **Za każdą liczbą stoi konkretny plan.** Sprzęt pomaga ludziom pracować, uczyć się, rozwijać firmy i realizować pomysły.

**Decyzja:** `AKCEPT / ZMIANA / ODRZUĆ`
**Proponowana zmiana:**

### 13. `challenge.million_wave` — Wyzwanie

**Cel:** jasno opisać dwa warunki bezpiecznego finału fabuły.

1. **Dwa cele prowadzą do miliona.** HUD osobno pokazuje 30 zebranych paczek i osiem ukończonych kombinacji skoku oraz ślizgu.
2. **W fabule nie ma game over.** Pominięta paczka wraca, a błąd powtarza tylko bieżącą kombinację.

**Decyzja:** `AKCEPT / ZMIANA / ODRZUĆ`
**Proponowana zmiana:**

### 14. `story.million_finale` — Nasza historia

**Cel:** świętować milion bez sugerowania końca drogi.

1. **Milion zamówień. Milion ludzkich planów.** Pierwszą paczkę przygotowaliśmy sami, a milionową świętujemy razem z całym zespołem.
2. **Ta droga trwa dalej.** Milion nie kończy biegu. Przed graczem kolejny etap tej samej drogi.

**Decyzja:** `AKCEPT / ZMIANA / ODRZUĆ`
**Proponowana zmiana:**

### 15. `story.challenge_handoff` — Wyzwanie

**Cel:** jawnie wyjaśnić zmianę zasad przed odliczaniem 3–2–1.

1. **Cały dotychczasowy wynik zostaje z Tobą.** Zachowane są punkty, paczki i aktywne bonusy; od tego miejsca osobno liczony jest wynik wyzwania.
2. **Teraz tempo będzie rosło.** Pierwsze niezabezpieczone zderzenie kończy bieg. Aktywna Ochrona może uratować próbę jeden raz.

**CTA:** Podejmuję wyzwanie
**Decyzja:** `AKCEPT / ZMIANA / ODRZUĆ`
**Proponowana zmiana:**

## Fakty wymagające finalnego potwierdzenia

| Fakt lub sformułowanie | Status marketingu | Uwagi |
|---|---|---|
| mały sklep i magazyn wielkości kawalerki | `AKCEPT / ZMIANA / ODRZUĆ` | |
| pierwsza paczka przygotowana własnymi rękami | `AKCEPT / ZMIANA / ODRZUĆ` | |
| opis przygotowania urządzeń bez listy testów komponentów | `AKCEPT / ZMIANA / ODRZUĆ` | |
| anonimowa historia kreatywnego startu | `AKCEPT / ZMIANA / ODRZUĆ` | |
| start działalności, budżet do 400 zł i laptop za 300 zł | `AKCEPT / ZMIANA / ODRZUĆ` | |
| powrót po roku z budżetem 100 000 zł | `AKCEPT / ZMIANA / ODRZUĆ` | |
| pierwsze zamówienie równe 10% przygotowanego budżetu | `AKCEPT / ZMIANA / ODRZUĆ` | |
| po siedmiu latach klient nadal wybiera sprzęt poleasingowy | `AKCEPT / ZMIANA / ODRZUĆ` | |
| około 28 000 smartfonów rocznie | `AKCEPT / ZMIANA / ODRZUĆ` | |
| wieża telefonów około 240 m / porównanie z PKiN | `AKCEPT / ZMIANA / ODRZUĆ` | |
| około 400 000 kg komputerów rocznie | `AKCEPT / ZMIANA / ODRZUĆ` | |
| pięć załadowanych Boeingów 737 | `AKCEPT / ZMIANA / ODRZUĆ` | obecnie jawnie oznaczone jako oczekujące |
| próg 1 000 000 dotyczy zamówień, nie klientów | `AKCEPT / ZMIANA / ODRZUĆ` | |

## Kontrola przed publikacją

- [ ] Każda scena i każdy fakt mają decyzję marketingu.
- [ ] Historie klientów pozostają anonimowe i używają trzeciej osoby.
- [ ] Sceny AMSO nie przypisują firmie doświadczeń klientów.
- [ ] Nigdzie nie występuje stara wartość 300 000 zł.
- [ ] „10%” zawsze oznacza część przygotowanego budżetu.
- [ ] „7 lat” nie jest przedstawiane jako nieprzerwana współpraca bez potwierdzenia.
- [ ] Zakres przygotowania urządzeń nie zawiera niepotwierdzonych testów.
- [ ] Wszystkie CTA są zaakceptowane.
- [ ] Voice-over, dark mode i rozszerzona analityka pozostają poza tym wydaniem.
