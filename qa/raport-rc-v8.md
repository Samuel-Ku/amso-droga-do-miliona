# Raport odbioru release candidate v8

## Stan automatyczny

- `npm run build:all` buduje wersję produkcyjną, autonomiczny HTML, CSV dla
  marketingu oraz przegląd kadrów;
- `npm test` przechodzi w całości;
- autonomiczny `droga-do-miliona-qa.html` zawiera obrazy świata i konfigurację,
  dlatego podstawowy test należy wykonać lokalnie z wyłączoną siecią;
- raport sesji nie zawiera danych osobowych. Po biegu można go pobrać z konsoli
  przez `AMSOMillionRunnerQA.copyQaReport()`.

Automaty potwierdzają kontrakty stanu i renderowania, ale nie zastępują oceny
szczeliny tła, kadru historii, czytelności Gwarancji ani naturalności kroku.

## Jedna deterministyczna sesja pionowa

Przed rozpoczęciem zamknij poprzednią kartę gry albo użyj nowego profilu
przeglądarki. Nie przenoś wyniku z wcześniejszego uruchomienia.

1. Wyłącz sieć i otwórz lokalnie `droga-do-miliona-qa.html`.
2. Potwierdź brak czarnego ekranu, błędów konsoli oraz poziomego overflow.
3. Przejdź intro i rozpocznij Tryb Historii.
4. W aktywnym biegu sprawdź kolejno skok przez `W`, `↑`, Spację i klik/tap oraz
   ślizg przez `S`, `↓` i gest w dół. Strzałki nie mogą przewijać strony podczas
   biegu, ale poza gameplay powinny zachowywać standardowe działanie.
5. Przy pierwszym wejściu w kartę historii przytrzymaj poprzednią Spację:
   karta nie może się przełączyć. Następnie kliknij `Dalej` od razu — klik ma
   zadziałać bez blokady czasowej.
6. Podczas każdej pauzy historii oceń, czy tło płynnie dochodzi do centralnego
   kadru, a granica cyklu nie zatrzymuje się pod tekstem.
7. Wróć do biegu i obserwuj pełne przejście między dwoma światami. Stary i nowy
   obraz mają pokrywać cały kadr, bez białej szczeliny, odbicia lub przesunięcia.
8. Potwierdź, że przeszkody nie mają napisów, plakietek ani piktogramów, a
   kolekcjonerskie i bonusowe paczki zachowują własne oznaczenia.
9. Na bezpiecznym starcie sprawdź pomarańczowy ciągły shield bez wpisu bonusu w
   HUD. Po zebraniu bonusu sprawdź ten sam shield i `GWARANCJA 48 M ×1`.
10. Wymuś kolizję z aktywną Gwarancją. Powinien pojawić się krótki efekt
    pęknięcia, bieg powinien trwać, a shield i `×1` powinny zniknąć. Nie może
    pojawić się słowo `OCHRONA` ani fioletowy przerywany obrys.
11. Przejdź fabułę do miliona i potwierdź płynne przejście do Trybu Wyzwania
    bez resetu wyniku i liczby paczek.
12. Kontynuuj do prędkości 3,5×. Krok ma przyspieszać płynnie, bez drgania;
    skok i ślizg muszą zachowywać stabilną pozę oraz hitbox.
13. Skopiuj anonimowy raport przez `AMSOMillionRunnerQA.copyQaReport()` i zapisz
    tylko metryki sesji oraz identyfikator wariantu z tabeli poniżej.

## Macierz środowisk

Każdy wiersz wymaga osobnego odświeżenia autonomicznego pliku. W kolumnie
`Wynik` wpisz wyłącznie `PASS` albo krótki identyfikator defektu.

| ID | Silnik / urządzenie | Viewport | DPR | Ruch | Offline | Pełna sesja | Tło i kadr | Gwarancja | Krok / sterowanie | Wynik |
| --- | --- | ---: | ---: | --- | --- | --- | --- | --- | --- | --- |
| C-D1 | Chromium desktop | 1440×900 | 1 | pełny | ☐ | ☐ | ☐ | ☐ | ☐ | — |
| C-D2 | Chromium, kontener witryny | 1600×900 | 2 | pełny | ☐ | ☐ | ☐ | ☐ | ☐ | — |
| C-P3 | Chromium telefon, portret | 390×844 | 3 | pełny | ☐ | ☐ | ☐ | ☐ | ☐ | — |
| C-L3 | Chromium telefon, krajobraz | 844×390 | 3 | pełny | ☐ | ☐ | ☐ | ☐ | ☐ | — |
| W-D1 | WebKit / Safari desktop | 1440×900 | 1 | pełny | ☐ | ☐ | ☐ | ☐ | ☐ | — |
| W-D2 | WebKit / Safari desktop | 1600×900 | 2 | pełny | ☐ | ☐ | ☐ | ☐ | ☐ | — |
| W-P3 | WebKit / Safari telefon, portret | 390×844 | 3 | pełny | ☐ | ☐ | ☐ | ☐ | ☐ | — |
| W-L3 | WebKit / Safari telefon, krajobraz | 844×390 | 3 | pełny | ☐ | ☐ | ☐ | ☐ | ☐ | — |
| C-RM | Chromium desktop | 1440×900 | 1 | ograniczony | ☐ | ☐ | ☐ | ☐ | ☐ | — |
| W-RM | WebKit / Safari desktop | 1440×900 | 1 | ograniczony | ☐ | ☐ | ☐ | ☐ | ☐ | — |

## Kryteria decyzji

`PASS` wymaga łącznie:

- braku czarnego ekranu, błędów konsoli i poziomego overflow;
- braku białej szczeliny, lustrzanego tła i granicy cyklu zatrzymanej w centrum;
- pełnokadrowego crossfade oraz centralnego tła pod każdą kartą historii;
- jednej pomarańczowej semantyki Gwarancji i poprawnego cyklu zużycia;
- czytelnych przeszkód bez overlayów oraz zachowanych oznaczeń paczek;
- naturalnego kroku przy początku i 3,5× oraz poprawnych mapowań wejścia;
- pełnej informacji w reduced motion bez intensywnego pulsu lub pęknięcia.

Release v8 można oznaczyć jako odebrany dopiero po `PASS` w całej macierzy i
zamknięciu wszystkich pustych kryteriów w ticketach 02, 03 i 07.
