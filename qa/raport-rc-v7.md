# Raport release candidate v7

## Wyniki automatyczne

- sześć mikropoziomów kończy się dopiero po minimalnym czasie i celu fal;
- finał: 12 kombinacji, cel konfigurowalny 40–60, wartość produkcyjna 50,
  licznik 999 950 → 1 000 000 i bezpieczny powrót pominiętych paczek;
- brak aktywnej walki z bossem i wózka widłowego w finale fabularnym;
- challenge: 1,85× → 2,4× → 3,0× → 3,5×, pięć mechanicznych osi presji,
  minimalna reakcja 1,2 s i oddech po burst;
- sterowanie: skok, hybrydowy ślizg `S`/`↓`, bufor 110 ms i ten sam kontrakt dotyku;
- bonusy: maksymalnie dwa, widoczny czas/ładunek, jednorazowa pauza demonstracyjna
  2,8 s z blokadą wejścia;
- autonomiczny HTML zawiera konfigurację i wszystkie obrazy bez sieci;
- raport lokalny bez PII zawiera segmenty, fale, retry, błędy akcji, first-attempt
  rate, zbieranie, combo, typ kolizji, wynik challenge, FPS i utracone klatki;
  w konsoli autonomicznego HTML wywołaj
  `AMSOMillionRunnerQA.qaReport()` albo `AMSOMillionRunnerQA.copyQaReport()`.
- smoke test autonomicznego pliku przeszedł bez błędów konsoli w Playwright
  Chromium i WebKit dla 1440×900, 390×844 oraz `reduced motion`;
- w każdym z sześciu wariantów osadzony WebP został zdekodowany (`1672 px`),
  nie powstał poziomy overflow, a tekst fabuły nie otrzymał ciężkiego czarnego
  obramowania ani cienia.

## Wartości balansu

| Obszar | Wartość |
| --- | --- |
| Obowiązkowy gameplay | 285 s + retry i payoff |
| Fabuła | 0,95×–1,85× |
| Challenge | 1,85×–3,5× w 180 s |
| Reakcja fabuła / dotyk | min. 1,6 s / 1,7 s |
| Reakcja challenge | min. 1,2 s |
| Zaliczenie fali | akcja + co najmniej 60% paczek |
| Combo | za falę, maks. ×8 |
| Finał | 12 kombinacji, 50 paczek |

## Macierz manualna — otwarte kryterium ludzkie

| Środowisko | Start offline | 2 mikropoziomy | HUD bez wyjaśnienia | Tło/przejścia | Wynik |
| --- | --- | --- | --- | --- | --- |
| Safari macOS | ☐ | ☐ | ☐ | ☐ | — |
| Chrome macOS/Windows | ☐ | ☐ | ☐ | ☐ | — |
| Edge Windows | ☐ | ☐ | ☐ | ☐ | — |
| Opera Windows | ☐ | ☐ | ☐ | ☐ | — |
| Telefon 390 px | ☐ | ☐ | ☐ | ☐ | — |
| Reduced motion | ☐ | ☐ | ☐ | ☐ | — |

Ticket 03 pozostaje `ready-for-human`. Nie zaznaczać decyzji „zaakceptowano do
skalowania”, dopóki testerzy nie przejdą procedury poniżej i nie zapiszą wyników.

## Procedura odbioru pionowego wycinka

1. Otwórz `droga-do-miliona-qa.html` lokalnie bez serwera i bez sieci.
2. Przejdź `Pierwszą paczkę` oraz `Zator Zamówień` bez dodatkowego tłumaczenia HUD.
3. Zapisz czas obu poziomów, liczbę retry i to, co według testera oznacza bieżący cel.
4. Sprawdź cel pierwszego zaliczenia 70–85%; wynik wyższy oznacza zbyt łatwy balans,
   niższy — trudność albo nieczytelność.
5. Wymuś jedną kolizję i potwierdź identyczny retry bez adaptive assist.
6. Sprawdź przejście świata, wycentrowanie tła pod kartą i brak przewinięcia kartą
   przez resztkową Spację.
7. Skopiuj raport poleceniem `AMSOMillionRunnerQA.copyQaReport()` i dopisz ocenę
   czytelności oraz decyzję o balansie.

## Znane ograniczenia

- automaty nie zastępują oceny znaczenia ilustracji, rytmu audio ani zrozumiałości HUD;
- Playwright WebKit jest użytecznym testem zgodności silnika, ale nie zastępuje
  ręcznego odbioru w rzeczywistym Safari; testy nie obejmują też Windows Edge i Opery,
  dlatego macierz pozostaje jawnie niezatwierdzona;
- pomiar FPS i utraconych klatek wymaga profilera podczas manualnego testu 3,5×.
