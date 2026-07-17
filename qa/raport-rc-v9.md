# Raport odbioru release candidate v9

## Stan automatyczny

- `npm run build:all` buduje produkcję, autonomiczny HTML, CSV marketingowy i
  przegląd kadrów;
- `npm test` obejmuje kontrakty gameplay, mobile fullscreen, dekodowanie WebP,
  fale, rekordy, celebracje, shield i ciągłość światów;
- `npm run typecheck` przechodzi bez błędów;
- `droga-do-miliona-qa.html` osadza siedem WebP światów i oba lockupy, więc nie
  wymaga sieci po otwarciu lokalnym;
- jasny fallback pojedynczego świata nie zastępuje kampanii globalnym ekranem
  awarii.

Automaty nie zastępują pomiaru FPS ani oceny wizualnej na fizycznym Androidzie,
Safari i Edge. Poniższa macierz pozostaje obowiązkowym etapem odbioru.

## Deterministyczna sesja odbiorowa

1. Wyłącz sieć i otwórz `droga-do-miliona-qa.html` lokalnie, a na Androidzie
   także przez `content://`.
2. Sprawdź portrait od 390 px oraz landscape około 960×315. Landscape nie może
   pokazać blokady rozmiaru.
3. Naciśnij kontrolkę pełnego ekranu. Wspierana przeglądarka ma wejść do
   fullscreen; brak lub odmowa API ma uruchomić opisany `Tryb gry`, ukryć header
   i footer oraz pozostawić widoczne wyjście.
4. W fabule sprawdź `S` i `↓`: przysiad zaczyna się na `keydown`, trwa przez
   przytrzymanie i kończy na `keyup`. Gest w dół nadal wykonuje krótki ślizg.
5. Oceń pomarańczowy pas, gładkie większe `A`, białe stopy poniżej zakończenia
   nóg oraz wolniejszy, naturalny rytm kuriera.
6. Na starcie i po podniesieniu Gwarancji sprawdź dokładnie jedno duże
   pomarańczowe koło. Ma subtelnie oddychać, nie kurczyć się w skoku ani
   przysiadzie i zniknąć po pojedynczym efekcie pęknięcia.
7. Przejdź spokojny tutorial, fabularne serie dwóch działań oraz challenge z
   seriami do trzech przeszkód. Paczki muszą wskazywać osiągalną trajektorię i
   nie mogą przecinać przeszkód.
8. Potwierdź brak Audytu w paczkach, HUD, wskazówkach i efektach gameplay.
9. Odbierz progi 10, 50, 100, 500 i 1 000. Każdy wariant musi wyglądać jak
   konfetti, różnić się kompozycją i nie zawierać następnego progu.
10. Przekrocz osobisty rekord. `NOWY REKORD` ma pojawić się raz; przy zbiegu z
    progiem ma powstać jedna wspólna celebracja.
11. Obserwuj wszystkie siedem światów. Panele i neutralny łącznik muszą stykać
    się bez crossfade, odbicia, białej szczeliny i skoku fazy. Pod kartą historii
    obraz ma być spokojnie wycentrowany.
12. Zakończ próbę i sprawdź wspólną bazową linię wszystkich liczb na karcie
    wyników, szczególnie `Wynik łączny`.
13. Skopiuj anonimowy raport przez `AMSOMillionRunnerQA.copyQaReport()` i wpisz
    wyniki do macierzy.

## Macierz urządzeń i wydajności

W kolumnach FPS wpisz średnią i p95 czasu klatki. Cel: średnio co najmniej
58 FPS i p95 nie więcej niż około 20 ms w najcięższej scenie.

| ID | Silnik / źródło | Viewport | DPR | Offline | Fullscreen / Tryb gry | Światy | Gameplay i nagrody | Śr. FPS | p95 ms | Wynik |
| --- | --- | ---: | ---: | --- | --- | --- | --- | ---: | ---: | --- |
| android-content-portrait | Android Chromium `content://` | 390×844 | 2–3 | ☐ | ☐ | ☐ | ☐ | — | — | — |
| android-content-landscape | Android Chromium `content://` | ok. 960×315 | 2–3 | ☐ | ☐ | ☐ | ☐ | — | — | — |
| edge-windows | Edge, lokalny plik | 1440×900 | 1–2 | ☐ | ☐ | ☐ | ☐ | — | — | — |
| opera-windows | Opera, lokalny plik | 1440×900 | 1–2 | ☐ | ☐ | ☐ | ☐ | — | — | — |
| safari-macos | Safari, lokalny plik | 1440×900 | 2 | ☐ | ☐ | ☐ | ☐ | — | — | — |
| safari-ios-portrait | Safari iOS, lokalny dokument | 390×844 | 3 | ☐ | ☐ | ☐ | ☐ | — | — | — |
| chromium-wide | Chromium, serwer lokalny | 1920×1080; pole ≤1600 | 1–2 | ☐ | ☐ | ☐ | ☐ | — | — | — |
| reduced-motion | Chromium albo WebKit | 1440×900 | 1–2 | ☐ | ☐ | ☐ | ☐ | — | — | — |

## Kryterium wydania

Release można zatwierdzić po przejściu pełnej macierzy bez czarnego świata,
martwej kontrolki fullscreen, białej szczeliny, podwójnego shielda,
nieosiągalnej paczki, abstrakcyjnej celebracji ani spadku poniżej uzgodnionego
budżetu wydajności. Pasek systemowy przy `content://` jest kontrolowany przez
Androida i nie jest obietnicą CSS-owego `Trybu gry`.
