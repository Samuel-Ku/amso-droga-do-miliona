# QA release candidate — Droga do Miliona v5

## Automatyczne bramki

Uruchomić przed każdym kandydatem:

```bash
npm run typecheck
npm test -- --run
npm run build
npm run build:single
```

Stan z 2026-07-15: typecheck, 177 testów, build produkcyjny, single-file build i eksport CSV zakończone powodzeniem.

## Macierz viewportów

Automatyczny runtime przeglądarki był niedostępny 2026-07-15. Poniższych statusów nie wolno zmieniać na zaliczone wyłącznie na podstawie testów statycznych lub CSS.

| Szerokość | Oczekiwany wariant | Status |
|---:|---|---|
| 390 px | minimalny obsługiwany mobile | do ręcznego QA |
| 756 px | ostatni układ mobilny | do ręcznego QA |
| 757 px | pierwszy szerszy układ | do ręcznego QA |
| 1280 px | desktop | do ręcznego QA |
| 1600 px | maksymalna szerokość kontenera sklepu | do ręcznego QA |
| 1920 px | szeroki ekran z treścią ograniczoną do 1600 px | do ręcznego QA |

Poniżej 390 px gra ma pokazać jasną blokadę rozmiaru. Na każdym obsługiwanym widoku sprawdzić: brak przycięć, wspólną linię podłoża, brak nakładania copy na grę, poprawną tablicę `999 970 → 1 000 000` i brak czarnego ekranu.

## Krytyczna ścieżka

1. Nowy profil widzi intro wyjaśniające cel gry, bezpieczne czytanie, skok, ślizg, paczki, bonusy i serię.
2. Wszystkie 15 scen i 42 ekrany czekają na działanie gracza; w bezpiecznej scenie nie powstają paczki ani przeszkody.
3. Po każdej scenie pełne `3–2–1` poprzedza powrót sterowania.
4. Rozgrywka fabularna trwa 276 aktywnych sekund; czytanie nie zwiększa tego czasu.
5. Fale w całości wjeżdżają spoza prawej krawędzi. Paczki, bonusy i przeszkody nie nakładają hitboxów.
6. `Zator Zamówień`, `Próba Jakości`, trzy historie klientów, `Wyzwanie Dopasowania` i `Szczyt Zamówień` mają czytelny skutek w następującej scenie.
7. Tablica zaczyna od `999 970`; każda z 30 paczek dodaje jeden, a osiem kombinacji ma osobny licznik.
8. Po obu celach następuje 3,5 sekundy bezpiecznej celebracji i komunikat `Droga trwa dalej`.
9. Modal `TRYB WYZWANIA` wyjaśnia zachowanie wyniku, rosnące tempo i game over po pierwszej niezabezpieczonej kolizji.
10. Wynik, paczki i aktywne bonusy przechodzą do challenge. Ochrona działa dokładnie raz i nie zużywa się w fabule.
11. Wynik końcowy osobno pokazuje wynik łączny, wynik challenge i lokalny rekord challenge. Pierwszy wynik ma właściwą etykietę.
12. Facebook i Instagram generują kartę wyniku i niczego nie publikują automatycznie.

## Dostępność i urządzenia

Ręcznie potwierdzić:

- klawiaturę, dotyk, pułapkę fokusu i komunikaty czytnika ekranu;
- reduced motion bez utraty treści;
- fullscreen, obrót, resize i powrót z tła bez resetu;
- rzeczywiste telefony o szerokości co najmniej 390 px;
- czytelność aktywnej Ochrony w HUD i jako konturu kuriera.

## Test zrozumienia (5 osób)

Warunek odbioru: co najmniej 4 z 5 osób:

- rozumie cel gry i bezpieczne momenty czytania;
- odróżnia historię AMSO od historii klientów;
- potrafi streścić co najmniej dwie historie klientów;
- wyjaśnia, skąd pochodzą dane roczne i licznik 999 970;
- zauważa zmianę zasad po przejściu do Trybu Wyzwania.

## Blokady publikacji

- marketing musi wypełnić decyzje w `copydeck_droga_do_miliona_dla_marketingu_v1.md`;
- porównanie 400 000 kg do pięciu Boeingów 737 pozostaje niezatwierdzone;
- voice-over i rozszerzona analityka są poza release candidate;
- dark mode został usunięty; wydanie jawnie używa wyłącznie light mode.
- visual QA, testy urządzeniowe i test zrozumienia pozostają do wykonania przez człowieka; brak runtime przeglądarki nie jest zaliczeniem tych bramek.
