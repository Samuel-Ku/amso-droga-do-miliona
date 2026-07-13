# Droga do Miliona v4 — czytelność, tempo i ciąg dalszy

Status: zatwierdzony do implementacji 2026-07-13

Dokument uzupełnia biblię narracyjną
[`amso_droga_do_miliona_scenariusz.md`](./amso_droga_do_miliona_scenariusz.md)
i zastępuje w obszarze UX oraz tempa ustalenia v3.

## Cel

Historia ma być czytelna bez jednoczesnego pilnowania przeszkód. Gra i opowieść
tworzą jeden przebieg, ale w danym momencie gracz wykonuje tylko jedno zadanie:
czyta albo gra. Milionowe zamówienie jest kamieniem milowym, po którym pierwszy
przebieg przechodzi bez resetu do `Próba Miliona`.

## Niezmienne zasady

- wszystkie zatwierdzone fakty, liczby i sens trzech anonimowych historii zostają;
- wolno redagować polskie nagłówki, łączniki i kolejność dla lepszej dramaturgii;
- voice-over nie wchodzi do tego etapu;
- story nie ma game over; challenge kończy pierwsza niechroniona kolizja;
- nie ma zapisu częściowego ani checkpointów story;
- dopiero pełne przejście zapisuje `storyCompleted` i odblokowuje challenge.

## Osiemnaście scen

Story ma dokładnie 18 stabilnych kart. Tekst karty nie zmienia się ani nie znika,
dopóki gracz nie wybierze `Dalej`. Karta zawiera jeden nagłówek, najwyżej dwa
krótkie akapity i jeden wizualny motyw. Ostatnia karta ma CTA
`Jedziemy dalej — Próba Miliona`.

Podział:

1. intro — 3 sceny;
2. początek — 2 sceny;
3. drugie życie sprzętu — 2 sceny;
4. trzy historie klientów — 4 sceny;
5. skala i logistyka — 3 sceny;
6. droga do miliona — 2 sceny;
7. milionowa paczka i podziękowanie — 2 sceny.

Pierwsze trzy sceny:

1. `Dobra. Pierwsza gotowa.` — animacja pierwszej paczki;
2. mały magazyn i kilka półek — początek AMSO;
3. `Dobry sprzęt nie musi być nowy. Musi być sprawdzony.` — teza kampanii.

Po trzeciej scenie przycisk ma etykietę `Zaczynamy`.

## Tryb czytania

Podczas każdej sceny:

- karta jest wyśrodkowana, nie przy dolnej krawędzi;
- HUD jest ukryty;
- tło jest przyciemnione i delikatnie rozmyte;
- runner jedzie na autopilocie z prędkością `0.3x`;
- tempo story nie rośnie;
- wszystkie przeszkody, paczki, symbole i nagrody są usunięte;
- scena ma interaktywny przycisk i działający scroll przy powiększeniu tekstu;
- body ma minimum 18 px w portrait i 16 px w krótkim landscape;
- tekst nie przekracza komfortowej szerokości wiersza.

Po `Dalej`, jeżeli następny krok jest grą, pojawia się
`Wracamy do gry` oraz odliczanie `3–2–1`. Trasa pozostaje pusta do końca
odliczania. Dopiero potem wracają sterowanie, paczki i przeszkody.

## Tempo aktywnej gry

Minimalny czas pod kontrolą gracza wynosi 300 sekund:

| Epoka | Aktywny czas |
| --- | ---: |
| Początek | 45 s |
| Drugie życie sprzętu | 55 s |
| Historie klientów | 60 s |
| Skala i logistyka | 65 s |
| Droga do Miliona | 75 s |

Sceny, autopilot i odliczanie nie powiększają aktywnego czasu. Prędkość rośnie
płynnie wyłącznie podczas aktywnej gry od `0.8x` do `1.15x`. Challenge zaczyna
się od `1.15x` i zachowuje limit `1.55x`. Wszystkie mnożniki i czasy pozostają
w zewnętrznym configu.

## Sekwencja i cele

Każda epoka ma widoczny cel. Niewykonanie celu nie blokuje historii. Power-up
epoki jest zawsze przyznawany; sukces daje punkty, mocniejszą celebrację i status
celu.

### Epoka 1 — Pierwsza trasa

- krótka nauka skoku i ślizgu;
- 10–12 mieszanych, czytelnie zapowiedzianych kombinacji;
- finał `Kablowy Chaos` wymagający naprzemiennie skoku i ślizgu.

### Epoka 2 — Audyt jakości

- cztery serie po trzy kombinacje;
- pełna seria daje stempel `SPRAWDZONY`;
- kolizja zeruje tylko bieżącą serię;
- finał `Chmura Wątpliwości`.

### Epoka 3 — Trzy kontrakty

- `Kreatywny start` — zebrać oznaczony zestaw sprzętu;
- `Rozwój firmy` — zbudować wymagane combo;
- `Zaufanie na lata` — przejść najdłuższą czystą serię;
- finał `Budżetożerca`.

### Epoka 4 — Fala zamówień

- pierwsze 45 s to kolejka zamówień PC, notebook, monitor i telefon;
- cel podstawowy: sześć zamówień;
- po szóstym powstają zamówienia bonusowe;
- ostatnie 20 s to trzy fazy `Logistyczna Hydra`.

### Epoka 5 — Fala Miliona

- 15 s: licznik `999 970 → 999 980 → 999 990 → 999 999`;
- cztery fazy po 12 s: porządek, jakość, rozsądny wybór, logistyka;
- 12 s: końcowa Fala Miliona;
- w uczciwych kombinacjach wraca osiem symboli drogi i wszystkie trzy power-upy;
- pominięty symbol wraca, nie jest zbierany automatycznie.

## Uczciwe nagrody

`Bezpieczna` oznacza wykonalna, nie pusta. Nagrody i symbole są częścią
zaprojektowanych kombinacji skoku lub ślizgu. Generator musi:

- tworzyć nagrodę i przeszkodę jako jeden wzorzec;
- zapewnić co najmniej jedną bezkolizyjną trajektorię;
- zachować okno reakcji odpowiednie do bieżącej prędkości;
- nigdy nie nakładać hitboxu nagrody na hitbox przeszkody;
- odroczyć wzorzec, jeżeli na trasie nie ma na niego miejsca;
- nie uruchamiać zwykłego spawnu do czasu opuszczenia wzorca przez ekran.

## Milion i challenge

Milion nie pokazuje ekranu wyniku story i nie kończy biegu. Ostatnia scena gratuluje
i wyjaśnia zmianę reguł. Po CTA oraz `3–2–1` ten sam `RunnerGame` przechodzi do
challenge:

- widoczny wynik, liczba paczek, combo i aktywne power-upy pozostają;
- niewykorzystana gwarancja może ochronić jedną kolizję;
- prędkość zaczyna się od `1.15x`;
- pierwsze pełne przejście dostaje jeden konfigurowalny bonus;
- bonus nie powtarza się przy replayu story;
- późniejsze bezpośrednie uruchomienia challenge zaczynają od zera i bez power-upów;
- po przejściu nie ma tekstów fabularnych.

## Persistence

Nie zapisujemy scen, epok, wyniku ani częściowego przebiegu. Reload przed końcem
wraca do pierwszej sceny i wyniku zero. Profil zapisuje tylko ukończenie story,
odblokowanie challenge, rekord challenge, mute i preferencję fullscreen.

## Kryteria odbioru

- żadna karta nie zmienia zawartości bez działania gracza;
- w trybie czytania aktywne przeszkody i collectable mają liczność zero;
- po 60 s pozostawienia pierwszej sceny aktywny czas story nadal wynosi zero;
- suma minimalnych aktywnych segmentów wynosi 300 s;
- story speed ma zakres `0.8–1.15x` i rośnie tylko w segmentach gry;
- po scenie zawsze działa pełne odliczanie 3 s;
- wszystkie 18 scen są osiągalne w kolejności;
- reload niedokończonego story zaczyna prolog;
- fair-pattern tests sprawdzają hitboxy i okna reakcji dla każdego reward pattern;
- pierwsze ukończenie przechodzi do challenge bez resetu stanu;
- replay nie przyznaje jednorazowego bonusu;
- finalny single-file działa przy 360, 390, 430 px i w krótkim landscape;
- pełna macierz urządzeń oraz wysokość bonusu są strojone po playteście.
