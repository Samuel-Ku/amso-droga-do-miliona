# Raport odbioru release candidate v8

> Dokument historyczny. Aktualną procedurę wdrożenia Vercel określa ADR 0009.

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
4. W aktywnym biegu sprawdź osobno skok przez `W`, `↑`, Spację, klik myszą oraz
   tap na ekranie dotykowym. Sprawdź osobno ślizg przez `S`, `↓` i gest w dół.
   Strzałki nie mogą przewijać strony podczas biegu, ale poza gameplay powinny
   zachowywać standardowe działanie. Wyniku desktop nie wolno uznać za test tap,
   a wyniku telefonu za test kliknięcia myszą.
5. Przy pierwszym wejściu w kartę historii przytrzymaj poprzednią Spację:
   karta nie może się przełączyć. Następnie kliknij `Dalej` od razu — klik ma
   zadziałać bez blokady czasowej.
6. Na kolejnej karcie wykonaj nowe, krótkie naciśnięcie Spacji. Karta powinna
   przejść dokładnie raz; przytrzymanie nie może przełączyć następnej karty.
7. Podczas każdej pauzy historii oceń, czy tło płynnie dochodzi do centralnego
   kadru, a granica cyklu nie zatrzymuje się pod tekstem.
8. W aktywnym biegu obserwuj jeden pełny cykl paralaksy: wybierz rozpoznawalny
   element tła, zaczekaj aż opuści kadr i pojawi się ponownie z prawej strony.
   Pełne zawinięcie nie może pokazać białej szczeliny, odbicia ani skoku fazy.
9. Obserwuj pełne przejście między dwoma światami. Stary i nowy
   obraz mają pokrywać cały kadr, bez białej szczeliny, odbicia lub przesunięcia.
10. Potwierdź, że przeszkody nie mają napisów, plakietek ani piktogramów, a
   kolekcjonerskie i bonusowe paczki zachowują własne oznaczenia.
11. Na bezpiecznym starcie sprawdź pomarańczowy ciągły shield bez wpisu bonusu
    w HUD. Poczekaj na koniec ochrony startowej i potwierdź stan bez shielda.
12. Po zebraniu bonusu sprawdź ten sam shield i `GWARANCJA AMSO CARE ×1`. Z aktywną
    Gwarancją wykonaj skok i ślizg: obrys ma podążać za kurierem, zmienić się w
    niższy owal podczas ślizgu i nie obejmować niesionej paczki.
13. Wymuś kolizję z aktywną Gwarancją. Powinien pojawić się krótki efekt
    pęknięcia, bieg powinien trwać, a shield i `×1` powinny zniknąć. Nie może
    pojawić się słowo `OCHRONA` ani fioletowy przerywany obrys.
14. Przejdź fabułę do miliona i potwierdź płynne przejście do Trybu Wyzwania
    bez resetu wyniku i liczby paczek.
15. Kontynuuj do prędkości 3,5×. Krok ma przyspieszać płynnie, bez drgania;
    skok i ślizg muszą zachowywać stabilną pozę oraz hitbox.
16. Skopiuj anonimowy raport przez `AMSOMillionRunnerQA.copyQaReport()` i zapisz
    tylko metryki sesji oraz identyfikator wariantu z tabeli poniżej.

## Macierz środowisk

Warianty `standalone` wymagają osobnego odświeżenia autonomicznego pliku.
Warianty `site-container` uruchom przez `npm run dev`, otwórz
`http://localhost:5173/` i ustaw viewport 1920×1080: pole kampanii ma pozostać
wycentrowane oraz ograniczone do 1600 px. Po załadowaniu odłącz zewnętrzną sieć,
pozostawiając działający serwer lokalny. W kolumnie `Wynik` wpisz wyłącznie
`PASS` albo krótki identyfikator defektu.

| ID | Silnik / urządzenie | Viewport | DPR | Ruch | Offline | Pełna sesja | Tło i kadr | Gwarancja | Krok / sterowanie | Wynik |
| --- | --- | ---: | ---: | --- | --- | --- | --- | --- | --- | --- |
| chromium-standalone-desktop-dpr1 | Chromium standalone | 1440×900 | 1 | pełny | ☐ | ☐ | ☐ | ☐ | ☐ | — |
| chromium-site-container-dpr2 | Chromium site-container | 1920×1080; pole ≤1600 | 2 | pełny | ☐ | ☐ | ☐ | ☐ | ☐ | — |
| chromium-standalone-portrait-dpr3 | Chromium telefon, portret | 390×844 | 3 | pełny | ☐ | ☐ | ☐ | ☐ | ☐ | — |
| chromium-standalone-landscape-dpr3 | Chromium telefon, krajobraz | 844×390 | 3 | pełny | ☐ | ☐ | ☐ | ☐ | ☐ | — |
| webkit-standalone-desktop-dpr1 | WebKit / Safari standalone | 1440×900 | 1 | pełny | ☐ | ☐ | ☐ | ☐ | ☐ | — |
| webkit-site-container-dpr2 | WebKit / Safari site-container | 1920×1080; pole ≤1600 | 2 | pełny | ☐ | ☐ | ☐ | ☐ | ☐ | — |
| webkit-standalone-portrait-dpr3 | WebKit / Safari telefon, portret | 390×844 | 3 | pełny | ☐ | ☐ | ☐ | ☐ | ☐ | — |
| webkit-standalone-landscape-dpr3 | WebKit / Safari telefon, krajobraz | 844×390 | 3 | pełny | ☐ | ☐ | ☐ | ☐ | ☐ | — |
| chromium-standalone-reduced-motion | Chromium standalone | 1440×900 | 1 | ograniczony | ☐ | ☐ | ☐ | ☐ | ☐ | — |
| webkit-standalone-reduced-motion | WebKit / Safari standalone | 1440×900 | 1 | ograniczony | ☐ | ☐ | ☐ | ☐ | ☐ | — |

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
