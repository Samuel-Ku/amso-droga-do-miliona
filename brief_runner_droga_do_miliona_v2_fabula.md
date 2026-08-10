> **Status:** dokument archiwalny (`superseded`).  
> **Aktualne źródło wymagań implementacyjnych:** [`scenariusz_implementacyjny_droga_do_miliona_v3.md`](./scenariusz_implementacyjny_droga_do_miliona_v3.md).  
> Dokument pozostaje w repozytorium wyłącznie jako historia wcześniejszych założeń.

# BRIEF DLA AGENTA DEWELOPERSKIEGO (v2 — aktualizacja fabularna)
## Projekt: "Droga do Miliona" — mini-gra AMSO.pl
## Zmiana: dodanie warstwy narracyjnej/historycznej (dotychczasowy gameplay jest już wdrożony jako demo)

---

## 0. KONTEKST ZMIANY

Obecna wersja gry (demo) działa jako klasyczny endless runner z licznikiem paczek, ale nie opowiada historii firmy — jest to "sucha" mechanika bez treści edukacyjnej. Kampania "Milion zamówień. Milion powodów, żeby zaufać AMSO" wymaga, by gra była nośnikiem historii firmy, a nie tylko liczbą. Poniżej nowa warstwa fabularna do nałożenia na istniejący gameplay — mechanika ruchu/skoku/kolizji zostaje, zmienia się struktura poziomów, treść i pacing.

---

## 1. NOWA FILOZOFIA GRY

**Zamiast:** nieskończony bieg w jednej scenerii z rosnącym licznikiem.

**Wprowadzamy:** podróż przez 18 lat historii AMSO — gracz przebiega przez chronologiczne "epoki" firmy, każda z własną scenerią, przeszkodami symbolizującymi realne wyzwania biznesowe i faktami odblokowywanymi za konkretne osiągnięcia w grze (nie losowo, ale jako nagroda za akcję).

**Zasada narracyjna:** fakty i historia nie są "wyświetlane", są "odkrywane" przez rozgrywkę — gracz zdobywa je aktywnie (zbierając, unikając, przechodząc poziom bez kolizji), co zwiększa zapamiętywalność i emocjonalne zaangażowanie względem suchego czytania treści promocyjnych.

**Ton końcowy:** komunikat finałowy nie brzmi "mamy milion zamówień", tylko "przeszliśmy tę drogę razem z Tobą" — gracz staje się częścią historii, nie tylko jej obserwatorem.

---

## 2. STRUKTURA POZIOMÓW (EPOKI)

Gra dzieli się na 5 sekwencyjnych segmentów (epok), połączonych krótkimi przejściami narracyjnymi (cutscene, 2-3 sek, tekst na ekranie + zmiana tła). Gracz przechodzi przez wszystkie epoki w jednej sesji (rosnąca trudność = naturalna progresja fabularna).

| # | Epoka | Okres/etap | Scena/tło | Motyw fabularny |
|---|---|---|---|---|
| 1 | Początek | 2008 | Mały magazynek "wielkości kawalerki" | Start od zera, pierwszy sklep w Krakowie |
| 2 | Skalowanie | ~2012-2015 | Rozbudowany magazyn (3000 m2), wózki widłowe | Wzrost, automatyzacja procesów |
| 3 | Zaufanie biznesowe | ~2016-2019 | Salon z klientem B2B | Historia klienta: testowe zamówienie 10% -> 7 lat współpracy |
| 4 | Jakość i audyt | ~2020-2023 | "Cel serwisowa" / stanowisko testowe | Każdy sprzęt przechodzi audyt przed sprzedażą |
| 5 | Dziś | 2026 | Nowoczesny salon + moment "1 000 000" | Finał: podsumowanie drogi, podziękowanie graczowi |

Przejście między epokami: krótki tekst na czarnym tle (styl "rozdziału" filmu), np. "2008: Otwieramy pierwszy sklep w Krakowie" -> płynne wejście w nową scenerię bez przerywania tempa rozgrywki.

---

## 3. PRZESZKODY = SYMBOLE WYZWAŃ BIZNESOWYCH

Przeszkody nie są przypadkowe — każda odnosi się do realnego wyzwania, które firma pokonała. Rekomendowane do wdrożenia (grafik ma pełną swobodę w stylizacji, ale znaczenie musi zostać zachowane):

- "Niesprawdzony sprzęt" (pękniety ekran / ikona usterki) — symbol ryzyka zakupu niezweryfikowanego sprzętu.
- "Zator w dostawie" (stos kartonów na drodze) — symbol logistycznych wyzwań przy skalowaniu.
- "Brak zaufania klienta" (znak zapytania) — symbol budowania relacji B2B od zera.
- Wózek widłowy / regał (epoka 2) — przeszkoda ruchowa, naturalna dla sceny magazynowej.

Zasada: przeszkody w epoce 1-2 są prostsze i rzadsze (symbolizują początki), w epoce 4-5 częstsze i szybsze (symbolizują skalę i tempo dzisiejszej firmy) — trudność rośnie zgodnie z fabułą, nie tylko mechanicznie.

---

## 4. POWER-UPY = WARTOŚCI FIRMY (nie generyczne bonusy)

Każdy power-up ma nazwę i znaczenie związane z realną wartością AMSO, nie jest to neutralny "bonus":

- "Gwarancja 48 miesięcy" — chwilowa niewrażliwość na przeszkody (tarcza ochronna).
- "Audyt jakości" — chwilowe zwolnienie tempa + podświetlenie nadchodzących przeszkód (ułatwia przejście, symbolizuje kontrolę jakości).
- "Drugie życie sprzętu" — bonusowe punkty za każdą zebraną paczkę w danym oknie czasowym (symbolizuje ekologiczny aspekt poleasingu).

Power-upy wizualnie spójne z paczkami/sprzętem, nie oderwane od świata gry.

---

## 5. FAKTY ODBLOKOWYWANE PRZEZ AKCJĘ (nie losowo, nie na ekranie startowym)

Fakty firmowe pojawiają się jako nagroda za konkretne zdarzenie w grze, w formie krótkiego komunikatu (1-2 sek, nie blokującego rozgrywki):

| Trigger w grze | Fakt do wyświetlenia |
|---|---|
| Zebranie X ikon "notebook" w jednej sesji | "Tylko w ostatnim roku sprzedaliśmy 76 tys. notebooków." |
| Przejście epoki 4 (audyt) bez kolizji | "Każdy komputer przechodzi przez ręce naszego serwisanta, zanim trafi do Ciebie." |
| Zebranie ikon "telefon" (próg do ustalenia) | "Smartfony, które sprzedajemy rocznie, ułożone jeden na drugim, tworzą wieżę wyższą niż Pałac Kultury i Nauki w Warszawie (240 m)." |
| Ukończenie epoki 2 (skalowanie) | "Dziś nasz magazyn ma 3000 m2 i realizujemy blisko 400 zamówień dziennie." |
| Ukończenie epoki 3 (klient B2B) | "Jeden z naszych partnerów biznesowych zaczął od zamówienia testowego. Współpracujemy już 7 lat." |
| Zebranie łącznej wagi paczek = próg | "Rocznie wysyłamy komputery PC o wadze ok. 400 000 kg — tyle waży 5 pełnych Boeingów 737." |

Uwaga: liczby i progi wymagają dopracowania z marketingiem (Adrian Lach/Kamil Kostur) pod kątem balansu gameplay vs. częstotliwość faktów — cel: gracz odkrywa 4-6 faktów w jednej pełnej sesji, nie więcej (unikamy przeładowania treścią).

---

## 6. EKRAN FINAŁOWY (zamiast "Game Over")

Zamiast standardowego "Koniec gry, wynik: X", finał (po przejściu 5 epok lub po kolizji) ma charakter podsumowania podróży:

- Nagłówek: "Przeszedłeś z nami kawałek drogi do miliona."
- Krótkie podsumowanie: liczba zebranych paczek w sesji + liczba odblokowanych faktów.
- Realny kontekst: "Razem z Tobą — już ponad 1 000 000 zamówień."
- CTA: link do amso.pl/million, opcjonalny kod rabatowy (do potwierdzenia z marketingiem), przycisk "Zagraj znowu" (od epoki 1) lub "Udostępnij swój wynik".

Jeśli gracz przegra w środku epoki (kolizja), gra NIE kończy się nagle na czarnym ekranie — pojawia się to samo podsumowanie, ale z adnotacją, na którym etapie historii gracz "wypadł" (np. "Zatrzymałeś się w 2015 roku — spróbuj dojść dalej!").

---

## 7. ZAKRES PRACY DLA AGENTA (AKTUALIZACJA)

Ponieważ gameplay (ruch, skok, kolizje, licznik) jest już zaimplementowany jako demo, zakres pracy koncentruje się na:

1. Refaktoryzacji struktury gry z "jednego poziomu w pętli" na "5 sekwencyjnych epok" z przejściami (cutscene).
2. Zaprojektowaniu i wdrożeniu systemu triggerów faktograficznych (event -> komunikat, patrz sekcja 5).
3. Przeprojektowaniu ekranu końcowego zgodnie z sekcją 6.
4. Aktualizacji assetów: tła dla 5 epok, zmodyfikowane przeszkody/power-upy z nowymi znaczeniami (grafika może być reużyta/przestylizowana z obecnego demo, gdzie możliwe, aby ograniczyć koszt produkcji).
5. Dodaniu logiki zapisu postępu w sesji (który fakt odblokowany, na jakim etapie gracz zakończył) — bez potrzeby backendu, localStorage wystarczy dla MVP.
6. Weryfikacji, czy obecna architektura kodu (z demo) pozwala na łatwe dodanie segmentacji poziomów, czy wymaga refaktoryzacji rdzenia gry — agent ma ocenić i zgłosić, jeśli potrzebna jest głębsza przebudowa.

**Nie zmienia się:** podstawowa mechanika sterowania (skok/unik), stack technologiczny, sposób triggerowania gry (klik na jubileuszowe logo), tracking GA4 (zdarzenia trzeba rozszerzyć o nowe eventy: epoka_ukończona, fakt_odblokowany).

---

## 8. WALIDACJA TREŚCI PRZED WDROŻENIEM

Wszystkie liczby, cytaty i historie klientów użyte w grze (sekcja 5, tabela historii B2B) pochodzą z materiałów kampanii wewnętrznej i wymagają finalnej weryfikacji przez dział marketingu AMSO (Adrian Lach, Kamil Kostur, Semen Kutsenko i Patryk Karcz) przed publikacją — w szczególności aktualność danych sprzedażowych (41 tys. PC, 76 tys. notebooków, 40 tys. LCD, 28 tys. telefonów) i zgoda na użycie konkretnej historii klienta B2B (7 lat współpracy) w formie w grze.

**Kontakt/właściciel projektu po stronie AMSO:** dział marketingu (Adrian Lach — koordynacja zadania), Semen Kutsenko (content/social).
